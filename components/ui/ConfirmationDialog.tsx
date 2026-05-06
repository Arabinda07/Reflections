import React from 'react';
import { Warning, Sparkle } from '@phosphor-icons/react';
import { Button } from './Button';
import { ModalSheet } from './ModalSheet';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  variant?: 'danger' | 'primary';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  variant = 'danger',
}) => {
  const resolvedTitle =
    title || (variant === 'danger' ? 'Delete this entry?' : 'Confirm this step?');
  const resolvedDescription =
    description ||
    (variant === 'danger'
      ? 'This action is permanent and cannot be undone.'
      : 'Please confirm to continue.');

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      tone={variant === 'danger' ? 'clay' : 'paper'}
      title={resolvedTitle}
      description={resolvedDescription}
      icon={
        variant === 'danger' ? (
          <Warning size={20} weight="fill" />
        ) : (
          <Sparkle size={20} weight="duotone" />
        )
      }
      footer={
        <div className="flex flex-col gap-3">
          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={isConfirming}
            className="w-full h-14 text-[15px] font-extrabold"
          >
            {confirmLabel}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isConfirming}
            className="w-full h-14 text-[15px] font-extrabold"
          >
            {cancelLabel}
          </Button>
        </div>
      }
      bodyClassName="pt-2"
    />
  );
};
