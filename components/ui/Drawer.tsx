import React from 'react';
import { ModalSheet } from './ModalSheet';
import type { SurfaceTone } from './surfaceTone';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tone?: SurfaceTone;
  className?: string;
}

/**
 * Bottom-sheet drawer for mobile contexts.
 * Thin wrapper around ModalSheet with `mobilePlacement="bottom"`.
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
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
    mobilePlacement="bottom"
    tone={tone}
    size="lg"
    className={className}
  >
    {children}
  </ModalSheet>
);
