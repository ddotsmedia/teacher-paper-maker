'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Spinner,
  Textarea,
  toast,
} from '@tpm/ui';
import { apiRequest } from '@/lib/api-client';

interface EditorQuestion {
  id: string;
  type: string;
  question: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  marks: number;
  difficulty: string;
  bloomLevel: string;
  displayOrder: number;
}

interface WorksheetResponse {
  id: string;
  title: string;
  status: string;
  questions: EditorQuestion[];
}

type Phase = 'generating' | 'ready' | 'error';

function Editor() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;

  const [phase, setPhase] = useState<Phase>('generating');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<EditorQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const jobId = searchParams.get('jobId');

    async function loadDoc() {
      const res = await apiRequest<WorksheetResponse>(`/api/worksheets/${id}`);
      if (cancelled) return;
      if (res.ok && res.data) {
        setTitle(res.data.title);
        setQuestions(res.data.questions);
        setPhase('ready');
      } else {
        setPhase('error');
      }
    }

    async function poll() {
      if (!jobId) {
        await loadDoc();
        return;
      }
      const res = await apiRequest<{ status: string }>(`/api/jobs/${jobId}`);
      if (cancelled) return;

      const status = res.data?.status;
      if (status === 'SUCCESS') {
        await loadDoc();
      } else if (status === 'FAILED' || !res.ok) {
        setPhase('error');
      } else {
        setPhase('generating');
        timer = setTimeout(() => void poll(), 2000);
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, searchParams]);

  function updateQuestion(index: number, patch: Partial<EditorQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  async function save() {
    setSaving(true);
    const res = await apiRequest(`/api/worksheets/${id}`, {
      method: 'PUT',
      body: {
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
        })),
      },
    });
    setSaving(false);
    if (res.ok) toast.success('Worksheet saved');
    else toast.error(res.error?.error ?? 'Could not save worksheet');
  }

  if (phase === 'generating') {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Spinner className="h-8 w-8" />
        <p className="font-medium">Generating your worksheet…</p>
        <p className="text-muted-foreground text-sm">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Alert variant="destructive">
          <AlertTitle>Generation failed</AlertTitle>
          <AlertDescription>
            We couldn&apos;t generate this worksheet. Please try creating it again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <Button loading={saving} onClick={save}>
          Save worksheet
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="text-muted-foreground text-sm">This worksheet has no questions yet.</p>
      ) : (
        questions.map((q, index) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Q{index + 1} · {q.type} · {q.marks} mark{q.marks === 1 ? '' : 's'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField id={`q-${q.id}`} label="Question">
                <Textarea
                  id={`q-${q.id}`}
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestion(index, { question: e.target.value })}
                />
              </FormField>
              {q.options.length > 0 ? (
                <ul className="text-muted-foreground list-disc pl-5 text-sm">
                  {q.options.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              ) : null}
              <FormField id={`a-${q.id}`} label="Correct answer">
                <Input
                  id={`a-${q.id}`}
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(index, { correctAnswer: e.target.value })}
                />
              </FormField>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default function EditWorksheetPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
