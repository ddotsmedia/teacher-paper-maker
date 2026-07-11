import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <main className="prose-sm mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Terms of Service</h1>
      <p className="text-muted-foreground mt-4">
        Teacher Paper Maker is provided to help teachers create classroom materials. You are
        responsible for reviewing generated content before use. This is a demo release; the service
        is provided as-is without warranty.
      </p>
    </main>
  );
}
