import React from 'react';
import { Link } from 'react-router-dom';
import { RoutePath } from '../../types';

const links = [
  { href: RoutePath.HOME, label: 'Home' },
  { href: RoutePath.FAQ, label: 'How it works' },
  { href: RoutePath.PRIVACY, label: 'Privacy' },
  { href: RoutePath.ABOUT, label: 'About' },
];

export const PublicFooter: React.FC = () => (
  <footer className="screen-scrim screen-scrim--strong mt-auto w-full border-t border-border py-12 transition-colors duration-300">
    <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-8 px-6 sm:flex-row md:px-16">
      <nav aria-label="Public pages" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-10">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-[11px] font-black uppercase tracking-widest text-gray-nav transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="text-[11px] font-black uppercase tracking-widest text-gray-nav/60">
        © 2026{' '}
        <a
          href="https://arabinda07.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center transition-colors duration-300 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          aria-label="Arabinda's portfolio (opens in new tab)"
        >
          Arabinda
        </a>
      </div>
    </div>
  </footer>
);
