import { Download, FileText } from '@phosphor-icons/react';
import React from 'react';

import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import type { Note } from '../../types';
import { downloadNoteExport, type NoteExportFormat } from './noteExport';

interface NoteExportDialogProps {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
}

const EXPORT_OPTIONS: Array<{
  format: NoteExportFormat;
  label: string;
  description: string;
}> = [
  {
    format: 'txt',
    label: 'Plain text',
    description: 'A clean copy for any notes app.',
  },
  {
    format: 'md',
    label: 'Markdown',
    description: 'Text, metadata, and tasks in a portable format.',
  },
];

export const NoteExportDialog: React.FC<NoteExportDialogProps> = ({
  isOpen,
  note,
  onClose,
}) => {
  const handleExport = (format: NoteExportFormat) => {
    if (!note) return;

    downloadNoteExport(note, format);
    onClose();
  };

  return (
    <ModalSheet
      isOpen={isOpen && Boolean(note)}
      onClose={onClose}
      title="Export note"
      description="Download a local copy. Your saved reflection stays unchanged."
      icon={<Download size={20} weight="duotone" />}
      size="md"
      footer={
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {EXPORT_OPTIONS.map((option) => (
          <button
            key={option.format}
            type="button"
            onClick={() => handleExport(option.format)}
            className="flex min-h-11 w-full items-center gap-4 rounded-[var(--radius-panel)] border border-border bg-white/5 px-4 py-4 text-left transition-all hover:border-green/25 hover:bg-green/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-border bg-white text-green shadow-sm dark:bg-white/10">
              <FileText size={20} weight="duotone" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-black text-gray-text">
                {option.label}
              </span>
              <span className="mt-1 block text-[12px] font-medium leading-relaxed text-gray-light">
                {option.description}
              </span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-nav">
              .{option.format}
            </span>
          </button>
        ))}
      </div>
    </ModalSheet>
  );
};
