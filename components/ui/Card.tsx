import React from 'react';
import { Surface } from './Surface';
import type { SurfaceTone } from './surfaceTone';

/* ─── Card ─── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'bezel' | 'flat';
  tone?: SurfaceTone;
}

export const Card: React.FC<CardProps> = (
  { variant = 'flat', tone = 'inherit', className = '', children, ...props },
) => (
  <Surface variant={variant} tone={tone} className={`overflow-hidden ${className}`} {...props}>
    {children}
  </Surface>
);
Card.displayName = 'Card';

/* ─── CardHeader ─── */
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '', ...props
}) => <div className={`flex flex-col gap-1.5 p-6 pb-0 ${className}`} {...props} />;

/* ─── CardTitle ─── */
export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '', ...props
}) => <h3 className={`text-[18px] font-display font-bold text-gray-text leading-snug ${className}`} {...props} />;

/* ─── CardDescription ─── */
export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '', ...props
}) => <p className={`text-[14px] font-medium leading-relaxed text-gray-light ${className}`} {...props} />;

/* ─── CardContent ─── */
export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '', ...props
}) => <div className={`p-6 ${className}`} {...props} />;

/* ─── CardFooter ─── */
export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '', ...props
}) => <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />;
