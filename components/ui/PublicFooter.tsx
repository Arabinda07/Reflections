import React from 'react';
import { RoutePath } from '../../types';

const links = [
  { href: RoutePath.HOME, label: 'Home' },
  { href: RoutePath.FAQ, label: 'How it works' },
  { href: RoutePath.PRIVACY, label: 'Privacy' },
  { href: RoutePath.ABOUT, label: 'About' },
];

type PublicFooterProps = {
  className?: string;
};

export const PublicFooter: React.FC<PublicFooterProps> = ({ className = '' }) => (
  <footer className={`mx-auto w-full max-w-[1440px] border-t border-border px-6 py-10 sm:px-10 lg:px-16 ${className}`}>
    <nav aria-label="Public pages" className="flex flex-wrap items-center gap-x-8 gap-y-3">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-[13px] font-bold uppercase tracking-widest text-gray-nav transition-colors duration-300 hover:text-green"
        >
          {link.label}
        </a>
      ))}
    </nav>
  </footer>
);
