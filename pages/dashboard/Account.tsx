import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkle,
  User, 
  Envelope, 
  ShieldCheck, 
  Warning, 
  FloppyDisk, 
  Camera, 
  Lock, 
  CaretRight, 
  Globe, 
  Key, 
  Trash, 
  DeviceMobile, 
  SignOut, 
  X, 
  Check, 
  CircleNotch 
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../src/supabaseClient';
import { RoutePath } from '../../types';
import { storageService } from '../../services/storageService';
import { StorageImage } from '../../components/ui/StorageImage';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { WellnessAccess } from '../../types';

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!isAuthenticated || !user) return navigate(RoutePath.LOGIN);
        const { data: { session } } = await supabase.auth.getSession();
        const fullUser = session?.user;
        if (!fullUser) return navigate(RoutePath.LOGIN);

        setUserId(fullUser.id);
        setEmail(fullUser.email || '');
        setAvatarPath(fullUser.user_metadata?.avatar_url || null);
        setLastSignIn(fullUser.last_sign_in_at || null);
        setFormData({
          fullName: fullUser.user_metadata?.full_name || '',
          displayName: fullUser.user_metadata?.display_name || '',
          timezone: fullUser.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        });

        const accessData = await profileService.getWellnessAccess();
        setAccess(accessData);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, [navigate, isAuthenticated, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userId) {
      setLoading(true);
      try {
        const path = await storageService.uploadFile(file, userId, 'avatar', 'profile');
        setAvatarPath(path);
        await supabase.auth.updateUser({ data: { avatar_url: path } });
      } catch (err) {
        alert("Failed to upload avatar.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          display_name: formData.displayName,
          timezone: formData.timezone
        }
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      alert("Update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(RoutePath.LOGIN);
  };

  if (fetching) return (
    <div className="flex h-screen w-full items-center justify-center bg-body">
      <CircleNotch size={32} className="animate-spin text-green" />
    </div>
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto pb-32 pt-12 px-6">
      <header className="mb-16 text-center lg:text-left">
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-gray-text lowercase leading-none mb-4">Personal Sanctuary</h1>
        <p className="text-[15px] font-bold uppercase tracking-tight text-gray-light opacity-60">Manage your reflections and personal data.</p>
      </header>

      <div className="border border-border rounded-[32px] bg-white overflow-hidden mb-16">
        <div>
          <form onSubmit={handleSubmit} className="divide-y-2 divide-border/50">
            
            {/* Profile Section */}
            <div className="p-10 flex flex-col lg:flex-row items-center lg:items-start gap-12">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-800 shadow-xl overflow-hidden bg-white/5">
                  {avatarPath ? (
                    <StorageImage path={avatarPath} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-nav">
                      <User size={48} weight="duotone" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-green text-white border-4 border-white dark:border-zinc-800 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  <Camera size={18} weight="bold" />
                </div>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="flex-grow space-y-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Full Name" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    className="rounded-2xl border-2 border-border bg-transparent focus:border-green/30"
                  />
                  <Input 
                    label="Display Name" 
                    name="displayName" 
                    value={formData.displayName} 
                    onChange={handleChange} 
                    className="rounded-2xl border-2 border-border bg-transparent focus:border-green/30"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[13px] font-black uppercase tracking-widest text-gray-nav ml-1">Timezone</label>
                  <div className="relative">
                    <Globe size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-nav" />
                    <select 
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="w-full h-14 pl-14 pr-6 rounded-2xl border-2 border-border bg-transparent text-[15px] font-bold text-gray-text outline-none focus:border-green transition-all appearance-none"
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
            
            {/* Membership Section */}
            <div className="p-10 space-y-10 border-t border-border/30">
               <div className="flex items-center gap-4 mb-4">
                 <Sparkle size={28} weight="duotone" className="text-green" />
                 <h3 className="font-display text-[24px] text-gray-text tracking-tight">Membership</h3>
               </div>
               
               <div className="border border-border rounded-3xl bg-green/5 overflow-hidden">
                 <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                       <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${access?.planTier === 'pro' ? 'bg-green text-white' : 'bg-white border border-border text-gray-nav'}`}>
                          {access?.planTier === 'pro' ? <ShieldCheck size={32} weight="bold" /> : <Sparkle size={32} weight="bold" />}
                       </div>
                       <div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-green mb-1">Current Tier</p>
                          <h4 className="text-[22px] font-display text-gray-text capitalize">{access?.planTier || 'Free'} Plan</h4>
                          <p className="text-[13px] font-medium text-gray-light">
                             {access?.planTier === 'pro' 
                               ? 'Unlimited narrative synthesis enabled.' 
                               : `Used ${access?.freeAiReflectionsUsed || 0} of 1 free AI insight.`}
                          </p>
                       </div>
                    </div>
                    
                    {access?.planTier !== 'pro' && (
                      <Button 
                        variant="primary" 
                        className="h-14 px-10 rounded-2xl font-bold bg-green text-white hover:bg-green/90 shadow-lg shadow-green/10 transition-all active:scale-[0.98]"
                        onClick={() => alert("Premium upgrade flow coming soon!")}
                      >
                         Upgrade to Pro
                      </Button>
                    )}
                 </div>
               </div>
            </div>

            {/* Security Section */}
            <div className="p-10 space-y-10">
              <div className="flex items-center gap-4 mb-4">
                <ShieldCheck size={28} weight="duotone" className="text-blue" />
                <h3 className="font-display text-[24px] text-gray-text tracking-tight">Security</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-border flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <Key size={24} weight="bold" className="text-gray-nav" />
                    <div>
                      <p className="text-[14px] font-bold text-gray-text">Password</p>
                      <p className="text-[12px] font-medium text-gray-light">Keep your account safe.</p>
                    </div>
                  </div>
                  <CaretRight size={18} weight="bold" className="text-gray-nav group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-border flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-4">
                    <DeviceMobile size={24} weight="bold" className="text-gray-nav" />
                    <div>
                      <p className="text-[14px] font-bold text-gray-text">2FA</p>
                      <p className="text-[12px] font-medium text-gray-light">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-10 bg-red-500/5">
              <div className="flex items-center gap-4 mb-6">
                <Warning size={28} weight="duotone" className="text-red" />
                <h3 className="font-display text-[24px] text-red tracking-tight">Danger Zone</h3>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[14px] font-medium text-gray-light max-w-md">Permanently delete your account and all reflections. This action is irreversible.</p>
                <Button variant="danger" className="h-12 px-8 rounded-xl font-bold shadow-lg" onClick={() => setShowDeleteConfirm(true)}>
                  Delete Account
                </Button>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className={`p-8 flex items-center justify-between sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-border z-[100] ${isMobile ? 'pb-[calc(2rem + env(safe-area-inset-bottom))]' : ''}`}>
              <button 
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-nav hover:text-red transition-all font-bold text-[13px] uppercase tracking-widest"
              >
                Sign out
              </button>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => navigate(-1)}
                  className="h-12 rounded-xl border border-border font-bold text-[14px] bg-white text-gray-text hover:bg-gray-50 transition-all px-6 sm:px-8"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || isSaved}
                  className={`h-12 rounded-xl font-bold text-[14px] bg-green text-white hover:bg-green/90 shadow-lg shadow-green/10 transition-all active:scale-[0.98] ${isSaved ? 'bg-green text-white' : ''} px-6 sm:px-10`}
                >
                  {loading ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-body/60 backdrop-blur-xl animate-in fade-in">
          <div className="bezel-outer max-w-md w-full">
            <div className="bezel-inner p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-6">
                <Warning size={32} weight="fill" />
              </div>
              <h2 className="text-[28px] font-display text-gray-text mb-4">Wipe Everything?</h2>
              <p className="text-[15px] font-medium text-gray-light leading-relaxed mb-10">This will permanently delete all your reflections. Are you absolutely sure?</p>
              <div className="flex flex-col gap-3">
                <Button variant="danger" className="h-14 w-full rounded-2xl font-bold shadow-lg">Confirm Delete</Button>
                <Button variant="secondary" className="h-14 w-full rounded-2xl font-bold" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
