import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, LogOut, Folder, Palette, Download, Trash2, Plus, ChevronRight, Wallet, CreditCard, Banknote, Bell, Shield } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import VisualPreferences from '../components/settings/VisualPreferences';
import NotificationsSettings from '../components/settings/NotificationsSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import StorageSettings from '../components/settings/StorageSettings';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function SettingsScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (s: string) => void }) {
  const { currentUser, addToast, folders, setFolders, createFolder, deleteFolder, theme, setTheme, logout } = useAppContext();
  const [subView, setSubView] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!currentUser) return null;

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    addToast('Logged out successfully', 'success');
    if (onNavigate) onNavigate('login');
  };

  const handleExportAll = () => {
    addToast('All chats exported as ZIP', 'success');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreateFolder(false);
  };

  const SettingItem = ({ icon: Icon, label, subtext, onClick, color = "text-on-surface" }: any) => (
    <button 
      onClick={onClick}
      className="w-full p-5 flex items-center justify-between hover:bg-white/40 transition-colors group border-b border-white/10 last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="font-bold text-on-surface">{label}</p>
          {subtext && <p className="text-xs text-on-surface-variant">{subtext}</p>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
    </button>
  );

  const SubViewHeader = ({ title }: { title: string }) => (
    <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-sm h-16 flex items-center px-6">
      <button onClick={() => setSubView(null)} className="text-slate-500 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 duration-200 mr-4">
        <ArrowLeft className="w-6 h-6" />
      </button>
      <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">{title}</h1>
    </header>
  );

  const renderSubView = () => {
    switch (subView) {
      case 'folders':
        return (
          <motion.div 
            key="folders"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="bg-surface min-h-screen pb-32 absolute inset-0 z-50 overflow-y-auto"
          >
            <SubViewHeader title="Chat Folders" />
            <main className="pt-24 px-4 max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Your Folders</h3>
                <button 
                  onClick={() => setShowCreateFolder(true)}
                  className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Create New
                </button>
              </div>

              {showCreateFolder && (
                <div className="glass-card p-4 rounded-2xl border border-secondary/30 space-y-3">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Folder Name" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-2 outline-none focus:border-secondary transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCreateFolder(false)} className="px-4 py-1.5 text-sm font-bold text-on-surface-variant">Cancel</button>
                    <button onClick={handleCreateFolder} className="px-4 py-1.5 bg-secondary text-white rounded-lg text-sm font-bold">Create</button>
                  </div>
                </div>
              )}

              <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
                {folders.map(folder => (
                  <div key={folder.id} className="p-5 border-b border-white/20 flex items-center justify-between hover:bg-white/40 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{folder.name}</p>
                        <p className="text-xs text-on-surface-variant">{folder.chatIds.length} chats</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                        className="p-2 text-on-surface-variant hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </motion.div>
        );
      case 'appearance':
        return (
          <motion.div 
            key="appearance"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="bg-surface min-h-screen pb-32 absolute inset-0 z-50 overflow-y-auto"
          >
            <SubViewHeader title="Appearance" />
            <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
              <VisualPreferences />
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider px-2">Theme Engine</h3>
                <div className="glass-card rounded-[2rem] p-6 border border-white/40 shadow-sm space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-on-surface">Accent Color</label>
                    <div className="flex gap-3 flex-wrap">
                      {['#0891b2', '#059669', '#7c3aed', '#db2777', '#ea580c', '#f59e0b', '#10b981'].map(color => (
                        <button 
                          key={color}
                          onClick={() => setTheme(prev => ({ ...prev, accentColor: color }))}
                          className={`w-10 h-10 rounded-full border-2 transition-transform active:scale-90 ${theme.accentColor === color ? 'border-on-surface scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-on-surface">Bubble Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['rounded', 'sharp', 'glass'] as const).map(style => (
                        <button 
                          key={style}
                          onClick={() => setTheme(prev => ({ ...prev, bubbleStyle: style }))}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${theme.bubbleStyle === style ? 'bg-secondary text-white border-secondary' : 'bg-white/40 text-on-surface-variant border-white/20'}`}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-on-surface">Font Scaling</label>
                      <span className="text-xs font-bold text-secondary">{theme.fontSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="12" 
                      max="24" 
                      value={theme.fontSize} 
                      onChange={(e) => setTheme(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary"
                    />
                  </div>
                </div>
              </div>
            </main>
          </motion.div>
        );
      case 'wallet':
        return (
          <motion.div 
            key="wallet"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="bg-surface min-h-screen pb-32 absolute inset-0 z-50 overflow-y-auto"
          >
            <SubViewHeader title="Wallet" />
            <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
              <div className="glass-card p-6 rounded-[2rem] bg-gradient-to-br from-primary to-secondary text-white border-none shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Balance</p>
                <h3 className="text-3xl font-black font-headline">$12,450.00</h3>
                <div className="mt-6 flex gap-3">
                  <button className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-colors backdrop-blur-md">Add Funds</button>
                  <button className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-colors backdrop-blur-md">Withdraw</button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider px-2">Payment Methods</h3>
                <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
                  <div className="p-5 border-b border-white/20 flex items-center justify-between hover:bg-white/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Visa •••• 4242</p>
                        <p className="text-xs text-on-surface-variant">Expires 12/25</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary">Primary</span>
                  </div>
                  <button className="w-full p-5 flex items-center gap-4 hover:bg-white/40 transition-colors text-secondary">
                    <Plus className="w-5 h-5" />
                    <span className="font-bold">Add Bank Account or Card</span>
                  </button>
                </div>
              </div>
            </main>
          </motion.div>
        );
      case 'storage':
        return (
          <motion.div 
            key="storage"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="bg-surface min-h-screen pb-32 absolute inset-0 z-50 overflow-y-auto"
          >
            <SubViewHeader title="Data and Storage" />
            <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
              <StorageSettings />
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider px-2">Export</h3>
                <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
                  <button onClick={handleExportAll} className="w-full p-5 flex items-center gap-4 hover:bg-white/40 transition-colors text-on-surface">
                    <Download className="w-5 h-5 text-secondary" />
                    <div className="text-left">
                      <p className="font-bold">Export all chats as ZIP</p>
                      <p className="text-xs text-on-surface-variant">Download a backup of all conversations</p>
                    </div>
                  </button>
                </div>
              </div>
            </main>
          </motion.div>
        );
      case 'security':
        return (
          <motion.div 
            key="security"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="bg-surface min-h-screen pb-32 absolute inset-0 z-50 overflow-y-auto"
          >
            <SubViewHeader title="Security" />
            <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
              <SecuritySettings />
            </main>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div 
            key="notifications"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="bg-surface min-h-screen pb-32 absolute inset-0 z-50 overflow-y-auto"
          >
            <SubViewHeader title="Notifications" />
            <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
              <NotificationsSettings />
            </main>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative overflow-y-auto min-h-screen">
      <AnimatePresence mode="wait">
        {!subView ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="bg-surface min-h-screen pb-32 overflow-y-auto"
          >
            <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)] h-16 flex items-center px-6">
              <button onClick={onBack} className="text-slate-500 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 duration-200 mr-4">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">Settings</h1>
            </header>

            <main className="pt-24 px-4 md:px-8 max-w-3xl mx-auto space-y-8">
              <div className="glass-card p-4 sm:p-6 rounded-[2rem] flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 border border-white/40 shadow-sm relative overflow-hidden text-center sm:text-left">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="w-20 h-20 shrink-0 rounded-full border-4 border-white shadow-md overflow-hidden z-10">
                  <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 z-10 w-full min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface truncate">{currentUser.name}</h2>
                  <p className="text-on-surface-variant font-medium text-sm truncate">{currentUser.email}</p>
                </div>
                <button onClick={() => onNavigate && onNavigate('edit-profile')} className="mt-2 sm:mt-0 px-4 py-2 bg-white/60 hover:bg-white text-primary font-semibold rounded-full shadow-sm transition-colors text-sm border border-white/40 z-10 shrink-0">
                  Manage
                </button>
              </div>

              <div className="space-y-6">
                <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
                  <SettingItem 
                    icon={Palette} 
                    label="Appearance" 
                    subtext="Theme, accent color, bubble style" 
                    onClick={() => setSubView('appearance')}
                    color="text-secondary"
                  />
                  <SettingItem 
                    icon={Folder} 
                    label="Chat Folders" 
                    subtext="Organize your chats into folders" 
                    onClick={() => setSubView('folders')}
                    color="text-blue-500"
                  />
                  <SettingItem 
                    icon={Wallet} 
                    label="Wallet" 
                    subtext="Balance, payments, cards" 
                    onClick={() => setSubView('wallet')}
                    color="text-emerald-500"
                  />
                  <SettingItem 
                    icon={Bell} 
                    label="Notifications" 
                    subtext="Sound, badges, alerts" 
                    onClick={() => setSubView('notifications')}
                    color="text-yellow-500"
                  />
                  <SettingItem 
                    icon={Shield} 
                    label="Security" 
                    subtext="Privacy, two-step verification" 
                    onClick={() => setSubView('security')}
                    color="text-indigo-500"
                  />
                </div>

                <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
                  <SettingItem 
                    icon={Download} 
                    label="Data and Storage" 
                    subtext="Export chats, storage usage" 
                    onClick={() => setSubView('storage')}
                    color="text-orange-500"
                  />
                  <button onClick={handleExportAll} className="w-full p-5 flex items-center gap-4 hover:bg-white/40 transition-colors text-on-surface border-b border-white/10">
                    <Download className="w-5 h-5 text-secondary" />
                    <div className="text-left">
                      <p className="font-bold">Export all chats as ZIP</p>
                      <p className="text-xs text-on-surface-variant">Download a backup of all conversations</p>
                    </div>
                  </button>
                </div>

                <button 
                  onClick={() => setShowLogoutConfirm(true)} 
                  className="w-full p-4 rounded-2xl glass-card border border-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-50/50 transition-colors active:scale-95"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </div>
            </main>
          </motion.div>
        ) : (
          renderSubView()
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out of Aqualyn? You will need to verify your identity to log back in."
        confirmText="Log Out"
        isDestructive={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
