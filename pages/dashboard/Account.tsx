import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from '@phosphor-icons/react/Camera';
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
import { isPrivateAiDisabled } from '../../services/privateMode';
import { getPasswordResetRedirectTo } from '../../src/auth/authRedirectConfig';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

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
    if (isPrivateAiDisabled()) {
      return 'Zero-knowledge mode is active. Your writing stays encrypted, and AI features that require server reading are disabled.';
    }

    if (access?.planTier === 'pro') {
      return 'Pro is active. You have more writing room, on-demand AI reflections, and more Life Wiki refreshes for the weeks when life is a lot.';
    }

    return `Free gives you 30 notes each month, one AI reflection, and one Life Wiki refresh after there is enough writing to support them.`;
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
          <SectionHeader
            eyebrow="Account"
            title="Your account settings"
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

          <form onSubmit={handleSubmit} className="space-y-5">
              <Surface variant="flat" tone="paper" className="grid gap-10 p-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:p-10">
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    className="relative group transition-transform duration-500 hover:scale-105"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label="Upload a new profile photo"
                  >
                    <div className="surface-inline-panel h-32 w-32 overflow-hidden rounded-full border-4 border-white/50 shadow-xl shadow-gray-text/10 transition-[border-color,box-shadow,transform] duration-500 group-hover:border-green/50 group-hover:shadow-green/10">
                      {avatarPath ? (
                        <StorageImage path={avatarPath} alt="Profile" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-nav transition-colors group-hover:text-green">
                          <User size={48} weight="duotone" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-gray-text text-white shadow-xl shadow-gray-text/15 transition-[background-color,box-shadow,transform] duration-500 group-hover:bg-green group-hover:scale-110">
                      <Camera size={18} weight="bold" className="transition-transform group-hover:rotate-12" />
                    </div>
                  </button>
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

                <div className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input
                      id="account-full-name"
                      label="Full Name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                    <Input
                      id="account-display-name"
                      label="Display Name"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Input id="account-email" label="Email" name="email" value={email} disabled />

                    <div className="w-full space-y-2">
                      <label htmlFor="account-timezone" className="ml-1 block text-ui-xs font-extrabold text-gray-nav">Timezone</label>
                      <select
                        id="account-timezone"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className="input-surface h-12 w-full px-4 text-ui-base font-semibold text-gray-text"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Asia/Kolkata">India (IST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Surface>

              <Surface variant="flat" tone="paper" className="space-y-4 p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <div className="icon-block icon-block-sm bg-body">
                    <Sparkle size={22} weight="duotone" className="text-green" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-text">Membership</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <MetadataPill tone={access?.planTier === 'pro' ? 'green' : undefined}>
                    {access?.planTier === 'pro' ? 'Active' : 'Free tier'}
                  </MetadataPill>
                  <span className="text-sm font-bold capitalize text-gray-text">{access?.planTier || 'Free'} plan</span>
                </div>
                <p className="dashboard-supporting-text">{membershipCopy}</p>
                {access?.planTier !== 'pro' ? (
                  <div className="pt-1">
                    <ProUpgradeCTA />
                  </div>
                ) : null}
              </Surface>

              <Surface variant="flat" tone="paper" className="space-y-4 p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <div className="icon-block icon-block-sm bg-body">
                    <ShieldCheck size={22} weight="duotone" className="text-green" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-text">Security</h3>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isPasswordResetting || !email}
                  className="surface-inline-panel flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:border-border/80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <Key size={20} weight="regular" className="text-gray-nav" />
                    <p className="text-ui-sm font-bold text-gray-text">Password reset</p>
                  </div>
                  {isPasswordResetting ? (
                    <CircleNotch size={18} className="animate-spin text-gray-nav" />
                  ) : (
                    <EnvelopeSimple size={18} weight="regular" className="text-gray-nav" />
                  )}
                </button>

                {passwordResetFeedback ? (
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
                ) : null}

                <div className="surface-inline-panel flex items-center justify-between px-4 py-4 opacity-70">
                  <div className="flex items-center gap-3">
                    <DeviceMobile size={20} weight="regular" className="text-gray-nav" />
                    <p className="text-ui-sm font-bold text-gray-text">Two-factor authentication</p>
                  </div>
                  <MetadataPill>Coming soon</MetadataPill>
                </div>
              </Surface>

              <Surface variant="flat" tone="paper" className="space-y-4 p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <div className="icon-block icon-block-sm bg-body">
                    <EnvelopeSimple size={22} weight="duotone" className="text-green" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-text">Share Reflections</h3>
                </div>
                <p className="dashboard-supporting-text">
                  Account tracks how many people joined from your invite. There is no prize or public list.
                </p>
                <ReferralInvitePanel />
              </Surface>

              <Surface variant="flat" tone="paper" className="space-y-4 p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <div className="icon-block icon-block-sm">
                    <Warning size={22} weight="duotone" className="text-clay" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-clay">Danger zone</h3>
                </div>
                <p className="max-w-xl dashboard-supporting-text text-clay/80">
                  Saved writing and app data will be removed.
                </p>
                <Button type="button" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                  Delete my data
                </Button>
              </Surface>

              <div className="px-1 pt-1">
                <div className="sticky-bar !top-auto relative">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-2 label-caps text-gray-nav transition-[background-color,color] hover:bg-clay/5 hover:text-clay sm:min-w-0"
                    aria-label="Sign out of your account"
                  >
                    <SignOut size={20} weight="regular" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate(-1)}
                      className="px-4 sm:px-6"
                      aria-label="Discard account changes"
                    >
                      <X size={18} weight="regular" className="sm:mr-2" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || isSaved}
                      className="px-4 sm:px-8"
                      aria-label="Save account changes"
                    >
                      {loading ? (
                        <CircleNotch size={18} className="animate-spin sm:mr-2" />
                      ) : isSaved ? (
                        <Check size={18} weight="regular" className="sm:mr-2" />
                      ) : (
                        <FloppyDisk size={18} weight="regular" className="sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">
                        {loading ? 'Saving...' : isSaved ? 'Saved' : 'Save changes'}
                      </span>
                    </Button>
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
