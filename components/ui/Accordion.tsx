import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretRight } from '@phosphor-icons/react';
import { softTransition } from './motionPresets';

interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  icon,
  isOpen: controlledIsOpen,
  onToggle,
  className = '',
  triggerClassName = '',
  contentClassName = '',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className={`border-b border-border/40 last:border-0 ${className}`.trim()}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className={`group flex w-full items-center justify-between gap-4 py-4 text-left transition-colors focus:outline-none ${triggerClassName}`.trim()}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="flex shrink-0 items-center justify-center">{icon}</div>}
          <div className="text-[12px] font-black uppercase tracking-widest text-gray-nav group-hover:text-gray-text transition-colors">
            {title}
          </div>
        </div>
        <CaretRight
          size={16}
          weight="regular"
          className={`shrink-0 text-gray-nav/60 transition-transform duration-500 ease-out-expo ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={softTransition}
            className="overflow-hidden"
          >
            <div className={`pb-6 ${contentClassName}`.trim()}>
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
