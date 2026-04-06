import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Camera, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function EditProfileScreen({ onBack }: { onBack: () => void }) {
  const { currentUser, setCurrentUser, addToast } = useAppContext();
  
  const [name, setName] = useState(currentUser?.displayName || currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [role, setRole] = useState(currentUser?.role || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [showPhoneTo, setShowPhoneTo] = useState(currentUser?.showPhoneTo || 'everyone');
  const [searchByPhone, setSearchByPhone] = useState(currentUser?.searchByPhone ?? true);
  const [avatar, setAvatar] = useState(currentUser?.largeAvatar || currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const handleUsernameChange = (val: string) => {
    // Only allow lowercase and underscores
    setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  const handleSave = async () => {
    if (!username) {
        addToast('Username cannot be empty', 'error');
        return;
    }
    setIsSaving(true);
    try {
      const { auth } = await import('../config/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:5000/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ displayName: name, username, bio, role, avatar, phone, showPhoneTo, searchByPhone })
      });
      if (!res.ok) {
        if (res.status === 409) {
           addToast('Username already taken. Please use a different one.', 'error');
           setIsSaving(false);
           return;
        }
        throw new Error('Failed to save');
      }
      const data = await res.json();
      setCurrentUser(data.user);
      addToast('Profile updated successfully', 'success');
      onBack();
    } catch (e) {
      addToast('Error saving profile', 'error');
    }
    setIsSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app we upload to Firebase Storage, here we use local URL mock for demo
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-surface min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 duration-200">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-headline tracking-tight font-bold text-lg text-on-surface">Edit Profile</h1>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="text-primary font-bold flex items-center gap-2 hover:opacity-80 disabled:opacity-50">
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-white text-xs font-bold">Change</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1">Display Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-on-surface"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1">Username</label>
            <div className="flex relative items-center">
              <span className="absolute left-4 text-on-surface-variant font-bold">@</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl pl-8 pr-4 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-on-surface"
              />
            </div>
            <p className="text-xs text-on-surface-variant ml-1">You can choose a unique username on Aqualyn (lowercase and underscores only). People will be able to find you securely without needing your phone number.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1">Role / Title</label>
            <input 
              type="text" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-on-surface"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1">About</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Hey there! I am using Aqualyn."
              className="w-full bg-white/50 border border-white/40 rounded-2xl p-4 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-on-surface resize-none"
            />
          </div>
          
          <div className="pt-4 border-t border-white/20">
            <h2 className="text-xl font-bold font-headline mb-4 text-on-surface">Privacy & Contact</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 000 000 0000"
                  className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-on-surface"
                />
              </div>

              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-sm font-bold text-on-surface-variant ml-1">Show Mobile Number To</label>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 flex items-center justify-between cursor-pointer hover:bg-white transition-all shadow-inner group"
                >
                  <span className="font-bold text-on-surface">
                    {showPhoneTo === 'everyone' ? 'Everyone' : 
                     showPhoneTo === 'followers' ? 'Followers' : 
                     showPhoneTo === 'close_friends' ? 'Close Friends' : 'No One (Private)'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-[calc(100%+8px)] left-0 w-full glass-card border border-white/40 rounded-2xl shadow-xl overflow-hidden z-50 p-2 space-y-1"
                    >
                      {[
                        { id: 'everyone', label: 'Everyone' },
                        { id: 'followers', label: 'Followers' },
                        { id: 'close_friends', label: 'Close Friends' },
                        { id: 'no_one', label: 'No One (Private)' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setShowPhoneTo(opt.id as any); setIsDropdownOpen(false); }}
                          className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors text-left font-bold text-sm ${showPhoneTo === opt.id ? 'bg-secondary text-white' : 'hover:bg-white/40 text-on-surface'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/40">
                <div>
                  <h3 className="font-bold text-on-surface text-sm">Search by Phone</h3>
                  <p className="text-xs text-on-surface-variant max-w-[200px]">Allow users to find your account by searching this mobile number globally.</p>
                </div>
                <button 
                  onClick={() => setSearchByPhone(!searchByPhone)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${searchByPhone ? 'bg-secondary' : 'bg-surface-container'}`}
                >
                  <motion.div 
                    initial={false}
                    animate={{ x: searchByPhone ? 24 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
