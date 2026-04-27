import React from 'react';

import { Button } from './Button';
import { Card } from './Card';
import { ConfirmationDialog } from './ConfirmationDialog';
import { EmptyState } from './EmptyState';
import { ModalSheet } from './ModalSheet';
import { Textarea, TextareaProps } from './Textarea';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const steadyHover = { scale: 1 };
const steadyTap = { scale: 0.99 };

type ButtonBaseProps = React.ComponentPropsWithoutRef<typeof Button>;
type ActionProps = Omit<ButtonBaseProps, 'variant'>;

export const FloatingPanel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Card> & {
    padded?: boolean;
    strong?: boolean;
  }
>(({ className = '', padded = true, strong = false, ...props }, ref) => (
  <Card
    ref={ref}
    className={cx(
      'border-border-subtle bg-[var(--surface-floating)] backdrop-blur-md',
      'shadow-[0_20px_40px_-30px_rgba(0,0,0,0.18)]',
      strong && 'bg-[var(--surface-floating-strong)]',
      padded && 'p-6 md:p-8',
      className,
    )}
    {...props}
  />
));

FloatingPanel.displayName = 'FloatingPanel';

export const PrimaryAction = React.forwardRef<HTMLButtonElement, ActionProps>(
  ({ className = '', whileHover = steadyHover, whileTap = steadyTap, ...props }, ref) => (
    <Button
      ref={ref}
      variant="primary"
      className={cx('rounded-[var(--radius-control)] bg-primary text-primary-foreground', className)}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    />
  ),
);

PrimaryAction.displayName = 'PrimaryAction';

export const QuietAction = React.forwardRef<
  HTMLButtonElement,
  ActionProps & {
    quietVariant?: 'ghost' | 'outline' | 'secondary';
  }
>(({ className = '', quietVariant = 'ghost', whileHover = steadyHover, whileTap = steadyTap, ...props }, ref) => (
  <Button
    ref={ref}
    variant={quietVariant}
    className={cx('rounded-[var(--radius-control)] focus-visible:ring-[var(--ring-focus)]', className)}
    whileHover={whileHover}
    whileTap={whileTap}
    {...props}
  />
));

QuietAction.displayName = 'QuietAction';

export const DestructiveAction = React.forwardRef<HTMLButtonElement, ActionProps>(
  ({ className = '', whileHover = steadyHover, whileTap = steadyTap, ...props }, ref) => (
    <Button
      ref={ref}
      variant="danger"
      className={cx('rounded-[var(--radius-control)] bg-destructive text-destructive-foreground', className)}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    />
  ),
);

DestructiveAction.displayName = 'DestructiveAction';

export const NOTE_EDITOR_PLACEHOLDERS = [
  'Start with what is here.',
  'A few lines are enough.',
  'What do you want to remember about today?',
  'Write the part you keep returning to.',
] as const;

export type NoteEditorPlaceholder = (typeof NOTE_EDITOR_PLACEHOLDERS)[number];

export interface NoteEditorProps extends Omit<TextareaProps, 'placeholder'> {
  controls?: React.ReactNode;
  footer?: React.ReactNode;
  label?: string;
  placeholder?: NoteEditorPlaceholder;
  textareaClassName?: string;
}

export const NoteEditor = React.forwardRef<HTMLTextAreaElement, NoteEditorProps>(
  (
    {
      className = '',
      controls,
      footer,
      label,
      placeholder = 'Start with what is here.',
      textareaClassName = '',
      ...props
    },
    ref,
  ) => (
    <div className={cx('flex w-full flex-col gap-3', className)}>
      {label ? (
        <label htmlFor={props.id} className="text-ui-sm font-semibold text-gray-nav">
          {label}
        </label>
      ) : null}
      <Textarea
        ref={ref}
        placeholder={placeholder}
        className={cx('min-h-[min(60vh,34rem)] bg-transparent', textareaClassName)}
        {...props}
      />
      {(controls || footer) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">{controls}</div>
          {footer ? <div className="text-ui-sm text-gray-light">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  ),
);

NoteEditor.displayName = 'NoteEditor';

export const ReflectionDialog: React.FC<React.ComponentProps<typeof ModalSheet>> = ({
  mobilePlacement = 'center',
  panelClassName = '',
  ...props
}) => (
  <ModalSheet
    mobilePlacement={mobilePlacement}
    panelClassName={cx('bg-surface text-foreground', panelClassName)}
    {...props}
  />
);

export const DestructiveConfirmDialog: React.FC<
  Omit<React.ComponentProps<typeof ConfirmationDialog>, 'variant'> & {
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }
> = ({
  title = 'Delete note?',
  description = 'This permanently deletes this note from Reflections. This cannot be undone.',
  confirmLabel = 'Delete note',
  cancelLabel = 'Cancel',
  ...props
}) => (
  <ConfirmationDialog
    variant="danger"
    title={title}
    description={description}
    confirmLabel={confirmLabel}
    cancelLabel={cancelLabel}
    {...props}
  />
);

export const CalmEmptyState: React.FC<React.ComponentProps<typeof EmptyState>> = ({
  surface = 'flat',
  ...props
}) => <EmptyState surface={surface} {...props} />;

export const QUIET_TOAST_COPY = {
  saved: 'Saved.',
  deleted: 'Deleted.',
  reflectionRefreshed: 'Reflection refreshed.',
  exportReady: 'Export ready.',
  saveFailed: 'I couldn’t save this just now. Please try again.',
} as const;

export interface QuietToastProps extends React.HTMLAttributes<HTMLDivElement> {
  message: React.ReactNode;
  tone?: 'neutral' | 'success' | 'error';
}

export const QuietToast: React.FC<QuietToastProps> = ({
  className = '',
  message,
  tone = 'neutral',
  ...props
}) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={cx(
      'rounded-[var(--radius-control)] border border-border-subtle bg-[var(--surface-floating-strong)] px-4 py-3 text-ui-sm font-semibold text-foreground shadow-none backdrop-blur-md',
      tone === 'error' && 'border-destructive/30 text-destructive',
      tone === 'success' && 'border-primary/20 text-primary',
      className,
    )}
    {...props}
  >
    {message}
  </div>
);
