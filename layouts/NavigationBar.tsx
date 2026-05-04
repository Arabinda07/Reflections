import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
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
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={isDarkMode ? 'dark' : 'light'}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </motion.div>
      </AnimatePresence>
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isMobileMenuOpen ? 'close' : 'open'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {isMobileMenuOpen ? (
                  <X size={24} weight="regular" />
                ) : (
                  <List size={24} weight="regular" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </nav>
  );
};
