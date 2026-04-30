import React, { createContext, useContext, useState } from 'react';

/* ─── Tabs ─── */
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  value: '',
  onValueChange: () => {},
});

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className = '' }) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={className}>{children}</div>
  </TabsContext.Provider>
);

/* ─── TabsList ─── */
export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div
    role="tablist"
    className={`inline-flex items-center gap-1 rounded-[var(--radius-panel)] border border-border/60 bg-body/50 p-1 ${className}`}
    {...props}
  />
);

/* ─── TabsTrigger ─── */
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  icon,
  activeIcon,
  children,
  className = '',
  ...props
}) => {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={`inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-chip)] px-4 py-2 text-[12px] font-extrabold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30 ${
        isActive
          ? 'bg-green/10 text-green border border-green/20 shadow-sm'
          : 'text-gray-nav hover:text-green hover:bg-green/5 border border-transparent'
      } ${className}`}
      {...props}
    >
      {isActive && activeIcon ? activeIcon : icon}
      {children}
    </button>
  );
};

/* ─── TabsContent ─── */
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className = '',
  ...props
}) => {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;

  return <div role="tabpanel" className={className} {...props} />;
};
