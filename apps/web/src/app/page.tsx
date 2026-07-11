import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@tpm/ui';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold">Teacher Paper Maker</span>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Curriculum-aligned worksheets in minutes
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Build, edit, and export print-ready papers for your class. Set up your teaching profile
          once and generate worksheets tailored to your curriculum, grades, and subjects.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/auth/register">Create free account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-sm">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} Teacher Paper Maker</span>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}
