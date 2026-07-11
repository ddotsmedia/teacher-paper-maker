import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, User } from 'lucide-react';
import { Card, CardContent } from '@tpm/ui';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardContent className="p-0">
          <Link
            href="/settings/profile"
            className="hover:bg-accent flex items-center justify-between px-6 py-4"
          >
            <span className="flex items-center gap-3">
              <User className="text-muted-foreground h-5 w-5" />
              <span>
                <span className="block font-medium">Teaching profile</span>
                <span className="text-muted-foreground block text-sm">
                  School, curriculum, grades, subjects
                </span>
              </span>
            </span>
            <ChevronRight className="text-muted-foreground h-5 w-5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
