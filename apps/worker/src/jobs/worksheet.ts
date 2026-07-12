import type { Job } from 'bullmq';
import { prisma, type Prisma } from '@tpm/database';
import { AnthropicProvider } from '@tpm/ai';
import { BlueprintSchema, GeneratedQuestionsSchema, type GeneratedQuestion } from '@tpm/schemas';
import type { WorksheetJobData } from '@tpm/queue';

const provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);

interface Usage {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
}

/**
 * Generate a worksheet: blueprint → questions per section → persist. Tracks
 * status and token/cost on the GenerationJob, and validates every AI output
 * against a Zod schema before storing.
 */
export async function generateWorksheetJob(job: Job<WorksheetJobData>): Promise<void> {
  const { documentId, jobId, spec } = job.data;

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  const usage: Usage = { inputTokens: 0, outputTokens: 0, estimatedCost: 0, latencyMs: 0 };

  try {
    const blueprint = await provider.generateStructured({
      promptVersion: 'worksheet/blueprint.v1',
      input: {
        curriculum: spec.curriculum,
        grade: spec.grade,
        subject: spec.subject,
        topic: spec.topic,
        totalMarks: spec.totalMarks,
        easyPercent: spec.difficulty.easyPercent,
        mediumPercent: spec.difficulty.mediumPercent,
        hardPercent: spec.difficulty.hardPercent,
      },
      schema: BlueprintSchema,
    });
    accumulate(usage, blueprint);

    const questions: GeneratedQuestion[] = [];
    for (const section of blueprint.output.sections) {
      const result = await provider.generateStructured({
        promptVersion: 'worksheet/questions.v1',
        input: {
          count: section.count,
          type: section.type,
          marks: section.marks_each,
          difficulty: section.difficulty,
          sectionContext: JSON.stringify({ ...spec, section }),
        },
        schema: GeneratedQuestionsSchema,
      });
      accumulate(usage, result);
      questions.push(...result.output);
    }

    await prisma.$transaction([
      prisma.question.deleteMany({ where: { documentId } }),
      prisma.question.createMany({
        data: questions.map((q, index) => ({
          documentId,
          type: q.type,
          question: q.question,
          answerJson: {
            correctAnswer: q.correct_answer,
            options: q.options ?? [],
            explanation: q.explanation,
          } as Prisma.InputJsonObject,
          marks: Math.round(q.marks),
          difficulty: q.difficulty,
          bloomLevel: q.bloom,
          displayOrder: index,
        })),
      }),
      prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'READY',
          contentJson: { spec, blueprint: blueprint.output } as Prisma.InputJsonObject,
        },
      }),
      prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          estimatedCost: usage.estimatedCost,
          latencyMs: usage.latencyMs,
        },
      }),
    ]);
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Generation failed',
      },
    });
    await prisma.document
      .update({ where: { id: documentId }, data: { status: 'DRAFT' } })
      .catch(() => undefined);
    throw error; // let BullMQ record the failure and apply ret/backoff policy
  }
}

function accumulate(usage: Usage, result: Usage): void {
  usage.inputTokens += result.inputTokens;
  usage.outputTokens += result.outputTokens;
  usage.estimatedCost += result.estimatedCost;
  usage.latencyMs += result.latencyMs;
}
