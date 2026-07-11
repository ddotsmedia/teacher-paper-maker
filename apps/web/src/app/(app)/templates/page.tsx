import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@tpm/ui';

export const metadata: Metadata = { title: 'Saved Templates' };

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Saved Templates</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <FileText className="text-muted-foreground h-10 w-10" />
          <p className="font-medium">Templates are coming soon</p>
          <p className="text-muted-foreground text-sm">
            Save worksheet layouts as reusable templates in a later phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
