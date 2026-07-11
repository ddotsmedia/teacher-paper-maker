'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  User,
  X,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@tpm/ui';

export interface AppShellUser {
  name: string | null;
  email: string | null;
  image: string | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/worksheet/new', label: 'New Worksheet', icon: PlusCircle },
  { href: '/templates', label: 'Saved Templates', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function initials(user: AppShellUser): string {
  const source = user.name ?? user.email ?? '?';
  return source
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppShell({ user, children }: { user: AppShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <FileText className="text-primary h-5 w-5" />
            <span>Teacher Paper Maker</span>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ring-offset-background focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2"
              aria-label="Open user menu"
            >
              <Avatar>
                {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                <AvatarFallback>{initials(user)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="truncate">{user.name ?? 'Teacher'}</span>
                <span className="text-muted-foreground truncate text-xs font-normal">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: '/auth/login' })}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r md:block">{sidebar}</aside>

        {mobileOpen ? (
          <>
            <div
              className="fixed inset-0 top-14 z-20 bg-black/40 md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <aside className="bg-background fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-60 border-r md:hidden">
              {sidebar}
            </aside>
          </>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 p-4 sm:p-6">{children}</main>
          <footer className="text-muted-foreground border-t px-4 py-4 text-xs sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <span>© {new Date().getFullYear()} Teacher Paper Maker</span>
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
