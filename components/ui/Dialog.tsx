import React from 'react';
import { ModalSheet } from './ModalSheet';
import type { SurfaceTone } from './surfaceTone';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  tone?: SurfaceTone;
  className?: string;
}

/**
 * Centered dialog for confirmations, alerts, and focused interactions.
 * Wraps ModalSheet with `mobilePlacement="center"`.
 */
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'sm',
  tone = 'paper',
  className = '',
}) => (
  <ModalSheet
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    description={description}
    icon={icon}
    footer={footer}
    mobilePlacement="center"
    tone={tone}
    size={size}
    className={className}
  >
    {children}
  </ModalSheet>
);
