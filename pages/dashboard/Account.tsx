import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkle,
  User,
  ShieldCheck,
  Warning,
  FloppyDisk,
  Camera,
  Key,
  Trash,
  DeviceMobile,
  SignOut,
  X,
  Check,
  CircleNotch,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StorageImage } from '../../components/ui/StorageImage';
import { Surface } from '../../components/ui/Surface';
import { supabase } from '../../src/supabaseClient';
import { RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { offlineStorage } from '../../services/offlineStorage';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { ProUpgradeCTA } from '../../components/ui/ProUpgradeCTA';
import { aiService, type GreatIngestProgress } from '../../services/aiService';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

type FeedbackState =
  | {
      variant: 'info' | 'success' | 'warning' | 'error';
      title: string;
      description: string;
    }
  | null;

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isSmartModeChanging, setIsSmartModeChanging] = useState(false);
  const [greatIngestProgress, setGreatIngestProgress] = useState<GreatIngestProgress | null>(null);
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
        setAvatarPath(fullUser.user_metadata?.avatar_url || null);
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
    if (access?.smartModeEnabled) {
      return 'Smart Mode is on. Reflections can refresh your Life Wiki after saves while keeping manual Refresh with AI available.';
    }

    if (access?.planTier === 'pro') {
      return 'Unlimited note writing plus on-demand AI reflections and Life Wiki refreshes are available.';
    }

    return `The free plan includes one AI reflection and one Life Wiki refresh after you have enough writing to support them.`;
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
        description: 'Your profile photo is now up to date.',
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: 'error',
        title: 'Avatar upload failed.',
        description: 'Please try a different image or try again in a moment.',
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
        description: 'Your account details are now up to date.',
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
    await supabase.auth.signOut();
    navigate(RoutePath.LOGIN);
  };

  const handlePasswordReset = async () => {
    if (!email) return;

    setFeedback(null);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#${RoutePath.RESET_PASSWORD}`,
      });
      setFeedback({
        variant: 'info',
        title: 'Password reset email sent.',
        description: 'Check your inbox for a secure recovery link.',
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: 'error',
        title: 'Password reset could not be sent.',
        description: 'Please try again in a moment.',
      });
    }
  };

  const handleSmartModeToggle = async () => {
    if (!access || isSmartModeChanging) return;

    const nextEnabled = !access.smartModeEnabled;
    setIsSmartModeChanging(true);
    setGreatIngestProgress(null);
    setFeedback(null);

    try {
      const updatedAccess = await profileService.setSmartModeEnabled(nextEnabled);
      setAccess(updatedAccess);

      if (!nextEnabled) {
        setFeedback({
          variant: 'info',
          title: 'Smart Mode is off.',
          description: 'Your existing Life Wiki stays readable. Future saves will not refresh it in the background.',
        });
        return;
      }

      try {
        const notes = await noteService.getAll();
        const result = await aiService.runGreatIngest(notes, {
          onProgress: setGreatIngestProgress,
        });

        setFeedback({
          variant: result.pageCount > 0 ? 'success' : 'warning',
          title: result.pageCount > 0 ? 'Smart Mode is ready.' : 'Smart Mode is on.',
          description:
            result.pageCount > 0
              ? 'Your Sanctuary has been refreshed from your saved notes. New saves can keep it up to date quietly.'
              : 'There was not enough writing to build the Sanctuary yet. It will try again after future saves.',
        });
      } catch (ingestError) {
        console.error(ingestError);
        setFeedback({
          variant: 'warning',
          title: 'Smart Mode is on.',
          description: 'The first Sanctuary refresh could not finish. Future saves will try again quietly.',
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: 'error',
        title: 'Smart Mode could not be changed.',
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsSmartModeChanging(false);
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
      const notes = await noteService.getAll();
      const storedPaths = Array.from(
        new Set(
          [
            avatarPath,
            ...notes.flatMap((note) => [
              note.thumbnailUrl,
              ...(note.attachments || []).map((attachment) => attachment.path),
            ]),
          ].filter((path): path is string => Boolean(path && !path.startsWith('blob:'))),
        ),
      );

      await storageService.deleteFiles(storedPaths);

      const { error } = await supabase.rpc('delete_user_data');
      if (error) throw error;

      await offlineStorage.clearUserData(userId);
      setShowDeleteConfirm(false);

      await supabase.auth.signOut();
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
        <CircleNotch size={32} className="animate-spin text-green" />
      </div>
    );
  }

  return (
    <>
      <PageContainer className="pb-24 pt-6 md:pt-10">
        <div className="space-y-8">
          <SectionHeader
            eyebrow="Account"
            title="Your account settings"
            icon={
              <div className="icon-block icon-block-lg">
                <User size={34} weight="duotone" />
              </div>
            }
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

          <Surface variant="flat" className="overflow-hidden">
            <form onSubmit={handleSubmit} className="divide-y divide-border/70">
              <div className="grid gap-10 p-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:p-10">
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    className="relative group"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label="Upload a new profile photo"
                  >
                    <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white/5 shadow-[0_20px_42px_-28px_rgba(15,23,42,0.42)]">
                      {avatarPath ? (
                        <StorageImage path={avatarPath} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-nav">
                          <User size={48} weight="duotone" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-green text-white shadow-[0_18px_36px_-24px_rgba(22,163,74,0.45)] transition-transform group-hover:scale-105">
                      <Camera size={18} weight="bold" />
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
                    <MetadataPill tone="green">
                      Last sign-in {new Date(lastSignIn).toLocaleDateString()}
                    </MetadataPill>
                  ) : null}
                </div>

                <div className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input
                      label="Full Name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                    <Input
                      label="Display Name"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Input label="Email" name="email" value={email} disabled />

                    <div className="w-full space-y-2">
                      <label className="ml-1 block text-[11px] font-extrabold text-gray-nav">Timezone</label>
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className="h-12 w-full rounded-[var(--radius-control)] border border-border bg-white px-4 text-[15px] font-semibold text-gray-text shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-green focus:ring-4 focus:ring-green/10 dark:bg-[var(--panel-bg)]"
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
              </div>

              <div className="grid gap-6 p-8 md:grid-cols-2 lg:p-10">
                <Surface variant="bezel">
                  <div className="p-6">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="icon-block icon-block-md">
                        <Sparkle size={24} weight="duotone" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-green">Membership</p>
                        <h3 className="text-[24px] font-display font-bold text-gray-text capitalize">
                          {access?.planTier || 'Free'} plan
                        </h3>
                      </div>
                    </div>

                    <p className="text-[14px] font-medium leading-relaxed text-gray-light">{membershipCopy}</p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <MetadataPill tone="green">{access?.planTier === 'pro' ? 'Active' : 'Free tier'}</MetadataPill>
                    </div>

                    {access?.planTier !== 'pro' ? (
                      <div className="mt-8">
                        <ProUpgradeCTA />
                      </div>
                    ) : null}
                  </div>
                </Surface>

                <Surface variant="bezel">
                  <div className="p-6">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="icon-block icon-block-md">
                        <ShieldCheck size={24} weight="duotone" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-green">Security</p>
                        <h3 className="text-[24px] font-display font-bold text-gray-text">Keep this private</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        className="flex w-full items-center justify-between rounded-[var(--radius-panel)] border border-border bg-white/5 px-4 py-4 text-left transition-all hover:border-green/20 hover:bg-green/5"
                      >
                        <div className="flex items-center gap-3">
                          <Key size={20} weight="bold" className="text-green" />
                          <div>
                            <p className="text-[14px] font-bold text-gray-text">Password reset</p>
                          </div>
                        </div>
                        <EnvelopeSimple size={18} weight="bold" className="text-gray-nav" />
                      </button>

                      <div className="flex items-center justify-between rounded-[var(--radius-panel)] border border-border bg-white/5 px-4 py-4 opacity-70">
                        <div className="flex items-center gap-3">
                          <DeviceMobile size={20} weight="bold" className="text-gray-nav" />
                          <div>
                            <p className="text-[14px] font-bold text-gray-text">Two-factor authentication</p>
                          </div>
                        </div>
                        <MetadataPill>Coming soon</MetadataPill>
                      </div>
                    </div>
                  </div>
                </Surface>

                <Surface variant="bezel">
                  <div className="p-6">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="icon-block icon-block-md">
                        <Sparkle size={24} weight="duotone" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-green">Sanctuary</p>
                        <h3 className="text-[24px] font-display font-bold text-gray-text">Smart Mode</h3>
                      </div>
                    </div>

                    <p className="text-[14px] font-medium leading-relaxed text-gray-light">
                      Keep AI on demand by default, or let Smart Mode refresh the Life Wiki after saves. Your writing screen stays quiet either way.
                    </p>

                    {greatIngestProgress ? (
                      <div className="mt-5 rounded-[var(--radius-panel)] border border-green/15 bg-green/5 p-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-green">
                          Preparing Sanctuary
                        </p>
                        <p className="mt-2 text-[14px] font-bold text-gray-text">
                          Processing entry {greatIngestProgress.processedCount} of {greatIngestProgress.totalCount}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <MetadataPill tone={access?.smartModeEnabled ? 'green' : undefined}>
                        {access?.smartModeEnabled ? 'Enabled' : 'Off'}
                      </MetadataPill>
                      <Button
                        type="button"
                        variant={access?.smartModeEnabled ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={handleSmartModeToggle}
                        isLoading={isSmartModeChanging}
                        disabled={!access}
                      >
                        {access?.smartModeEnabled ? 'Turn off Smart Mode' : 'Enable Smart Mode'}
                      </Button>
                    </div>
                  </div>
                </Surface>
              </div>

              <div className="bg-red/5 p-8 lg:p-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-red">Danger zone</p>
                    <h3 className="text-[24px] font-display font-bold text-red">Delete account</h3>
                    <p className="max-w-xl text-[14px] font-medium leading-relaxed text-gray-light">
                      Saved writing and app data will be removed.
                    </p>
                  </div>

                  <Button type="button" variant="danger" className="px-8" onClick={() => setShowDeleteConfirm(true)}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="sticky-bar !top-auto relative">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-gray-nav transition-colors hover:text-red"
                    aria-label="Sign out of your account"
                  >
                    <SignOut size={20} weight="bold" />
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
                      <X size={18} weight="bold" className="sm:mr-2" />
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
                        <Check size={18} weight="bold" className="sm:mr-2" />
                      ) : (
                        <FloppyDisk size={18} weight="bold" className="sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">
                        {loading ? 'Saving...' : isSaved ? 'Saved' : 'Save changes'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Surface>
        </div>
      </PageContainer>

      <ModalSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete your saved writing"
        icon={<Trash size={20} weight="duotone" />}
        size="md"
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
        <div className="space-y-4 text-[14px] font-medium leading-relaxed text-gray-light">
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
