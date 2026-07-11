import type { Metadata, Viewport } from 'next';
import { Toaster } from '@tpm/ui';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Teacher Paper Maker',
    template: '%s · Teacher Paper Maker',
  },
  description: 'Create curriculum-aligned worksheets and papers in minutes.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
