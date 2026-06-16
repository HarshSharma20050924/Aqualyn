import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Switch, TextInput, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, LogOut, Folder, Palette, Download, Trash2, Plus, ChevronRight, Wallet, CreditCard, Bell, Shield } from 'lucide-react-native';
import { useAppContext } from '../src/context/AppContext';
import { Theme } from '../src/config/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { currentUser, addToast, folders, createFolder, deleteFolder, theme, setTheme, logout } = useAppContext();
  
  const [subView, setSubView] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Simple visual state
  const [accColor, setAccColor] = useState(theme?.accentColor || '#0ea5e9');
  const [bubStyle, setBubStyle] = useState(theme?.bubbleStyle || 'rounded');
  const [walletBalance, setWalletBalance] = useState(12450.00);

  if (!currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>Please log in</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    addToast('Logged out successfully', 'success');
    router.replace('/login');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreateFolder(false);
    addToast('Folder created', 'success');
  };

  const SettingItem = ({ icon: Icon, label, subtext, onClick, color = "#0ea5e9" }: any) => (
    <TouchableOpacity onPress={onClick} style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <View style={[styles.settingIconBg, { backgroundColor: `${color}15` }]}>
          <Icon size={20} color={color} />
        </View>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {subtext && <Text style={styles.settingSubtext}>{subtext}</Text>}
        </View>
      </View>
      <ChevronRight size={18} color="rgba(255, 255, 255, 0.4)" />
    </TouchableOpacity>
  );

  const SubHeader = ({ title }: { title: string }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => setSubView(null)} style={styles.backButton}>
        <ArrowLeft size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderContent = () => {
    switch (subView) {
      case 'appearance':
        return (
          <View style={{ flex: 1 }}>
            <SubHeader title="Appearance" />
            <ScrollView style={styles.subViewContainer}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Accent Color</Text>
                <View style={styles.colorPalette}>
                  {['#0ea5e9', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#eab308'].map(color => (
                    <TouchableOpacity 
                      key={color} 
                      style={[
                        styles.colorCircle, 
                        { backgroundColor: color }, 
                        accColor === color && styles.colorCircleActive
                      ]}
                      onPress={() => {
                        setAccColor(color);
                        setTheme((prev: any) => ({ ...prev, accentColor: color }));
                      }}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Bubble Style</Text>
                <View style={styles.bubbleOptions}>
                  {['rounded', 'sharp', 'glass'].map(style => (
                    <TouchableOpacity 
                      key={style}
                      style={[styles.bubbleBtn, bubStyle === style && styles.bubbleBtnActive]}
                      onPress={() => {
                        setBubStyle(style as any);
                        setTheme((prev: any) => ({ ...prev, bubbleStyle: style }));
                      }}
                    >
                      <Text style={[styles.bubbleBtnText, bubStyle === style && styles.bubbleBtnTextActive]}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        );

      case 'folders':
        return (
          <View style={{ flex: 1 }}>
            <SubHeader title="Chat Folders" />
            <ScrollView style={styles.subViewContainer}>
              <View style={styles.createFolderHeader}>
                <Text style={styles.foldersTitle}>Your Folders</Text>
                <TouchableOpacity onPress={() => setShowCreateFolder(true)}>
                  <Text style={styles.createFolderBtnText}>+ Create New</Text>
                </TouchableOpacity>
              </View>

              {showCreateFolder && (
                <View style={styles.folderInputCard}>
                  <TextInput
                    style={styles.folderInput}
                    placeholder="Folder Name"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    autoFocus
                  />
                  <View style={styles.folderInputActions}>
                    <TouchableOpacity onPress={() => setShowCreateFolder(false)}>
                      <Text style={styles.folderCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCreateFolder}>
                      <Text style={styles.folderSaveText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.sectionCard}>
                {folders.length === 0 ? (
                  <Text style={styles.emptyText}>No folders created yet</Text>
                ) : (
                  folders.map((folder: any) => (
                    <View key={folder.id} style={styles.folderRow}>
                      <Folder size={20} color="#0ea5e9" />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.folderNameText}>{folder.name}</Text>
                        <Text style={styles.folderCountText}>{folder.chatIds.length} chats</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteFolder(folder.id)}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        );

      case 'wallet':
        return (
          <View style={{ flex: 1 }}>
            <SubHeader title="Wallet" />
            <ScrollView style={styles.subViewContainer}>
              <View style={styles.walletBalanceCard}>
                <Text style={styles.walletLabel}>Total Balance</Text>
                <Text style={styles.walletBalance}>${walletBalance.toFixed(2)}</Text>
                <View style={styles.walletActions}>
                  <TouchableOpacity style={styles.walletBtn} onPress={() => addToast('Add funds coming soon', 'info')}>
                    <Text style={styles.walletBtnText}>Add Funds</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.walletBtn} onPress={() => addToast('Withdraw coming soon', 'info')}>
                    <Text style={styles.walletBtnText}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Payment Methods</Text>
                <View style={styles.paymentMethod}>
                  <CreditCard size={20} color="#0ea5e9" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.paymentMethodTitle}>Visa •••• 4242</Text>
                    <Text style={styles.paymentMethodSub}>Expires 12/25</Text>
                  </View>
                  <Text style={styles.primaryPaymentTag}>Primary</Text>
                </View>
                <TouchableOpacity style={styles.addPaymentBtn} onPress={() => addToast('Add payment method coming soon', 'info')}>
                  <Plus size={18} color="#0ea5e9" />
                  <Text style={styles.addPaymentBtnText}>Add Bank Account or Card</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        );

      case 'notifications':
        return (
          <View style={{ flex: 1 }}>
            <SubHeader title="Notifications" />
            <ScrollView style={styles.subViewContainer}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Sound Effects</Text>
                  <Switch value={true} onValueChange={() => {}} thumbColor="white" trackColor={{ true: '#0ea5e9' }} />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Vibration</Text>
                  <Switch value={true} onValueChange={() => {}} thumbColor="white" trackColor={{ true: '#0ea5e9' }} />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Show Previews</Text>
                  <Switch value={true} onValueChange={() => {}} thumbColor="white" trackColor={{ true: '#0ea5e9' }} />
                </View>
              </View>
            </ScrollView>
          </View>
        );

      case 'security':
        return (
          <View style={{ flex: 1 }}>
            <SubHeader title="Security" />
            <ScrollView style={styles.subViewContainer}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Privacy Settings</Text>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Block Screenshotting</Text>
                  <Switch value={true} onValueChange={() => {}} thumbColor="white" trackColor={{ true: '#0ea5e9' }} />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Two-Step Verification</Text>
                  <Switch value={false} onValueChange={() => {}} thumbColor="white" trackColor={{ true: '#0ea5e9' }} />
                </View>
              </View>
            </ScrollView>
          </View>
        );

      default:
        return (
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Settings</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView}>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <Image source={{ uri: currentUser.avatar }} style={styles.profileAvatar} />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{currentUser.name}</Text>
                  <Text style={styles.profileEmail}>{currentUser.email}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.manageBtn}
                  onPress={() => router.push('/edit-profile')}
                >
                  <Text style={styles.manageBtnText}>Manage</Text>
                </TouchableOpacity>
              </View>

              {/* Main List */}
              <View style={styles.sectionCardList}>
                <SettingItem 
                  icon={Palette} 
                  label="Appearance" 
                  subtext="Theme, accent color, bubble style" 
                  onClick={() => setSubView('appearance')}
                  color="#a855f7"
                />
                <SettingItem 
                  icon={Folder} 
                  label="Chat Folders" 
                  subtext="Organize chats into categories" 
                  onClick={() => setSubView('folders')}
                  color="#3b82f6"
                />
                <SettingItem 
                  icon={Wallet} 
                  label="Wallet" 
                  subtext="Direct transfers, card settings" 
                  onClick={() => setSubView('wallet')}
                  color="#10b981"
                />
                <SettingItem 
                  icon={Bell} 
                  label="Notifications" 
                  subtext="Sound and display triggers" 
                  onClick={() => setSubView('notifications')}
                  color="#eab308"
                />
                <SettingItem 
                  icon={Shield} 
                  label="Security" 
                  subtext="Privacy & safety configuration" 
                  onClick={() => setSubView('security')}
                  color="#6366f1"
                />
              </View>

              <View style={styles.sectionCardList}>
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => addToast('Chats exported successfully as ZIP', 'success')}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={[styles.settingIconBg, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                      <Download size={20} color="#f97316" />
                    </View>
                    <View>
                      <Text style={styles.settingLabel}>Export all chats as ZIP</Text>
                      <Text style={styles.settingSubtext}>Download conversation logs</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color="rgba(255, 255, 255, 0.4)" />
                </TouchableOpacity>
              </View>

              {/* Log Out Button */}
              <TouchableOpacity 
                style={styles.logoutBtn}
                onPress={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Logout Confirm Modal */}
            {showLogoutConfirm && (
              <Modal transparent={true} visible={true} animationType="fade">
                <View style={styles.modalOverlay}>
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmTitle}>Log Out</Text>
                    <Text style={styles.confirmText}>Are you sure you want to log out of Aqualyn?</Text>
                    <View style={styles.confirmActions}>
                      <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowLogoutConfirm(false)}>
                        <Text style={styles.confirmCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.confirmDestructive} onPress={handleLogout}>
                        <Text style={styles.confirmDestructiveText}>Log Out</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a192f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  subViewContainer: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  manageBtn: {
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  manageBtnText: {
    color: '#0a192f',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionCardList: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 10,
    marginBottom: 40,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  confirmTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confirmText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  confirmCancelText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
  confirmDestructive: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmDestructiveText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: 'white',
  },
  bubbleOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  bubbleBtn: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bubbleBtnActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  bubbleBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  bubbleBtnTextActive: {
    color: 'white',
  },
  createFolderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  foldersTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createFolderBtnText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    fontSize: 13,
  },
  folderInputCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
    marginBottom: 16,
  },
  folderInput: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
  },
  folderInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
  },
  folderCancelText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  folderSaveText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  folderNameText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  folderCountText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    paddingVertical: 20,
  },
  walletBalanceCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    marginBottom: 16,
    alignItems: 'center',
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  walletBalance: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  walletBtn: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentMethodTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  paymentMethodSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  primaryPaymentTag: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  addPaymentBtnText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  toggleLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
