import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, PlusCircle } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@tpm/ui';
import { auth } from '@/auth';
import { getDocumentStats, listDocuments } from '@/server/documents-service';
import { DocumentRowActions } from '@/components/DocumentRowActions';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  READY: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  DRAFT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  GENERATING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [stats, { documents }] = await Promise.all([
    getDocumentStats(userId),
    listDocuments(userId, { limit: 10, sort: 'recent' }),
  ]);

  const name = session!.user.name ?? 'Teacher';

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {name}</h1>
          <p className="text-muted-foreground text-sm">
            {stats.total} worksheet{stats.total === 1 ? '' : 's'} · {stats.createdToday} created
            today
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/worksheet/new">
            <PlusCircle className="h-5 w-5" />
            New Worksheet
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText className="text-muted-foreground h-10 w-10" />
              <div>
                <p className="font-medium">No documents yet</p>
                <p className="text-muted-foreground text-sm">
                  Create your first worksheet to get started.
                </p>
              </div>
              <Button asChild>
                <Link href="/worksheet/new">Get Started</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="hidden py-2 pr-4 font-medium sm:table-cell">Subject</th>
                    <th className="hidden py-2 pr-4 font-medium sm:table-cell">Grade</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="hidden py-2 pr-4 font-medium md:table-cell">Updated</th>
                    <th className="py-2 pl-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{doc.title}</td>
                      <td className="text-muted-foreground hidden py-3 pr-4 sm:table-cell">
                        {doc.subject ?? '—'}
                      </td>
                      <td className="text-muted-foreground hidden py-3 pr-4 sm:table-cell">
                        {doc.grade ?? '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[doc.status] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="text-muted-foreground hidden py-3 pr-4 md:table-cell">
                        {formatDate(doc.updatedAt)}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <DocumentRowActions title={doc.title} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
