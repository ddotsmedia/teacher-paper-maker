import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpm/ui';
import { auth } from '@/auth';
import { getTeacherProfile } from '@/server/teacher-service';
import { ProfileForm } from '@/components/ProfileForm';
import type { Curriculum, Grade, Subject } from '@tpm/schemas';

export const metadata: Metadata = { title: 'Set up your profile' };
export const dynamic = 'force-dynamic';

export default async function OnboardingProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const profile = await getTeacherProfile(session.user.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-start justify-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Set up your teaching profile</CardTitle>
          <CardDescription>
            Tell us what you teach so we can tailor worksheets to your classes. You can change this
            later in Settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            redirectTo="/dashboard"
            submitLabel="Save and continue"
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
