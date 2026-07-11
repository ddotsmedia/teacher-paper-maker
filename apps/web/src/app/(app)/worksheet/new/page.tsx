import type { Metadata } from 'next';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button, Card, CardContent } from '@tpm/ui';

export const metadata: Metadata = { title: 'New Worksheet' };

export default function NewWorksheetPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">New Worksheet</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <PlusCircle className="text-muted-foreground h-10 w-10" />
          <p className="font-medium">Worksheet generation arrives in Phase 2</p>
          <p className="text-muted-foreground text-sm">
            AI-assisted worksheet creation is not part of this release.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
