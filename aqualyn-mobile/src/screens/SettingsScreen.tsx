import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  LogOut, 
  Folder, 
  Palette, 
  Download, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Wallet, 
  CreditCard, 
  Bell, 
  Shield 
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../context/AppContext';

// Component references replaced with generic native adapters or existing stubs
import VisualPreferences from '../components/settings/VisualPreferences';
import NotificationsSettings from '../components/settings/NotificationsSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import StorageSettings from '../components/settings/StorageSettings';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export default function SettingsScreen({ onBack, onNavigate }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { 
    currentUser, 
    addToast, 
    folders = [], 
    createFolder, 
    deleteFolder, 
    theme, 
    setTheme, 
    logout 
  } = useAppContext() || {};

  const [subView, setSubView] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!currentUser) return null;

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    if (logout) await logout();
    addToast?.('Logged out successfully', 'success');
    if (onNavigate) onNavigate('login');
  };

  const handleExportAll = () => {
    addToast?.('All chats exported as ZIP', 'success');
  };

  const handleCreateFolderLocal = () => {
    if (!newFolderName.trim()) return;
    createFolder?.(newFolderName.trim());
    setNewFolderName('');
    setShowCreateFolder(false);
  };

  // Reusable Native Row Layout Element
  const SettingItem = ({ icon: Icon, label, subtext, onClick, color = "#0f172a" }: any) => (
    <TouchableOpacity 
      onPress={onClick}
      style={styles.settingItemRowTouch}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemContentLeft}>
        <View style={[styles.settingItemIconSquareFrame, { backgroundColor: 'rgba(15,23,42,0.04)' }]}>
          <Icon size={20} color={color} />
        </View>
        <View style={styles.settingItemTextColumn}>
          <Text style={styles.settingItemLabelTypography}>{label}</Text>
          {subtext && <Text style={styles.settingItemSubtextTypography}>{subtext}</Text>}
        </View>
      </View>
      <ChevronRight size={18} color="#94a3b8" />
    </TouchableOpacity>
  );

  // Common Header Template for Dynamic Nested Settings Modules
  const SubViewHeader = ({ title }: { title: string }) => (
    <View style={[styles.subviewStickyHeader, { paddingTop: insets.top, height: 64 + insets.top }]}>
      <View style={styles.subviewHeaderInnerFlexRow}>
        <TouchableOpacity 
          onPress={() => setSubView(null)} 
          style={styles.headerIconButtonCircularTrigger}
        >
          <ArrowLeft size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.subviewHeaderTitleTypographyText}>{title}</Text>
      </View>
    </View>
  );

  const renderSubView = () => {
    switch (subView) {
      case 'folders':
        return (
          <Animated.View 
            entering={FadeIn.duration(250)} 
            exiting={FadeOut.duration(200)} 
            style={styles.subviewAbsoluteOverlayDeckContainer}
          >
            <SubViewHeader title="Chat Folders" />
            <ScrollView 
              contentContainerStyle={[styles.subviewScrollStackContent, { paddingBottom: insets.bottom + 40 }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionHeaderMetaRowBlock}>
                <Text style={styles.sectionCapsMetaTrackingHeaderLabel}>Your Folders</Text>
                <TouchableOpacity 
                  onPress={() => setShowCreateFolder(true)}
                  style={styles.inlineIconLabelActionButtonTouchTrack}
                >
                  <Plus size={14} color="#0057bd" />
                  <Text style={styles.inlineIconLabelActionButtonText}>Create New</Text>
                </TouchableOpacity>
              </View>

              {showCreateFolder && (
                <View style={styles.inlineEditorGlassCardPanel}>
                  <TextInput 
                    autoFocus
                    placeholder="Folder Name"
                    placeholderTextColor="rgba(15,23,42,0.3)"
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    style={styles.inlineEditorTextInputFieldNative}
                    onSubmitEditing={handleCreateFolderLocal}
                  />
                  <View style={styles.inlineEditorActionRowButtonsFlex}>
                    <TouchableOpacity onPress={() => setShowCreateFolder(false)} style={styles.inlineEditorSecondaryActionBtn}>
                      <Text style={styles.inlineEditorSecondaryActionBtnLabel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCreateFolderLocal} style={styles.inlineEditorPrimaryActionBtn}>
                      <Text style={styles.inlineEditorPrimaryActionBtnLabel}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.groupedOptionsCardPanelContainer}>
                {folders.map(folder => (
                  <View key={folder.id} style={styles.folderRowItemContainerFrame}>
                    <View style={styles.settingItemContentLeft}>
                      <View style={[styles.settingItemIconSquareFrame, { backgroundColor: 'rgba(0, 87, 189, 0.06)' }]}>
                        <Folder size={20} color="#0057bd" />
                      </View>
                      <View>
                        <Text style={styles.settingItemLabelTypography}>{folder.name}</Text>
                        <Text style={styles.settingItemSubtextTypography}>{folder.chatIds.length} chats</Text>
                      </View>
                    </View>
                    <View style={styles.inlineRowTrailingActionsTrack}>
                      <TouchableOpacity 
                        onPress={() => deleteFolder?.(folder.id)}
                        style={styles.rowDestructiveTrashIconButtonTrigger}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                      <ChevronRight size={18} color="#94a3b8" />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        );
      case 'appearance':
        return (
          <Animated.View 
            entering={FadeIn.duration(250)} 
            exiting={FadeOut.duration(200)} 
            style={styles.subviewAbsoluteOverlayDeckContainer}
          >
            <SubViewHeader title="Appearance" />
            <ScrollView 
              contentContainerStyle={[styles.subviewScrollStackContent, { paddingBottom: insets.bottom + 40 }]}
              showsVerticalScrollIndicator={false}
            >
              <VisualPreferences />
              
              <View style={styles.sectionGroupVerticalSpacingGap}>
                <Text style={styles.sectionCapsMetaTrackingHeaderLabel}>Theme Engine</Text>
                <View style={[styles.groupedOptionsCardPanelContainer, { padding: 20, gap: 20 }]}>
                  
                  {/* Accent Color Palettes Selection Row */}
                  <View style={styles.editorComplexFieldColumnBlock}>
                    <Text style={styles.editorComplexFieldLabelText}>Accent Color</Text>
                    <View style={styles.colorPaletteGridFlexTrack}>
                      {['#0891b2', '#059669', '#7c3aed', '#db2777', '#ea580c', '#f59e0b', '#10b981'].map(color => (
                        <TouchableOpacity 
                          key={color}
                          onPress={() => setTheme?.((prev: any) => ({ ...prev, accentColor: color }))}
                          style={[
                            styles.paletteColorCircularNodeItem, 
                            { backgroundColor: color },
                            theme?.accentColor === color && styles.paletteColorCircularNodeItemActiveBorder
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Bubble Style Choices Switchboard Row */}
                  <View style={styles.editorComplexFieldColumnBlock}>
                    <Text style={styles.editorComplexFieldLabelText}>Bubble Style</Text>
                    <View style={styles.segmentedTabsInteractiveGridTrack}>
                      {(['rounded', 'sharp', 'glass'] as const).map(style => (
                        <TouchableOpacity 
                          key={style}
                          onPress={() => setTheme?.((prev: any) => ({ ...prev, bubbleStyle: style }))}
                          style={[
                            styles.segmentedTabSingleLinkButtonShape,
                            theme?.bubbleStyle === style ? styles.segmentedTabSingleLinkButtonShapeActive : styles.segmentedTabSingleLinkButtonShapeInactive
                          ]}
                        >
                          <Text style={[
                            styles.segmentedTabSingleLinkLabelTypography,
                            theme?.bubbleStyle === style ? styles.segmentedTabSingleLinkLabelTypographyActive : styles.segmentedTabSingleLinkLabelTypographyInactive
                          ]}>
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Font Scaling Dynamic Slider Parameter Component */}
                  <View style={styles.editorComplexFieldColumnBlock}>
                    <View style={styles.editorSliderMetaHeaderRow}>
                      <Text style={styles.editorComplexFieldLabelText}>Font Scaling</Text>
                      <Text style={styles.editorSliderValueLabelInlineTypography}>{theme?.fontSize || 16}px</Text>
                    </View>
                    <Slider
                      minimumValue={12}
                      maximumValue={24}
                      step={1}
                      value={theme?.fontSize || 16}
                      onValueChange={(val: number) => setTheme?.((prev: any) => ({ ...prev, fontSize: val }))}
                      minimumTrackTintColor="#0057bd"
                      maximumTrackTintColor="#cbd5e1"
                      thumbTintColor="#0057bd"
                      style={styles.crossPlatformNativeSliderElement}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        );
      case 'wallet':
        return (
          <Animated.View 
            entering={FadeIn.duration(250)} 
            exiting={FadeOut.duration(200)} 
            style={styles.subviewAbsoluteOverlayDeckContainer}
          >
            <SubViewHeader title="Wallet" />
            <ScrollView 
              contentContainerStyle={[styles.subviewScrollStackContent, { paddingBottom: insets.bottom + 40 }]}
              showsVerticalScrollIndicator={false}
            >
              {/* Asymmetrical Floating Gradient Wallet Value Card */}
              <View style={styles.walletHeroGradientAsymmetricalDeckCard}>
                <Text style={styles.walletHeroCardCapsSubtitleLabel}>Total Balance</Text>
                <Text style={styles.walletHeroCardBalanceValueIntegerText}>$12,450.00</Text>
                <View style={styles.walletHeroCardActionRowButtonsTrack}>
                  <TouchableOpacity style={styles.walletHeroCardTranslucentPillBtn} activeOpacity={0.8}>
                    <Text style={styles.walletHeroCardTranslucentPillBtnLabel}>Add Funds</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.walletHeroCardTranslucentPillBtn} activeOpacity={0.8}>
                    <Text style={styles.walletHeroCardTranslucentPillBtnLabel}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionGroupVerticalSpacingGap}>
                <Text style={styles.sectionCapsMetaTrackingHeaderLabel}>Payment Methods</Text>
                <View style={styles.groupedOptionsCardPanelContainer}>
                  <View style={styles.walletPaymentMethodRowItemContainerFrame}>
                    <View style={styles.settingItemContentLeft}>
                      <View style={[styles.settingItemIconSquareFrame, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
                        <CreditCard size={20} color="#3b82f6" />
                      </View>
                      <View>
                        <Text style={styles.settingItemLabelTypography}>Visa •••• 4242</Text>
                        <Text style={styles.settingItemSubtextTypography}>Expires 12/25</Text>
                      </View>
                    </View>
                    <Text style={styles.walletPrimaryBadgeMetaLabelText}>Primary</Text>
                  </View>
                  
                  <TouchableOpacity style={styles.walletPanelAddAccountTouchButtonLink} activeOpacity={0.7}>
                    <Plus size={18} color="#0057bd" />
                    <Text style={styles.walletPanelAddAccountTouchButtonLinkLabelText}>Add Bank Account or Card</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        );
      case 'storage':
        return (
          <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={styles.subviewAbsoluteOverlayDeckContainer}>
            <SubViewHeader title="Data and Storage" />
            <ScrollView contentContainerStyle={[styles.subviewScrollStackContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
              <StorageSettings />
              <View style={styles.sectionGroupVerticalSpacingGap}>
                <Text style={styles.sectionCapsMetaTrackingHeaderLabel}>Export</Text>
                <View style={styles.groupedOptionsCardPanelContainer}>
                  <TouchableOpacity onPress={handleExportAll} style={styles.settingItemRowTouch} activeOpacity={0.7}>
                    <View style={styles.settingItemContentLeft}>
                      <View style={[styles.settingItemIconSquareFrame, { backgroundColor: 'rgba(0,87,189,0.06)' }]}>
                        <Download size={20} color="#0057bd" />
                      </View>
                      <View style={styles.settingItemTextColumn}>
                        <Text style={styles.settingItemLabelTypography}>Export all chats as ZIP</Text>
                        <Text style={styles.settingItemSubtextTypography}>Download a backup of all conversations</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        );
      case 'security':
        return (
          <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={styles.subviewAbsoluteOverlayDeckContainer}>
            <SubViewHeader title="Security" />
            <ScrollView contentContainerStyle={[styles.subviewScrollStackContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
              <SecuritySettings />
            </ScrollView>
          </Animated.View>
        );
      case 'notifications':
        return (
          <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={styles.subviewAbsoluteOverlayDeckContainer}>
            <SubViewHeader title="Notifications" />
            <ScrollView contentContainerStyle={[styles.subviewScrollStackContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
              <NotificationsSettings />
            </ScrollView>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.viewportBaseFrame}>
      <Animated.View 
        entering={FadeIn} 
        exiting={FadeOut} 
        style={styles.viewportBaseFrame}
      >
        {/* Sticky Base Header Layout */}
        <View style={[styles.stickyHeaderPanel, { paddingTop: insets.top, height: 64 + insets.top }]}>
          <View style={styles.headerContentWrapper}>
            <TouchableOpacity 
              onPress={onBack} 
              style={styles.headerIconButtonCircularTrigger}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.headerTitleTypographyHeadline}>Settings</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.mainScrollStackContainer, { paddingBottom: insets.bottom + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* User Card Dashboard Banner Frame */}
          <View style={styles.userIdentitySummaryDeckBannerCard}>
            <View style={styles.userAvatarCircularGlowBorderCard}>
              <Image source={{ uri: currentUser.avatar }} style={styles.userCardAvatarNativeImg} />
            </View>
            <View style={styles.userCardMetadataTextContentColumn}>
              <Text style={styles.userCardDisplayNameTextLabel} numberOfLines={1}>{currentUser.name}</Text>
              <Text style={styles.userCardEmailTextLabel} numberOfLines={1}>{currentUser.email}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => onNavigate?.('edit-profile')}
              style={styles.userCardManageButtonStadiumShape}
              activeOpacity={0.8}
            >
              <Text style={styles.userCardManageButtonLabelText}>Manage</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Operations Settings Selection Lists Block */}
          <View style={styles.sectionGroupVerticalSpacingGap}>
            <View style={styles.groupedOptionsCardPanelContainer}>
              <SettingItem icon={Palette} label="Appearance" subtext="Theme, accent color, bubble style" onClick={() => setSubView('appearance')} color="#7c3aed" />
              <SettingItem icon={Folder} label="Chat Folders" subtext="Organize your chats into folders" onClick={() => setSubView('folders')} color="#3b82f6" />
              <SettingItem icon={Wallet} label="Wallet" subtext="Balance, payments, cards" onClick={() => setSubView('wallet')} color="#10b981" />
              <SettingItem icon={Bell} label="Notifications" subtext="Sound, badges, alerts" onClick={() => setSubView('notifications')} color="#eab308" />
              <SettingItem icon={Shield} label="Security" subtext="Privacy, two-step verification" onClick={() => setSubView('security')} color="#6366f1" />
            </View>

            <View style={styles.groupedOptionsCardPanelContainer}>
              <SettingItem icon={Download} label="Data and Storage" subtext="Export chats, storage usage" onClick={() => setSubView('storage')} color="#f97316" />
              <TouchableOpacity onPress={handleExportAll} style={styles.settingItemRowTouch} activeOpacity={0.7}>
                <View style={styles.settingItemContentLeft}>
                  <View style={[styles.settingItemIconSquareFrame, { backgroundColor: 'rgba(0,87,189,0.06)' }]}>
                    <Download size={20} color="#0057bd" />
                  </View>
                  <View style={styles.settingItemTextColumn}>
                    <Text style={styles.settingItemLabelTypography}>Export all chats as ZIP</Text>
                    <Text style={styles.settingItemSubtextTypography}>Download a backup of all conversations</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Systematic Destruction Exit Flow Trigger Action Link Button */}
            <TouchableOpacity 
              onPress={() => setShowLogoutConfirm(true)}
              style={styles.systemLogoutDestructiveActionButtonCard}
              activeOpacity={0.8}
            >
              <LogOut size={20} color="#ef4444" />
              <Text style={styles.systemLogoutDestructiveActionButtonCardLabel}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Conditionally Rendered Subview Absolute Slider Stack Modules */}
      {subView !== null && renderSubView()}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out of Aqualyn? You will need to verify your identity to log back in."
        confirmText="Log Out"
        isDestructive={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewportBaseFrame: { flex: 1, backgroundColor: '#ffffff' },
  stickyHeaderPanel: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderBottomWidth: 1, borderColor: 'rgba(15, 23, 42, 0.05)', justifyContent: 'flex-end', zIndex: 50 },
  headerContentWrapper: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerIconButtonCircularTrigger: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  headerTitleTypographyHeadline: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  mainScrollStackContainer: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },

  // Profile Presentation Banner Frame Configurations Styles
  userIdentitySummaryDeckBannerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: 'rgba(15,23,42,0.04)', marginBottom: 24, position: 'relative', overflow: 'hidden' },
  userAvatarCircularGlowBorderCard: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: '#ffffff', backgroundColor: '#e2e8f0' },
  userCardAvatarNativeImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  userCardMetadataTextContentColumn: { flex: 1, marginLeft: 14, marginRight: 8, gap: 2 },
  userCardDisplayNameTextLabel: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
  userCardEmailTextLabel: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  userCardManageButtonStadiumShape: { height: 34, paddingHorizontal: 16, borderRadius: 17, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  userCardManageButtonLabelText: { fontSize: 13, fontWeight: '600', color: '#0057bd' },

  // Generic Settings Items Rows Groupings Elements Blocks Template Panels
  sectionGroupVerticalSpacingGap: { gap: 16 },
  groupedOptionsCardPanelContainer: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(15,23,42,0.05)', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 }, android: { elevation: 1 } }) },
  settingItemRowTouch: { width: '100%', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  settingItemContentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingItemIconSquareFrame: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingItemTextColumn: { marginLeft: 14, flex: 1, gap: 2 },
  settingItemLabelTypography: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  settingItemSubtextTypography: { fontSize: 12, color: '#64748b', fontWeight: '500' },

  systemLogoutDestructiveActionButtonCard: { width: '100%', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)', backgroundColor: 'rgba(239,68,68,0.02)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  systemLogoutDestructiveActionButtonCardLabel: { fontSize: 15, fontWeight: '700', color: '#ef4444' },

  // Dynamic Subviews Nested Overlays Stacking Structural Design Layouts
  subviewAbsoluteOverlayDeckContainer: { ...StyleSheet.absoluteFill, backgroundColor: '#ffffff', zIndex: 100 },
  subviewStickyHeader: { width: '100%', backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderColor: 'rgba(15,23,42,0.05)', justifyContent: 'flex-end' },
  subviewHeaderInnerFlexRow: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  subviewHeaderTitleTypographyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.4 },
  subviewScrollStackContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },

  sectionHeaderMetaRowBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 12 },
  sectionCapsMetaTrackingHeaderLabel: { fontSize: 12, fontWeight: '700', color: '#0057bd', textTransform: 'uppercase', letterSpacing: 0.8 },
  inlineIconLabelActionButtonTouchTrack: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineIconLabelActionButtonText: { fontSize: 13, fontWeight: '700', color: '#0057bd' },

  // Inner Dynamic Custom Folders Builder Elements Editor Blocks
  inlineEditorGlassCardPanel: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,87,189,0.15)', backgroundColor: '#f8fafc', marginBottom: 16, gap: 12 },
  inlineEditorTextInputFieldNative: { width: '100%', height: 44, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 14, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  inlineEditorActionRowButtonsFlex: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  inlineEditorSecondaryActionBtn: { height: 36, justifyContent: 'center', paddingHorizontal: 12 },
  inlineEditorSecondaryActionBtnLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  inlineEditorPrimaryActionBtn: { height: 36, backgroundColor: '#0f172a', borderRadius: 8, justifyContent: 'center', paddingHorizontal: 16 },
  inlineEditorPrimaryActionBtnLabel: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  folderRowItemContainerFrame: { width: '100%', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  inlineRowTrailingActionsTrack: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowDestructiveTrashIconButtonTrigger: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.04)', justifyContent: 'center', alignItems: 'center' },

  // Asymmetrical Color / Interactive Sliders Properties Settings Styles Space
  editorComplexFieldColumnBlock: { gap: 10, width: '100%' },
  editorComplexFieldLabelText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  colorPaletteGridFlexTrack: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paletteColorCircularNodeItem: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent' },
  paletteColorCircularNodeItemActiveBorder: { borderColor: '#0f172a', transform: [{ scale: 1.08 }] },

  segmentedTabsInteractiveGridTrack: { flexDirection: 'row', gap: 8, backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  segmentedTabSingleLinkButtonShape: { flex: 1, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  segmentedTabSingleLinkButtonShapeActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  segmentedTabSingleLinkButtonShapeInactive: { backgroundColor: 'transparent' },
  segmentedTabSingleLinkLabelTypography: { fontSize: 13, fontWeight: '700' },
  segmentedTabSingleLinkLabelTypographyActive: { color: '#0f172a' },
  segmentedTabSingleLinkLabelTypographyInactive: { color: '#64748b' },

  editorSliderMetaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editorSliderValueLabelInlineTypography: { fontSize: 13, fontWeight: '700', color: '#0057bd' },
  crossPlatformNativeSliderElement: { width: '100%', height: 40 },

  // Translucent Floating Wallet UI Properties Config Blocks
  walletHeroGradientAsymmetricalDeckCard: { width: '100%', padding: 24, borderRadius: 32, backgroundColor: '#0057bd', shadowColor: '#0057bd', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4, marginBottom: 24, gap: 4 },
  walletHeroCardCapsSubtitleLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 },
  walletHeroCardBalanceValueIntegerText: { fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5, marginBottom: 12 },
  walletHeroCardActionRowButtonsTrack: { flexDirection: 'row', gap: 10, width: '100%' },
  walletHeroCardTranslucentPillBtn: { flex: 1, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  walletHeroCardTranslucentPillBtnLabel: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  walletPaymentMethodRowItemContainerFrame: { width: '100%', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  walletPrimaryBadgeMetaLabelText: { fontSize: 12, fontWeight: '700', color: '#0057bd' },
  walletPanelAddAccountTouchButtonLink: { width: '100%', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletPanelAddAccountTouchButtonLinkLabelText: { fontSize: 14, fontWeight: '700', color: '#0057bd' }
});