'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SUPPORTED_CURRICULA,
  SUPPORTED_GRADES,
  SUPPORTED_SUBJECTS,
  WorksheetSpecificationSchema,
  type Curriculum,
  type Grade,
  type Subject,
} from '@tpm/schemas';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@tpm/ui';
import { apiRequest } from '@/lib/api-client';
import { flattenIssues } from '@/lib/form';

interface FormState {
  curriculum: Curriculum;
  grade: Grade;
  subject: Subject;
  chapter: string;
  topic: string;
  totalMarks: number;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
}

const TOTAL_STEPS = 4;
const STEP_TITLES = ['Class', 'Topic', 'Difficulty', 'Review'];

export default function NewWorksheetPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    curriculum: 'CBSE',
    grade: '5',
    subject: 'Science',
    chapter: '',
    topic: '',
    totalMarks: 20,
    easyPercent: 50,
    mediumPercent: 30,
    hardPercent: 20,
  });

  const difficultySum = form.easyPercent + form.mediumPercent + form.hardPercent;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildSpec() {
    return {
      curriculum: form.curriculum,
      grade: form.grade,
      subject: form.subject,
      chapter: form.chapter.trim() || undefined,
      topic: form.topic.trim(),
      totalMarks: form.totalMarks,
      difficulty: {
        easyPercent: form.easyPercent,
        mediumPercent: form.mediumPercent,
        hardPercent: form.hardPercent,
      },
    };
  }

  async function handleGenerate() {
    setErrors({});
    const parsed = WorksheetSpecificationSchema.safeParse(buildSpec());
    if (!parsed.success) {
      const fieldErrors = flattenIssues(parsed.error);
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0] ?? 'Please fix the form and try again.');
      return;
    }

    setLoading(true);
    const result = await apiRequest<{ jobId: string; documentId: string }>('/api/worksheets', {
      method: 'POST',
      body: parsed.data,
    });
    setLoading(false);

    if (!result.ok || !result.data) {
      toast.error(result.error?.error ?? 'Could not start generation.');
      return;
    }

    toast.success('Generating your worksheet…');
    router.push(`/worksheet/${result.data.documentId}/edit?jobId=${result.data.jobId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Worksheet</CardTitle>
          <CardDescription>
            Step {step} of {TOTAL_STEPS} · {STEP_TITLES[step - 1]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <FormField id="curriculum" label="Curriculum">
                <Select
                  value={form.curriculum}
                  onValueChange={(v) => set('curriculum', v as Curriculum)}
                >
                  <SelectTrigger id="curriculum">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRICULA.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField id="grade" label="Grade">
                <Select value={form.grade} onValueChange={(v) => set('grade', v as Grade)}>
                  <SelectTrigger id="grade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        Grade {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField id="subject" label="Subject">
                <Select value={form.subject} onValueChange={(v) => set('subject', v as Subject)}>
                  <SelectTrigger id="subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <FormField id="chapter" label="Chapter (optional)">
                <Input
                  id="chapter"
                  value={form.chapter}
                  placeholder="e.g. Chapter 4: Photosynthesis"
                  onChange={(e) => set('chapter', e.target.value)}
                />
              </FormField>
              <FormField id="topic" label="Topic" error={errors.topic}>
                <Input
                  id="topic"
                  value={form.topic}
                  placeholder="e.g. How plants make food"
                  aria-invalid={Boolean(errors.topic)}
                  onChange={(e) => set('topic', e.target.value)}
                />
              </FormField>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <FormField
                id="totalMarks"
                label={`Total marks: ${form.totalMarks}`}
                error={errors.totalMarks}
              >
                <input
                  id="totalMarks"
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={form.totalMarks}
                  onChange={(e) => set('totalMarks', Number(e.target.value))}
                  className="w-full"
                />
              </FormField>

              <div className="space-y-2">
                <Label>Difficulty distribution</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easyPercent', 'mediumPercent', 'hardPercent'] as const).map((key) => (
                    <FormField key={key} id={key} label={key.replace('Percent', '')}>
                      <Input
                        id={key}
                        type="number"
                        min={0}
                        max={100}
                        value={form[key]}
                        onChange={(e) => set(key, Number(e.target.value))}
                      />
                    </FormField>
                  ))}
                </div>
                <p
                  className={`text-sm ${difficultySum === 100 ? 'text-muted-foreground' : 'text-destructive'}`}
                >
                  Total: {difficultySum}% {difficultySum === 100 ? '' : '(must equal 100%)'}
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Curriculum</dt>
              <dd>{form.curriculum}</dd>
              <dt className="text-muted-foreground">Grade</dt>
              <dd>{form.grade}</dd>
              <dt className="text-muted-foreground">Subject</dt>
              <dd>{form.subject}</dd>
              <dt className="text-muted-foreground">Topic</dt>
              <dd>{form.topic || '—'}</dd>
              <dt className="text-muted-foreground">Total marks</dt>
              <dd>{form.totalMarks}</dd>
              <dt className="text-muted-foreground">Difficulty</dt>
              <dd>
                {form.easyPercent}/{form.mediumPercent}/{form.hardPercent} (easy/med/hard)
              </dd>
            </dl>
          )}

          <div className="flex items-center gap-3 pt-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {step < TOTAL_STEPS && (
              <Button
                className="ml-auto"
                disabled={step === 2 && form.topic.trim().length < 2}
                onClick={() => setStep((s) => s + 1)}
              >
                Next
              </Button>
            )}
            {step === TOTAL_STEPS && (
              <Button
                className="ml-auto"
                loading={loading}
                disabled={difficultySum !== 100 || form.topic.trim().length < 2}
                onClick={handleGenerate}
              >
                Generate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
