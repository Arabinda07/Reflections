import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, AlertTriangle, Save, Camera, Lock, ChevronRight, Globe, Key, Trash2, Smartphone, LogOut, X, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../src/supabaseClient';
import { RoutePath } from '../../types';
import { storageService } from '../../services/storageService';
import { StorageImage } from '../../components/ui/StorageImage';
import { useAuth } from '../../context/AuthContext';

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // User specific state
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  // Fetch Supabase User on Mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!isAuthenticated || !user) {
          navigate(RoutePath.LOGIN);
          return;
        }

        // We still need to get the full user object from Supabase to get metadata
        // like last_sign_in_at, but we can use getSession which is faster and doesn't
        // trigger the lock stealing as often, or just use the context user if we don't need it.
        // Actually, let's just use getSession.
        const { data: { session } } = await supabase.auth.getSession();
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
          timezone: fullUser.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchUser();
  }, [navigate, isAuthenticated, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userId) {
      try {
        setLoading(true);
        // Upload to {userId}/avatar/profile.ext
        const extension = file.name.split('.').pop();
        const path = await storageService.uploadFile(file, userId, 'avatar', 'profile');
        
        // Update local state to show preview immediately (using blob for speed, but real path for save)
        setAvatarPath(path);
        
        // Auto-save the avatar change
        const { error } = await supabase.auth.updateUser({
          data: { avatar_url: path }
        });
        
        if (error) throw error;
        
      } catch (error) {
        console.error("Error uploading avatar:", error);
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
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          display_name: formData.displayName,
          timezone: formData.timezone
          // Avatar is updated immediately on file select
        }
      });

      if (error) throw error;
      
      // Simulate save delay
      setTimeout(() => {
        setLoading(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }, 500);

    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/account',
    });
    if (error) alert(error.message);
    else alert('Password reset email sent!');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(RoutePath.LOGIN);
  };

  if (fetching) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-slate-500">
         <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            <span className="text-sm font-medium">Loading account...</span>
         </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto pb-20 animate-in fade-in duration-700 px-4 md:px-0">
        
        {/* Main Panel */}
        <div className="relative rounded-[40px] border-2 border-border bg-white shadow-[0_12px_0_0_#E5E5E5] overflow-hidden transition-all duration-500 liquid-glass">
            
            <form onSubmit={handleSubmit} className="divide-y-2 divide-border">
                
                {/* Header Section */}
                <div className="px-10 py-12 flex flex-col items-center justify-center text-center relative overflow-hidden bg-white">
                    {/* Avatar Group */}
                    <div className="group relative mb-6 cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                        <div className="h-32 w-32 rounded-full p-1 bg-white border-4 border-border shadow-3d-gray transition-transform duration-500 group-hover:scale-105 relative overflow-hidden">
                             {avatarPath ? (
                                <StorageImage 
                                    path={avatarPath} 
                                    alt="Profile" 
                                    className="h-full w-full rounded-full object-cover" 
                                />
                             ) : (
                                <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-gray-nav">
                                    <User size={48} />
                                </div>
                             )}
                        </div>
                        <button type="button" className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-text border-2 border-border shadow-3d-gray transition-all hover:scale-110 hover:text-blue">
                            <Camera size={18} />
                        </button>
                        <input 
                            id="avatar-upload"
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <h1 className="text-3xl font-display text-gray-text mb-2 lowercase">
                        {formData.fullName || formData.displayName || email.split('@')[0] || 'user'}
                    </h1>
                    <p className="text-gray-nav font-extrabold flex items-center gap-2 bg-white px-4 py-1.5 rounded-xl border-2 border-border uppercase text-[11px] tracking-wider">
                        <Mail size={14} />
                        {email}
                    </p>
                </div>

                {/* Main Settings Grid */}
                <div className="px-6 sm:px-12 py-12 space-y-12 bg-white">
                    
                    {/* Section: Profile Information */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue border-2 border-border shadow-3d-gray">
                                 <User size={20} strokeWidth={2.5} />
                             </div>
                             <h3 className="text-[18px] font-display text-gray-text lowercase">personal information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <Input 
                                label="Full Name" 
                                name="fullName" 
                                value={formData.fullName} 
                                onChange={handleChange} 
                                placeholder="e.g. Jane Doe"
                                className="rounded-2xl border-2 border-border focus:border-blue/30"
                             />
                             <Input 
                                label="Display Name" 
                                name="displayName" 
                                value={formData.displayName} 
                                onChange={handleChange} 
                                placeholder="e.g. Jane"
                                className="rounded-2xl border-2 border-border focus:border-blue/30"
                             />
                        </div>

                        <div>
                             <label className="ml-1 mb-3 block text-[11px] font-extrabold uppercase tracking-widest text-gray-nav">
                                Timezone
                            </label>
                            <div className="relative group">
                                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-nav group-focus-within:text-blue z-10 transition-colors" size={18} />
                                <select
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleChange}
                                    className="w-full appearance-none rounded-2xl border-2 border-border bg-white pl-12 pr-5 py-4 text-[15px] font-bold text-gray-text transition-all duration-300 hover:border-blue/30 focus:border-blue focus:outline-none shadow-3d-gray active:shadow-none active:translate-y-[2px]"
                                >
                                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="America/Chicago">Central Time (CT)</option>
                                    <option value="America/Denver">Mountain Time (MT)</option>
                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    <option value="Europe/London">London (GMT/BST)</option>
                                    <option value="Europe/Paris">Paris (CET/CEST)</option>
                                    <option value="Asia/Dubai">Dubai (GST)</option>
                                    <option value="Asia/Kolkata">India (IST)</option>
                                    <option value="Asia/Singapore">Singapore (SGT)</option>
                                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                                    <option value="Pacific/Auckland">Auckland (NZST/NZDT)</option>
                                </select>
                                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-nav rotate-90 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Section: Security */}
                    <div className="space-y-8 pt-12 border-t-2 border-border">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue border-2 border-border shadow-3d-gray">
                                 <Shield size={20} strokeWidth={2.5} />
                             </div>
                             <h3 className="text-[18px] font-display text-gray-text lowercase">security & login</h3>
                        </div>

                        <div className="rounded-[32px] border-2 border-border bg-white p-8 shadow-3d-gray">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border-2 border-border text-gray-nav">
                                        <Key size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-gray-text">Password</p>
                                        <p className="text-[12px] font-bold text-gray-nav uppercase">
                                            {lastSignIn ? `Last active: ${new Date(lastSignIn).toLocaleDateString()}` : 'Secure your account'}
                                        </p>
                                    </div>
                                </div>
                                <Button type="button" variant="secondary" size="sm" onClick={handlePasswordReset} className="border-2 border-border shadow-3d-gray active:shadow-none active:translate-y-[2px] text-blue font-extrabold px-6">
                                    RESET
                                </Button>
                            </div>
                            
                            <div className="my-6 h-[2px] w-full bg-border" />
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border-2 border-border text-gray-nav">
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-gray-text">2-Factor Auth</p>
                                        <p className="text-[12px] font-bold text-gray-nav uppercase">Enhanced security</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-border">
                                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                                    <span className="text-[10px] font-black text-gray-nav uppercase">Coming Soon</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Danger Zone */}
                    <div className="space-y-8 pt-12 border-t-2 border-border">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-red border-2 border-border shadow-3d-gray">
                                 <AlertTriangle size={20} strokeWidth={2.5} />
                             </div>
                             <h3 className="text-[18px] font-display text-red lowercase">danger zone</h3>
                        </div>

                        <div className="rounded-[32px] border-2 border-red/20 bg-red/5 p-8">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-[16px] font-bold text-gray-text uppercase">Delete Account</h4>
                                    <p className="text-[13px] text-gray-light font-medium mt-2 leading-relaxed max-w-sm">
                                        Permanently delete your account and all of your content. This action cannot be undone.
                                    </p>
                                </div>
                                <Button type="button" variant="danger" size="sm" className="shadow-3d-red active:shadow-none active:translate-y-[2px] font-extrabold">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    DELETE ACCOUNT
                                </Button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="sticky bottom-0 z-10 flex items-center justify-between border-t-2 border-border bg-white/95 px-4 sm:px-8 py-4 sm:py-6 backdrop-blur-xl gap-3 sm:gap-4">
                    <button 
                        type="button" 
                        onClick={handleSignOut}
                        className="flex items-center justify-center h-12 w-12 sm:w-auto sm:px-4 rounded-xl border-2 border-border bg-white text-gray-nav hover:text-red hover:border-red/30 transition-all shadow-3d-gray active:shadow-none active:translate-y-[2px] group"
                        title="Sign Out"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline ml-2 text-[13px] font-black uppercase tracking-widest">SIGN OUT</span>
                    </button>
                    <div className="flex items-center gap-2 sm:gap-4">
                         <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => navigate(RoutePath.HOME)} 
                            className="flex items-center justify-center h-12 w-12 sm:w-auto !px-0 sm:!px-6 border-2 border-border text-gray-nav font-extrabold shadow-3d-gray active:shadow-none active:translate-y-[2px]"
                            title="Cancel"
                         >
                             <X size={20} className="sm:mr-2" />
                             <span className="hidden sm:inline text-[14px] uppercase">CANCEL</span>
                         </Button>
                         <Button 
                            type="submit" 
                            disabled={loading || isSaved}
                            className={`flex items-center justify-center h-12 w-12 sm:w-auto !px-0 sm:!px-8 font-extrabold transition-all duration-300 ${isSaved ? 'bg-green text-white border-green shadow-3d-green' : 'shadow-3d-green active:shadow-none active:translate-y-[2px]'}`}
                            title="Save Changes"
                         >
                             {loading ? (
                               <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent sm:mr-2"></div>
                             ) : isSaved ? (
                               <Check size={20} className="sm:mr-2" />
                             ) : (
                               <Save size={20} className="sm:mr-2" />
                             )}
                             <span className="hidden sm:inline text-[14px] uppercase">
                                {loading ? 'SAVING...' : isSaved ? 'SAVED!' : 'SAVE'}
                             </span>
                         </Button>
                    </div>
                </div>

            </form>
        </div>
    </div>
  );
};
