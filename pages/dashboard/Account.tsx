import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { Camera } from '@phosphor-icons/react/Camera';
import { CaretDown } from '@phosphor-icons/react/CaretDown';
import { Check } from '@phosphor-icons/react/Check';
import { CircleNotch } from '@phosphor-icons/react/CircleNotch';
import { DeviceMobile } from '@phosphor-icons/react/DeviceMobile';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { FloppyDisk } from '@phosphor-icons/react/FloppyDisk';
import { Key } from '@phosphor-icons/react/Key';
import { ShieldCheck } from '@phosphor-icons/react/ShieldCheck';
import { SignOut } from '@phosphor-icons/react/SignOut';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Trash } from '@phosphor-icons/react/Trash';
import { User } from '@phosphor-icons/react/User';
import { Warning } from '@phosphor-icons/react/Warning';
import { X } from '@phosphor-icons/react/X';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { Tooltip } from '../../components/ui/Tooltip';
import { ReferralInvitePanel } from '../../components/ui/ReferralInvitePanel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StorageImage } from '../../components/ui/StorageImage';
import { Surface } from '../../components/ui/Surface';
import { supabase } from '../../src/supabaseClient';
import { RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { offlineStorage } from '../../services/offlineStorage';
import { useAuthStore } from '../../hooks/useAuthStore';
import { profileService } from '../../services/profileService';
import { ProUpgradeCTA } from '../../components/ui/ProUpgradeCTA';
import { getPasswordResetRedirectTo } from '../../src/auth/authRedirectConfig';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

const TIMEZONE_OPTIONS = [
  { value: 'Etc/GMT+12', label: 'GMT-12:00 (International Date Line West)' },
  { value: 'Pacific/Honolulu', label: 'GMT-10:00 (Hawaii)' },
  { value: 'America/Anchorage', label: 'GMT-09:00 (Alaska)' },
  { value: 'America/Los_Angeles', label: 'GMT-08:00 (Pacific Time)' },
  { value: 'America/Denver', label: 'GMT-07:00 (Mountain Time)' },
  { value: 'America/Chicago', label: 'GMT-06:00 (Central Time)' },
  { value: 'America/New_York', label: 'GMT-05:00 (Eastern Time)' },
  { value: 'America/Halifax', label: 'GMT-04:00 (Atlantic Time)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'GMT-03:00 (Buenos Aires)' },
  { value: 'Atlantic/South_Georgia', label: 'GMT-02:00 (Mid-Atlantic)' },
  { value: 'Atlantic/Azores', label: 'GMT-01:00 (Azores)' },
  { value: 'UTC', label: 'GMT+00:00 (Greenwich Mean Time / UTC)' },
  { value: 'Europe/London', label: 'GMT+00:00 (London)' },
  { value: 'Europe/Paris', label: 'GMT+01:00 (Central European Time)' },
  { value: 'Europe/Kyiv', label: 'GMT+02:00 (Eastern European Time)' },
  { value: 'Europe/Moscow', label: 'GMT+03:00 (Moscow)' },
  { value: 'Asia/Dubai', label: 'GMT+04:00 (Gulf Standard Time)' },
  { value: 'Asia/Karachi', label: 'GMT+05:00 (Pakistan Standard Time)' },
  { value: 'Asia/Kolkata', label: 'GMT+05:30 (India Standard Time)' },
  { value: 'Asia/Dhaka', label: 'GMT+06:00 (Bangladesh Time)' },
  { value: 'Asia/Bangkok', label: 'GMT+07:00 (Indochina Time)' },
  { value: 'Asia/Singapore', label: 'GMT+08:00 (Singapore / Beijing)' },
  { value: 'Asia/Tokyo', label: 'GMT+09:00 (Japan Standard Time)' },
  { value: 'Australia/Adelaide', label: 'GMT+09:30 (Central Australia Time)' },
  { value: 'Australia/Sydney', label: 'GMT+10:00 (Eastern Australia Time)' },
  { value: 'Pacific/Guadalcanal', label: 'GMT+11:00 (Solomon Islands)' },
  { value: 'Pacific/Auckland', label: 'GMT+12:00 (New Zealand Time)' },
];

const getAuthAvatarPath = (metadata: Record<string, unknown> | undefined) => {
  const avatar = metadata?.avatar_url || metadata?.picture || metadata?.avatar;
  return typeof avatar === 'string' ? avatar : null;
};

type FeedbackState =
  | {
      variant: 'info' | 'success' | 'warning' | 'error';
      title: string;
      description?: string;
    }
  | null;

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [passwordResetFeedback, setPasswordResetFeedback] = useState<FeedbackState>(null);
  const [isPasswordResetting, setIsPasswordResetting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const timezoneDetailsRef = useRef<HTMLDetailsElement | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!isAuthenticated || !user) {
          navigate(RoutePath.LOGIN);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const fullUser = session?.user;
        if (!fullUser) {
          navigate(RoutePath.LOGIN);
          return;
        }

        setUserId(fullUser.id);
        setEmail(fullUser.email || '');
        setAvatarPath(getAuthAvatarPath(fullUser.user_metadata));
        setLastSignIn(fullUser.last_sign_in_at || null);
        setFormData({
          fullName: fullUser.user_metadata?.full_name || '',
          displayName: fullUser.user_metadata?.display_name || '',
          timezone: fullUser.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        const accessData = await profileService.getWellnessAccess();
        setAccess(accessData);
      } catch (err) {
        console.error(err);
        setFeedback({
          variant: 'error',
          title: 'We could not load your account just now.',
          description: 'Please refresh and try again.',
        });
      } finally {
        setFetching(false);
      }
    };

    fetchUser();
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (!isSaved) return;

    const timer = window.setTimeout(() => setIsSaved(false), 2200);
    return () => window.clearTimeout(timer);
  }, [isSaved]);

  const membershipCopy = useMemo(() => {
    if (access?.planTier === 'pro') {
      return 'Your writing is encrypted on this device. Pro gives you unlimited notes, on-demand AI reflections, and more Life Wiki refreshes.';
    }

    return 'Your writing is encrypted on this device. Free plan includes 30 notes each month, 1 AI reflection, and 1 Life Wiki refresh.';
  }, [access]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const openSupportDraft = (subject: string, body: string) => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setLoading(true);
    setFeedback(null);

    try {
      const path = await storageService.uploadFile(file, userId, 'avatar', 'profile');
      setAvatarPath(path);
      await supabase.auth.updateUser({ data: { avatar_url: path } });
      setFeedback({
        variant: 'success',
        title: 'Profile photo updated.',
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: 'error',
        title: "That photo didn't upload.",
        description: 'Try a different image, or try again in a moment.',
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          display_name: formData.displayName,
          timezone: formData.timezone,
        },
      });
      setIsSaved(true);
      setFeedback({
        variant: 'success',
        title: 'Changes saved.',
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: 'error',
        title: 'We could not save your changes.',
        description: 'Please try again in a moment.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate(RoutePath.LOGIN);
  };

  const handlePasswordReset = async () => {
    if (!email || isPasswordResetting) return;

    setFeedback(null);
    setPasswordResetFeedback(null);
    setIsPasswordResetting(true);

    try {
      const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectTo(),
      });

      if (response.error) throw response.error;

      setPasswordResetFeedback({
        variant: 'info',
        title: 'Password reset email sent.',
        description: 'This restores sign-in first. If your private writing uses your account password, recovery will reconnect it after reset.',
      });
    } catch (err) {
      console.error(err);
      setPasswordResetFeedback({
        variant: 'error',
        title: 'Password reset could not be sent.',
        description: err instanceof Error ? err.message : 'Please try again in a moment.',
      });
    } finally {
      setIsPasswordResetting(false);
    }
  };

  const handleAccountClosureRequest = () => {
    openSupportDraft(
      'Reflections account closure request',
      `Hi,\n\nPlease close the sign-in account for ${email || 'my account'} after any saved writing has been removed.\n\nThanks.`,
    );
    setShowDeleteConfirm(false);
    setFeedback({
      variant: 'warning',
      title: 'Closure request draft ready.',
      description: 'Send it when you want the sign-in account itself closed as well.',
    });
  };

  const handleDeleteSavedData = async () => {
    if (!userId) return;

    setIsDeletingData(true);
    setFeedback(null);

    try {
      await storageService.deleteUserPrefix(userId);

      const { error } = await supabase.rpc('delete_user_data');
      if (error) throw error;

      await offlineStorage.clearUserData(userId);
      setShowDeleteConfirm(false);

      await logout();
      navigate(RoutePath.LOGIN, {
        replace: true,
        state: {
          successMessage:
            `Your saved reflections and profile details were deleted. If you also want the sign-in account closed, email ${SUPPORT_EMAIL}.`,
        },
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: 'error',
        title: 'We could not delete your saved writing.',
        description: 'We stopped before closing your session because file cleanup or deletion did not finish safely. Please try again or email support.',
      });
    } finally {
      setIsDeletingData(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-body">
        <CircleNotch size={32} className="animate-spin text-gray-nav" />
      </div>
    );
  }

  return (
    <>
      <PageContainer className="surface-scope-paper page-wash pb-24 pt-6 md:pt-10">
        <div className="core-page-stack">
          <button
            type="button"
            onClick={() => navigate(RoutePath.DASHBOARD)}
            className="group flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-gray-nav transition-[color,transform,background-color] duration-300 hover:-translate-x-1 hover:bg-green/5 hover:text-green"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
            <span>Back</span>
          </button>

          <SectionHeader
            title="Your account settings"
            description="Profile, security, and membership."
          />

          {feedback ? (
            <Alert
              variant={feedback.variant}
              title={feedback.title}
              description={feedback.description}
              icon={
                feedback.variant === 'success' ? (
                  <Check size={20} weight="bold" />
                ) : feedback.variant === 'warning' ? (
                  <Warning size={20} weight="fill" />
                ) : feedback.variant === 'error' ? (
                  <Warning size={20} weight="fill" />
                ) : (
                  <EnvelopeSimple size={20} weight="duotone" />
                )
              }
            />
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5 min-w-0">
              <Surface variant="flat" tone="paper" className="p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 min-w-0">
                <div className="grid gap-6 lg:gap-10 lg:grid-cols-[180px_minmax(0,1fr)] min-w-0">
                  <div className="flex flex-col items-center gap-4">
                    <Tooltip label="Upload new profile photo">
                      <button
                        type="button"
                        className="relative group transition-transform duration-500 hover:scale-105"
                        onClick={() => avatarInputRef.current?.click()}
                        aria-label="Upload a new profile photo"
                      >
                        <div className="surface-inline-panel h-32 w-32 overflow-hidden rounded-2xl border-4 border-surface bg-surface shadow-xl shadow-gray-text/10 transition-[border-color,box-shadow,transform] duration-500 group-hover:border-green/50 group-hover:shadow-green/10">
                          {avatarPath ? (
                            <StorageImage path={avatarPath} alt="Profile" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-nav transition-colors group-hover:text-green">
                              <User size={48} weight="duotone" />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-xl border-4 border-surface bg-gray-text text-white shadow-xl shadow-gray-text/15 transition-[background-color,box-shadow,transform] duration-500 group-hover:bg-green group-hover:scale-110">
                          <Camera size={18} weight="bold" className="transition-transform group-hover:rotate-12" />
                        </div>
                      </button>
                    </Tooltip>
                    <input
                      id="avatar-upload"
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />

                    {lastSignIn ? (
                      <MetadataPill>
                        Last sign-in {new Date(lastSignIn).toLocaleDateString()}
                      </MetadataPill>
                    ) : null}
                  </div>

                  <div className="space-y-8 min-w-0">
                    <div className="grid gap-6 md:grid-cols-2 min-w-0">
                      <div className="w-full max-w-md min-w-0">
                        <Input
                          id="account-full-name"
                          label="Full Name"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="w-full max-w-md min-w-0">
                        <Input
                          id="account-display-name"
                          label="Display Name"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 min-w-0">
                      <div className="w-full max-w-md min-w-0">
                        <Input id="account-email" label="Email" name="email" value={email} disabled />
                      </div>

                      <div className="w-full max-w-md space-y-2 min-w-0">
                        <label htmlFor="account-timezone" className="ml-1 block text-ui-xs font-extrabold text-gray-nav">Timezone</label>
                        <div className="relative w-full min-w-0">
                          <select
                            id="account-timezone"
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleChange}
                            className="input-surface flex h-12 w-full appearance-none items-center px-4 text-ui-base font-semibold text-gray-text rounded-xl border-none outline-none focus:ring-2 focus:ring-green/30 text-ellipsis overflow-hidden whitespace-nowrap"
                          >
                            {TIMEZONE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-nav">
                            <CaretDown size={16} weight="bold" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 border-t border-border space-y-4">
                  <h3 className="flex items-center gap-2 text-xl font-display font-bold text-gray-text">
                    <Sparkle size={22} weight="duotone" className="text-green" />
                    Membership
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {access?.planTier === 'pro' ? (
                      <MetadataPill tone="green">Active</MetadataPill>
                    ) : null}
                    <span className="text-sm font-bold capitalize text-gray-text">{access?.planTier || 'Free'} plan</span>
                  </div>
                  <p className="dashboard-supporting-text">{membershipCopy}</p>
                  {access?.planTier !== 'pro' ? (
                    <div className="pt-1">
                      <ProUpgradeCTA />
                    </div>
                  ) : null}
                </div>

                <div className="pt-6 sm:pt-8 border-t border-border space-y-4">
                  <h3 className="flex items-center gap-2 text-xl font-display font-bold text-gray-text">
                    <ShieldCheck size={22} weight="duotone" className="text-green" />
                    Security
                  </h3>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isPasswordResetting || !email}
                      className="group flex w-full items-center justify-between px-2 py-4 text-left transition-colors hover:bg-green/5 rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Key size={18} weight="duotone" className="text-gray-light" />
                        <span className="text-sm font-bold text-gray-text">Password reset</span>
                      </div>
                      {isPasswordResetting ? (
                        <CircleNotch size={18} className="animate-spin text-gray-nav" />
                      ) : (
                        <EnvelopeSimple size={18} weight="duotone" className="text-gray-light transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-green" />
                      )}
                    </button>

                    {passwordResetFeedback ? (
                      <div className="py-3">
                        <Alert
                          variant={passwordResetFeedback.variant}
                          title={passwordResetFeedback.title}
                          description={passwordResetFeedback.description}
                          icon={
                            passwordResetFeedback.variant === 'error' ? (
                              <Warning size={20} weight="fill" />
                            ) : (
                              <EnvelopeSimple size={20} weight="duotone" />
                            )
                          }
                        />
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <DeviceMobile size={20} weight="regular" className="text-gray-nav" />
                        <span className="text-sm font-bold text-gray-text">Two-factor authentication</span>
                      </div>
                      <MetadataPill>Coming soon</MetadataPill>
                    </div>
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 border-t border-border space-y-4">
                  <h3 className="flex items-center gap-2 text-xl font-display font-bold text-gray-text">
                    <EnvelopeSimple size={22} weight="duotone" className="text-green" />
                    Share Reflections
                  </h3>
                  <p className="dashboard-supporting-text">
                    Account tracks how many people joined from your invite. There is no prize or public list.
                  </p>
                  <ReferralInvitePanel />
                </div>
              </Surface>

              <Surface variant="flat" tone="paper" className="p-5 sm:p-8 lg:p-10 border-y sm:border border-border">
                <div className="flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Warning size={22} weight="duotone" className="text-clay shrink-0" />
                      <h3 className="text-lg sm:text-xl font-display font-bold text-clay truncate">Danger zone</h3>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-clay/80 leading-snug">
                      Saved writing and app data will be removed.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Tooltip label="Permanently delete all your data">
                      <Button type="button" variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)} className="whitespace-nowrap">
                        Delete my data
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </Surface>

              <div className="px-1 pt-1">
                <div className="sticky-bar !top-auto relative flex items-center justify-between gap-2 p-3 sm:gap-4 sm:p-4">
                  <Tooltip label="Sign out securely" placement="top">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex h-12 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-clay/10 bg-clay/5 px-3 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-clay transition-all hover:bg-clay/10 active:scale-[0.98]"
                      aria-label="Sign out of your account"
                    >
                      <SignOut size={18} weight="bold" />
                      <span>Sign out</span>
                    </button>
                  </Tooltip>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <Tooltip label="Discard unsaved changes" placement="top">
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex h-12 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-surface px-3 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-nav transition-all hover:bg-green/5 hover:text-green active:scale-[0.98]"
                        aria-label="Discard account changes"
                      >
                        <X size={18} weight="bold" />
                        <span>Cancel</span>
                      </button>
                    </Tooltip>
                    <Tooltip label="Save your profile updates" placement="top">
                      <button
                        type="submit"
                        disabled={loading || isSaved}
                        className="flex h-12 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-green px-3 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-green-hover active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        aria-label="Save account changes"
                      >
                        {loading ? (
                          <CircleNotch size={18} className="animate-spin" />
                        ) : isSaved ? (
                          <Check size={18} weight="bold" />
                        ) : (
                          <FloppyDisk size={18} weight="regular" />
                        )}
                        <span>
                          {loading ? 'Saving' : isSaved ? 'Saved' : 'Save'}
                        </span>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
          </form>
        </div>
      </PageContainer>

      <ModalSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete your saved writing"
        icon={<Trash size={22} weight="duotone" />}
        size="md"
        tone="clay"
        footer={
          <div className="flex flex-col gap-3">
            <Button variant="danger" onClick={handleDeleteSavedData} isLoading={isDeletingData}>
              Delete saved writing now
            </Button>
            <Button variant="secondary" onClick={handleAccountClosureRequest} disabled={isDeletingData}>
              Request full account closure
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingData}>
              Keep everything
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-ui-sm font-medium leading-relaxed text-gray-light">
          <p>
            This removes your saved notes, moods, tags, tasks, and profile row from the app. It also removes stored attachments and avatar files before we close your session.
          </p>
          <p>
            If you want the sign-in account itself closed too, use the support request button here after deleting the saved writing.
          </p>
        </div>
      </ModalSheet>
    </>
  );
};
