import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  CaretRight,
  DownloadSimple,
  Bug,
  Leaf,
  PaperPlaneTilt,
  SignOut,
} from '@phosphor-icons/react';
import { StorageImage } from '../components/ui/StorageImage';
import { useAuthStore } from '../hooks/useAuthStore';
import { usePWAInstall } from '../context/PWAInstallContext';
import { registerAndroidBackAction } from '../src/native/androidBack';
import { NATIVE_PAGE_TOP_PADDING, NATIVE_TOP_CONTROL_OFFSET } from '../src/native/safeArea';

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: SidebarNavItem[];
  onBugReport: () => void;
  onInvite: () => void;
}

/**
 * Full-screen mobile navigation sidebar.
 * Owns focus-trap, scroll-lock, Android back-button registration, and all nav rendering.
 */
export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  navItems,
  onBugReport,
  onInvite,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();

  const mobileMenuId = useId();
  const mobileMenuTitleId = useId();
  const mobileMenuDescriptionId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const primaryItems = navItems.filter((item) => item.path !== '/account');
  const accountItem = navItems.find((item) => item.path === '/account');

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  // Focus trap + Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const focusTimer = window.setTimeout(() => {
      closeRef.current?.focus();
    }, 40);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  // Android back button dismisses the sidebar
  useEffect(() => {
    if (!isOpen) return;

    return registerAndroidBackAction(() => {
      onClose();
      return true;
    });
  }, [isOpen, onClose]);

  // Scroll lock
  useEffect(() => {
    document.documentElement.classList.toggle('no-scroll', isOpen);

    return () => {
      document.documentElement.classList.remove('no-scroll');
    };
  }, [isOpen]);

  if (typeof document === 'undefined' || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-x-0 top-0 bottom-0 z-[105] h-[100dvh] overflow-hidden lg:hidden">
      <motion.div
        className="mobile-sidebar-scrim fixed inset-x-0 top-0 bottom-0 h-[100dvh]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        ref={panelRef}
        id={mobileMenuId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={mobileMenuTitleId}
        aria-describedby={mobileMenuDescriptionId}
        initial={{ x: 36, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 36, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="mobile-sidebar-shell fixed right-0 top-0 bottom-0 z-[110] h-[100dvh]"
        style={{
          paddingTop: NATIVE_PAGE_TOP_PADDING,
          width: 'min(86vw, 352px)',
        }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <h2 id={mobileMenuTitleId} className="sr-only">
            Navigation menu
          </h2>
          <p id={mobileMenuDescriptionId} className="sr-only">
            Use this menu to move around Reflections and close it when you are ready to return to
            the page.
          </p>
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 pt-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-chip)] bg-green text-[rgb(var(--panel-bg-rgb))] shadow-sm shadow-green/10">
                <Leaf size={20} weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-nav">
                  Menu
                </p>
                <p className="font-serif text-[22px] italic leading-tight text-green">
                  Reflections
                </p>
              </div>
            </div>

            <button
              ref={closeRef}
              onClick={onClose}
              className="mobile-sidebar-close"
              style={{
                marginTop: `calc(${NATIVE_TOP_CONTROL_OFFSET} - ${NATIVE_PAGE_TOP_PADDING})`,
              }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Header Section */}
          {isAuthenticated && user && (
            <div className="mobile-sidebar-user-header">
              <div className="mobile-sidebar-user-avatar">
                {user.avatarUrl ? (
                  <StorageImage
                    path={user.avatarUrl}
                    alt={`${user.name}'s profile photo`}
                    className="h-full w-full rounded-full object-cover"
                    showLoading={false}
                  />
                ) : (
                  <span>{user.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-extrabold leading-tight text-gray-text">
                  {user.name}
                </p>
                <p className="truncate text-[12px] font-semibold text-gray-nav">{user.email}</p>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1.5">
              {primaryItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.path)}
                    aria-current={isActive ? 'page' : undefined}
                    className="mobile-sidebar-link group"
                    data-active={isActive ? 'true' : 'false'}
                  >
                    <span className="mobile-sidebar-link-icon">
                      <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-extrabold leading-tight">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[12px] font-semibold leading-snug text-gray-nav">
                        {item.description}
                      </span>
                    </span>
                    <CaretRight
                      size={16}
                      weight="regular"
                      className="mobile-sidebar-link-caret"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Actions Section */}
          <div className="mobile-sidebar-footer">
            {accountItem && (
              <button
                onClick={() => handleNavigation(accountItem.path)}
                className="mobile-sidebar-link group"
                data-active={location.pathname === accountItem.path ? 'true' : 'false'}
              >
                <span className="mobile-sidebar-link-icon">
                  <accountItem.icon
                    size={20}
                    weight={location.pathname === accountItem.path ? 'fill' : 'regular'}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-extrabold leading-tight">
                    Settings
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-gray-nav">
                    Manage profile and plan.
                  </span>
                </span>
                <CaretRight
                  size={16}
                  weight="regular"
                  className="mobile-sidebar-link-caret"
                />
              </button>
            )}

            {canInstall && !isInstalled && (
              <button
                onClick={async () => {
                  await triggerInstall();
                  onClose();
                }}
                aria-label="Add Reflections to your home screen"
                className="mobile-sidebar-link mobile-sidebar-link--action"
              >
                <span className="mobile-sidebar-link-icon">
                  <DownloadSimple size={20} weight="regular" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[15px] font-extrabold leading-tight">
                    Install app
                  </span>
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onBugReport();
                onClose();
              }}
              aria-label="Report a bug"
              className="mobile-sidebar-link mobile-sidebar-link--action"
            >
              <span className="mobile-sidebar-link-icon">
                <Bug size={20} weight="regular" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[15px] font-extrabold leading-tight">
                  Report a bug
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-gray-nav">
                  Tell us what felt off.
                </span>
              </span>
            </button>

            {isAuthenticated && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    onInvite();
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-green/5 text-green text-[13px] font-extrabold hover:bg-green/10 transition-colors"
                >
                  <PaperPlaneTilt size={18} weight="regular" />
                  Invite
                </button>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-clay/5 text-clay text-[13px] font-extrabold hover:bg-clay/10 transition-colors"
                >
                  <SignOut size={18} weight="regular" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
