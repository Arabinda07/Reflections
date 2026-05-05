import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  Leaf,
  PaperPlaneTilt,
  List,
  X,
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../hooks/useAuthStore';
import { RoutePath } from '../types';

interface NavItem {
  label: string;
  path: string;
}

interface NavigationBarProps {
  navItems: NavItem[];
  isLandingRoute: boolean;
  isMobileNavSuppressed: boolean;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  onInvite: () => void;
}

/**
 * Top navigation bar.
 * Owns dark mode toggle, desktop nav links, auth actions, and mobile hamburger trigger.
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({
  navItems,
  isLandingRoute,
  isMobileNavSuppressed,
  isMobileMenuOpen,
  onMobileMenuToggle,
  onInvite,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const landingControlClass = isLandingRoute
    ? 'hero-ink hover:text-green hover:bg-white/10'
    : 'text-gray-nav hover:text-green hover:bg-green/5';

  const DarkModeToggle = (
    <button
      onClick={toggleDarkMode}
      className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${landingControlClass}`}
      title="Toggle Dark Mode"
      aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
    >
      <div className="relative h-5 w-5">
        <div className={`absolute inset-0 transition-all duration-300 ease-out-expo ${isDarkMode ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`}>
          <Sun size={20} />
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ease-out-expo ${!isDarkMode ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}>
          <Moon size={20} />
        </div>
      </div>
    </button>
  );

  return (
    <nav
      className={`z-[100] flex-none flex justify-center transition-colors duration-500 ${
        isLandingRoute
          ? 'landing-nav-scrim fixed left-0 right-0 top-0 pt-[env(safe-area-inset-top)]'
          : 'bg-body/95 pt-[env(safe-area-inset-top)]'
      }`}
    >
      <div className="flex h-14 w-full max-w-[1440px] min-w-0 items-center justify-between gap-3 px-4 md:px-8 xl:px-10">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <Link
            to={RoutePath.HOME}
            className="group flex min-h-11 items-center gap-2"
            aria-label="Reflections — go to home"
          >
            <div className="h-10 w-10 rounded-xl bg-green flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-12">
              <Leaf size={24} weight="fill" />
            </div>
            <span className="font-serif italic text-[22px] sm:text-[26px] text-green tracking-normal truncate max-w-[150px] sm:max-w-none">
              Reflections
            </span>
          </Link>
        </div>

        {/* Right Side - Desktop Nav */}
        <div
          className={`${isMobileNavSuppressed ? 'hidden lg:flex' : 'flex'} hidden lg:flex items-center gap-1.5 xl:gap-2`}
        >
          {DarkModeToggle}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-[12px] font-extrabold transition-all duration-200 hover:bg-green/5 hover:text-green xl:px-4 xl:text-[13px] ${
                  isActive
                    ? 'bg-green/5 text-green'
                    : 'text-gray-nav'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div
            className="w-[1px] h-[24px] bg-border mx-2"
            role="separator"
            aria-orientation="vertical"
          ></div>
          {isAuthenticated ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onInvite}
                className="gap-2 px-3 xl:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
              >
                Invite
                <PaperPlaneTilt size={16} weight="regular" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="px-3 text-clay hover:bg-clay/5 xl:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
              >
                Logout
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(RoutePath.LOGIN)}
                className="px-3 xl:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
              >
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(RoutePath.SIGNUP)}
                className="px-3 xl:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <div
          className={`${isMobileNavSuppressed ? 'hidden' : 'flex'} lg:hidden items-center gap-2`}
        >
          {DarkModeToggle}
          <button
            onClick={onMobileMenuToggle}
            className={`z-[110] flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${landingControlClass}`}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="relative h-6 w-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
                <motion.line x1="4" y1="6" x2="20" y2="6" animate={isMobileMenuOpen ? { x1: 6, y1: 6, x2: 18, y2: 18 } : { x1: 4, y1: 6, x2: 20, y2: 6 }} transition={{ duration: 0.3 }} />
                <motion.line x1="4" y1="12" x2="20" y2="12" animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.2 }} />
                <motion.line x1="4" y1="18" x2="20" y2="18" animate={isMobileMenuOpen ? { x1: 6, y1: 18, x2: 18, y2: 6 } : { x1: 4, y1: 18, x2: 20, y2: 18 }} transition={{ duration: 0.3 }} />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};
