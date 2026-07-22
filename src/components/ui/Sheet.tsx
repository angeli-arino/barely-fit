import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, title, description, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] data-[state=open]:animate-rise" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-[28px] border border-b-0 border-[var(--border)] bg-[var(--bg-elevated)] p-5 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[var(--shadow-2)] outline-none md:left-1/2 md:top-1/2 md:bottom-auto md:w-[min(560px,calc(100vw-40px))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-xl)] md:border">
          <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-[var(--border-strong)] md:hidden" />
          <div className="pr-12">
            <Dialog.Title className="text-xl font-bold tracking-[-.025em]">{title}</Dialog.Title>
            {description && <Dialog.Description className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{description}</Dialog.Description>}
          </div>
          <Dialog.Close className="absolute right-4 top-4 grid size-11 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]" aria-label="Close">
            <X size={20} />
          </Dialog.Close>
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
