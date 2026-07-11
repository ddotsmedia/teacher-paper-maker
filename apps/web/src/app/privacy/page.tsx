import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <main className="prose-sm mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-muted-foreground mt-4">
        Teacher Paper Maker stores only the information needed to run your account: your name,
        email, hashed password, and teaching preferences. We never store student personal data, and
        passwords are hashed and never logged in plaintext.
      </p>
    </main>
  );
}
