import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  return (
    <AppShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
