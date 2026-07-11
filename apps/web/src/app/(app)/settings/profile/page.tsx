import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpm/ui';
import { auth } from '@/auth';
import { getTeacherProfile } from '@/server/teacher-service';
import { ProfileForm } from '@/components/ProfileForm';
import type { Curriculum, Grade, Subject } from '@tpm/schemas';

export const metadata: Metadata = { title: 'Profile' };
export const dynamic = 'force-dynamic';

export default async function SettingsProfilePage() {
  const session = await auth();
  const profile = await getTeacherProfile(session!.user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Teaching profile</CardTitle>
          <CardDescription>Update your school, curriculum, grades, and subjects.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            submitLabel="Save changes"
            initial={{
              schoolName: profile?.schoolName ?? '',
              preferredCurriculum: (profile?.preferredCurriculum as Curriculum | undefined) ?? '',
              preferredGrades: (profile?.preferredGrades as Grade[] | undefined) ?? [],
              preferredSubjects: (profile?.preferredSubjects as Subject[] | undefined) ?? [],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
