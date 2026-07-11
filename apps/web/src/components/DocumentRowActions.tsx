'use client';

import { Copy, Download, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from '@tpm/ui';

/** Row-level quick actions. Wiring lands in later phases; buttons are present now. */
export function DocumentRowActions({ title }: { title: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${title}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => toast.info('Export is available in a later phase.')}>
          <Download className="h-4 w-4" />
          Export
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast.info('Duplicate is available in a later phase.')}>
          <Copy className="h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => toast.info('Delete is available in a later phase.')}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
