import React from 'react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/faq', label: 'How it works' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/about', label: 'About' },
];

export const PublicFooter: React.FC = () => (
  <footer className="mx-auto w-full max-w-[1440px] border-t border-border px-6 py-10 sm:px-10 lg:px-16">
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
