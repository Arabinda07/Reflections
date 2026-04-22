import React, { useEffect, useMemo, useState } from 'react';
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
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StorageImage } from '../../components/ui/StorageImage';
import { Surface } from '../../components/ui/Surface';
import { supabase } from '../../src/supabaseClient';
import { RoutePath, WellnessAccess } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';

const SUPPORT_EMAIL = 'robinsaha@gmail.com';

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
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

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
    if (access?.planTier === 'pro') {
      return 'Unlimited notes, AI reflections, and Life Wiki refreshes are available.';
    }

    return `Used ${access?.freeAiReflectionsUsed || 0} of 1 free AI insight so far.`;
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
        description: 'Your sanctuary now carries your new avatar.',
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

  const handleUpgradeRequest = () => {
    openSupportDraft(
      'Reflections Pro interest',
      `Hi,\n\nI would like to be notified when Reflections Pro is available for ${email || 'my account'}.\n\nThanks.`,
    );
    setShowUpgradeSheet(false);
    setFeedback({
      variant: 'info',
      title: 'Your email app was opened.',
      description: 'Once Pro billing is live, this path can become a full checkout flow.',
    });
  };

  const handleDeleteRequest = () => {
    openSupportDraft(
      'Reflections account deletion request',
      `Hi,\n\nI want to request account deletion for ${email || 'my account'}.\n\nPlease let me know when the deletion has been completed.\n\nThanks.`,
    );
    setShowDeleteConfirm(false);
    setFeedback({
      variant: 'warning',
      title: 'Deletion request draft opened.',
      description: 'Account deletion is currently handled manually so nothing is removed until that request is processed.',
    });
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
            title="Your sanctuary settings"
            description="Keep your profile, access, and privacy details grounded in the same calm system as the rest of the product."
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
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white/5 shadow-xl">
                      {avatarPath ? (
                        <StorageImage path={avatarPath} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-nav">
                          <User size={48} weight="duotone" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-green text-white shadow-lg transition-transform group-hover:scale-110">
                      <Camera size={18} weight="bold" />
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

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
                        <h3 className="text-[24px] font-display text-gray-text capitalize">
                          {access?.planTier || 'Free'} plan
                        </h3>
                      </div>
                    </div>

                    <p className="text-[14px] font-medium leading-relaxed text-gray-light">{membershipCopy}</p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <MetadataPill tone="green">{access?.planTier === 'pro' ? 'Active' : 'Free tier'}</MetadataPill>
                      <MetadataPill>{access?.freeAiReflectionsUsed || 0} insight used</MetadataPill>
                    </div>

                    {access?.planTier !== 'pro' ? (
                      <Button type="button" variant="primary" className="mt-6 w-full" onClick={() => setShowUpgradeSheet(true)}>
                        Upgrade to Pro
                      </Button>
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
                        <h3 className="text-[24px] font-display text-gray-text">Keep this private</h3>
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
                            <p className="text-[12px] font-medium text-gray-light">Send a secure recovery link to {email}.</p>
                          </div>
                        </div>
                        <EnvelopeSimple size={18} weight="bold" className="text-gray-nav" />
                      </button>

                      <div className="flex items-center justify-between rounded-[var(--radius-panel)] border border-border bg-white/5 px-4 py-4 opacity-70">
                        <div className="flex items-center gap-3">
                          <DeviceMobile size={20} weight="bold" className="text-gray-nav" />
                          <div>
                            <p className="text-[14px] font-bold text-gray-text">Two-factor authentication</p>
                            <p className="text-[12px] font-medium text-gray-light">Planned for a later security pass.</p>
                          </div>
                        </div>
                        <MetadataPill>Coming soon</MetadataPill>
                      </div>
                    </div>
                  </div>
                </Surface>
              </div>

              <div className="bg-red/5 p-8 lg:p-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-red">Danger zone</p>
                    <h3 className="text-[24px] font-display text-red">Delete account</h3>
                    <p className="max-w-xl text-[14px] font-medium leading-relaxed text-gray-light">
                      Deletion requests are still handled manually so nothing disappears until you explicitly send the request.
                    </p>
                  </div>

                  <Button type="button" variant="danger" className="px-8" onClick={() => setShowDeleteConfirm(true)}>
                    Delete account
                  </Button>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="sticky-bar !top-auto relative">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-gray-nav transition-colors hover:text-red"
                  >
                    <SignOut size={20} weight="bold" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="px-4 sm:px-6">
                      <X size={18} weight="bold" className="sm:mr-2" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                    <Button type="submit" disabled={loading || isSaved} className="px-4 sm:px-8">
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
        isOpen={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        title="Reflections Pro"
        description="Checkout is not live yet, but you can register interest instead of hitting a dead button."
        icon={<Sparkle size={20} weight="duotone" />}
        size="md"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setShowUpgradeSheet(false)}>
              Maybe later
            </Button>
            <Button variant="primary" onClick={handleUpgradeRequest}>
              Email me about Pro
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-[14px] font-medium leading-relaxed text-gray-light">
            Pro is intended to unlock unlimited notes, AI reflections, and Life Wiki refreshes without turning the app into a hard sell.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Surface variant="flat" className="overflow-hidden">
              <div className="p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-green">Includes</p>
                <p className="mt-2 text-[14px] font-medium text-gray-light">Unlimited note writing and AI-supported reflections.</p>
              </div>
            </Surface>
            <Surface variant="flat" className="overflow-hidden">
              <div className="p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-green">Also includes</p>
                <p className="mt-2 text-[14px] font-medium text-gray-light">Ongoing Life Wiki refreshes and future wellness insights.</p>
              </div>
            </Surface>
          </div>
        </div>
      </ModalSheet>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteRequest}
        title="Request account deletion?"
        description="We will open an email draft so you can explicitly request deletion. Nothing is removed until that request is sent and processed."
        confirmLabel="Open deletion request"
        cancelLabel="Keep my account"
        variant="danger"
      />
    </>
  );
};
