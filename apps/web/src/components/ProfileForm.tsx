'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SUPPORTED_CURRICULA,
  SUPPORTED_GRADES,
  SUPPORTED_SUBJECTS,
  TeacherProfileSchema,
  type Curriculum,
  type Grade,
  type Subject,
} from '@tpm/schemas';
import {
  Button,
  Checkbox,
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

export interface ProfileFormValues {
  schoolName: string;
  preferredCurriculum: Curriculum | '';
  preferredGrades: Grade[];
  preferredSubjects: Subject[];
}

export function ProfileForm({
  initial,
  redirectTo,
  submitLabel = 'Save',
}: {
  initial?: Partial<ProfileFormValues>;
  redirectTo?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileFormValues>({
    schoolName: initial?.schoolName ?? '',
    preferredCurriculum: initial?.preferredCurriculum ?? '',
    preferredGrades: initial?.preferredGrades ?? [],
    preferredSubjects: initial?.preferredSubjects ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const payload = {
      schoolName: values.schoolName.trim() || undefined,
      preferredCurriculum: values.preferredCurriculum || undefined,
      preferredGrades: values.preferredGrades,
      preferredSubjects: values.preferredSubjects,
    };

    const parsed = TeacherProfileSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));
      return;
    }

    setSubmitting(true);
    const result = await apiRequest('/api/teacher/profile', { method: 'PUT', body: parsed.data });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error?.error ?? 'Could not save profile');
      return;
    }

    toast.success('Profile saved');
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <FormField id="schoolName" label="School name" error={errors.schoolName}>
        <Input
          id="schoolName"
          value={values.schoolName}
          placeholder="e.g. Springfield International School"
          onChange={(e) => setValues((v) => ({ ...v, schoolName: e.target.value }))}
        />
      </FormField>

      <FormField id="curriculum" label="Preferred curriculum" error={errors.preferredCurriculum}>
        <Select
          value={values.preferredCurriculum || undefined}
          onValueChange={(value) =>
            setValues((v) => ({ ...v, preferredCurriculum: value as Curriculum }))
          }
        >
          <SelectTrigger id="curriculum">
            <SelectValue placeholder="Select a curriculum" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRICULA.map((curriculum) => (
              <SelectItem key={curriculum} value={curriculum}>
                {curriculum}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="space-y-2">
        <Label>Grades</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SUPPORTED_GRADES.map((grade) => (
            <label
              key={grade}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <Checkbox
                checked={values.preferredGrades.includes(grade)}
                onCheckedChange={() =>
                  setValues((v) => ({ ...v, preferredGrades: toggle(v.preferredGrades, grade) }))
                }
              />
              {grade}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Subjects</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SUPPORTED_SUBJECTS.map((subject) => (
            <label
              key={subject}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <Checkbox
                checked={values.preferredSubjects.includes(subject)}
                onCheckedChange={() =>
                  setValues((v) => ({
                    ...v,
                    preferredSubjects: toggle(v.preferredSubjects, subject),
                  }))
                }
              />
              {subject}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
