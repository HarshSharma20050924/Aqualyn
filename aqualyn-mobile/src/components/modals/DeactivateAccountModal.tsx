import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AlertTriangle, Trash2, X, Phone, ArrowRight, ShieldAlert } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';

interface DeactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Native Selection Dropdown Simulation Component ---
const REASONS = [
  { label: 'Select a reason', value: '' },
  { label: 'I am changing my device', value: 'changing_device' },
  { label: 'I am changing my phone number', value: 'changing_number' },
  { label: 'I am deleting my account temporarily', value: 'temporary' },
  { label: 'Aqualyn is missing a feature', value: 'missing_feature' },
  { label: 'Aqualyn is not working', value: 'not_working' },
  { label: 'Other', value: 'other' }
];

export default function DeactivateAccountModal({ isOpen, onClose }: DeactivateAccountModalProps) {
  const { addToast } = useAppContext();
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reason, setReason] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (phoneNumber.length < 10) {
        addToast('Please enter a valid phone number to confirm', 'error');
        return;
      }
      setStep(3);
    }
  };

  const handleDelete = () => {
    addToast('Account deactivated successfully', 'success');
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(1);
    setPhoneNumber('');
    setReason('');
    setShowDropdown(false);
    onClose();
  };

  const selectedReasonLabel = REASONS.find(r => r.value === reason)?.label || 'Select a reason';

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={resetAndClose}>
      <View style={styles.modalViewportCenteredAnchor}>
        
        {/* Backdrop Mask Blur Mask Overlay */}
        <Animated.View   style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.fullScreenBackdropDismissClick} activeOpacity={1} onPress={resetAndClose} />
        </Animated.View>

        {/* Core Dialog Card Container Canvas */}
        <View style={styles.dialogStructureBodyWrapperCard}>
          {/* Header Action Menu Frame */}
          <View style={styles.dialogHeaderToolbarFlexRow}>
            <View style={styles.headerLabelLeftIntegratedFrameBox}>
              <ShieldAlert size={20} color="#ef4444" />
              <Text style={styles.toolbarPrimaryTitleTypographyText}>Deactivate Account</Text>
            </View>
            <TouchableOpacity onPress={resetAndClose} style={styles.dismissHeaderCircularButton}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Dynamic Render Workflow Steps Canvas */}
          <ScrollView style={styles.scrollableContentFormContainerArea} bounces={false}>
            
            {/* STEP 1: GENERAL WARNINGS & SURVEY META DATA COLLECTION */}
            {step === 1 && (
              <View style={styles.stepContainerLayoutVerticalBlock}>
                <View style={styles.warningMessageBannerLayoutContainerBox}>
                  <AlertTriangle size={24} color="#ef4444" style={styles.warningGraphicIconPositioner} />
                  <View style={styles.warningBannerTextStackFlexibleColumn}>
                    <Text style={styles.warningBannerHeadingTitleText}>Warning</Text>
                    <Text style={styles.warningBannerParagraphBodyTypography}>
                      Deactivating your account will permanently delete your account info, profile photo, all your groups, and your message history on this device.
                    </Text>
                  </View>
                </View>

                <View style={styles.customPickerGroupFormStructuralCell}>
                  <Text style={styles.formInputLabelHeaderCapsText}>Why are you leaving? (Optional)</Text>
                  
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => setShowDropdown(!showDropdown)} 
                    style={styles.customPickerInteractiveSelectorTriggerBox}
                  >
                    <Text style={[styles.customPickerSelectionDisplayTypographyLabel, !reason && styles.pickerInactiveStatePlaceholderTint]}>
                      {selectedReasonLabel}
                    </Text>
                  </TouchableOpacity>

                  {showDropdown && (
                    <View style={styles.customPickerDropdownPoppedOverlayContainerBox}>
                      {REASONS.map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          style={styles.customPickerDropdownItemInteractiveRowCell}
                          onPress={() => {
                            setReason(item.value);
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={[styles.customPickerDropdownRowItemLabelText, reason === item.value && styles.activeSelectedDropdownRowItemTextHighlight]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {!showDropdown && (
                  <TouchableOpacity onPress={handleNext} style={styles.actionCtaButtonLayoutRowPrimarySubmitButton}>
                    <Text style={styles.actionCtaButtonLabelTypographyTextFont}>Continue</Text>
                    <ArrowRight size={16} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* STEP 2: VERIFICATION META NUMBER CHALLENGE SCREEN */}
            {step === 2 && (
              <View style={styles.stepContainerLayoutVerticalBlock}>
                <View style={styles.stepVerificationContentIdentityHeaderBlock}>
                  <View style={styles.verificationGraphicIconCircularBackgroundFrame}>
                    <Phone size={28} color="#ef4444" />
                  </View>
                  <Text style={styles.verificationIdentityHeaderPrimaryHeading}>Confirm your number</Text>
                  <Text style={styles.verificationIdentityHeaderSubtitleParagraphText}>
                    To delete your account, confirm your country code and enter your phone number.
                  </Text>
                </View>

                <View style={styles.phoneFormInputFieldsMultiColumnRowContainer}>
                  <View style={styles.phoneFormLeftFieldsColumnHalf}>
                    <Text style={styles.miniFormFieldLabelMicroTextCaps}>Country</Text>
                    <TextInput value="India" editable={false} style={styles.textInputFormElementDisabledStateField} />
                  </View>
                  <View style={styles.phoneFormRightFieldsColumnHalf}>
                    <Text style={styles.miniFormFieldLabelMicroTextCaps}>Code</Text>
                    <TextInput value="+91" editable={false} style={styles.textInputFormElementDisabledStateField} />
                  </View>
                </View>

                <View style={styles.standaloneFieldWrapperLayoutContainerBlock}>
                  <Text style={styles.miniFormFieldLabelMicroTextCaps}>Phone Number</Text>
                  <TextInput
                    placeholder="Enter your phone number"
                    placeholderTextColor="rgba(15, 23, 42, 0.35)"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={(val) => setPhoneNumber(val.replace(/\D/g, ''))}
                    style={styles.textInputInteractiveEntryFormEngineField}
                    autoFocus
                  />
                </View>

                <View style={styles.formFooterTwinActionButtonsArrayRow}>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.twinFooterSecondaryActionCancelButton}>
                    <Text style={styles.twinFooterSecondaryActionButtonLabelTypography}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleNext}
                    disabled={phoneNumber.length < 10}
                    style={[styles.twinFooterPrimaryActionSubmitButton, phoneNumber.length < 10 && styles.ctaActionDisabledStateOpacityPill]}
                  >
                    <Text style={styles.twinFooterPrimaryActionButtonLabelTextFont}>Deactivate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: ULTIMATE DESTRUCTION FINAL WARNING ENVELOPE */}
            {step === 3 && (
              <View style={styles.stepDestructionLayoutCenteredContainerBox}>
                <View style={styles.destructionAlertIconDoubleBorderRingCircularFrame}>
                  <Trash2 size={36} color="#ef4444" />
                </View>
                <Text style={styles.destructionHeadingPrimaryTitleTypography}>Final Confirmation</Text>
                <Text style={styles.destructionParagraphBodyParagraphTextExplanation}>
                  Are you absolutely sure you want to delete your account? This action <Text style={styles.destructionEmphasizedRedAlertBoldLabelText}>cannot be undone</Text>.
                </Text>

                <View style={styles.destructionActionsVerticalStackLayoutGroup}>
                  <TouchableOpacity onPress={handleDelete} style={styles.ultimateDestructionExecuteCtaActionButton}>
                    <Text style={styles.ultimateDestructionExecuteButtonTypographyTextLabel}>Yes, Delete My Account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={resetAndClose} style={styles.ultimateDestructionBailoutCancelActionButton}>
                    <Text style={styles.ultimateDestructionBailoutButtonLabelTypographyText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalViewportCenteredAnchor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenBackdropDismissClick: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dialogStructureBodyWrapperCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dialogHeaderToolbarFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  headerLabelLeftIntegratedFrameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarPrimaryTitleTypographyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  dismissHeaderCircularButton: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  scrollableContentFormContainerArea: {
    padding: 20,
  },
  stepContainerLayoutVerticalBlock: {
    gap: 20,
  },
  warningMessageBannerLayoutContainerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
  },
  warningGraphicIconPositioner: {
    marginTop: 2,
  },
  warningBannerTextStackFlexibleColumn: {
    flex: 1,
  },
  warningBannerHeadingTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b91c1c',
    marginBottom: 4,
  },
  warningBannerParagraphBodyTypography: {
    fontSize: 13,
    color: '#ef4444',
    lineHeight: 18,
    fontWeight: '500',
  },
  customPickerGroupFormStructuralCell: {
    gap: 8,
  },
  formInputLabelHeaderCapsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  customPickerInteractiveSelectorTriggerBox: {
    height: 52,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  customPickerSelectionDisplayTypographyLabel: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  pickerInactiveStatePlaceholderTint: {
    color: 'rgba(15, 23, 42, 0.4)',
  },
  customPickerDropdownPoppedOverlayContainerBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
    marginTop: 4,
  },
  customPickerDropdownItemInteractiveRowCell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
  },
  customPickerDropdownRowItemLabelText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  activeSelectedDropdownRowItemTextHighlight: {
    color: '#ef4444',
    fontWeight: '700',
  },
  actionCtaButtonLayoutRowPrimarySubmitButton: {
    height: 52,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionCtaButtonLabelTypographyTextFont: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepVerificationContentIdentityHeaderBlock: {
    alignItems: 'center',
    gap: 8,
  },
  verificationGraphicIconCircularBackgroundFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationIdentityHeaderPrimaryHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  verificationIdentityHeaderSubtitleParagraphText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  phoneFormInputFieldsMultiColumnRowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  phoneFormLeftFieldsColumnHalf: {
    width: '35%',
    gap: 4,
  },
  phoneFormRightFieldsColumnHalf: {
    flex: 1,
    gap: 4,
  },
  miniFormFieldLabelMicroTextCaps: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  textInputFormElementDisabledStateField: {
    height: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  standaloneFieldWrapperLayoutContainerBlock: {
    gap: 4,
  },
  textInputInteractiveEntryFormEngineField: {
    height: 52,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  formFooterTwinActionButtonsArrayRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  twinFooterSecondaryActionCancelButton: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twinFooterSecondaryActionButtonLabelTypography: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  twinFooterPrimaryActionSubmitButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twinFooterPrimaryActionButtonLabelTextFont: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  ctaActionDisabledStateOpacityPill: {
    opacity: 0.4,
  },
  stepDestructionLayoutCenteredContainerBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  destructionAlertIconDoubleBorderRingCircularFrame: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(239, 68, 68, 0.04)',
    marginBottom: 16,
  },
  destructionHeadingPrimaryTitleTypography: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  destructionParagraphBodyParagraphTextExplanation: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  destructionEmphasizedRedAlertBoldLabelText: {
    color: '#ef4444',
    fontWeight: '800',
  },
  destructionActionsVerticalStackLayoutGroup: {
    width: '100%',
    gap: 10,
    marginTop: 28,
  },
  ultimateDestructionExecuteCtaActionButton: {
    height: 54,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ultimateDestructionExecuteButtonTypographyTextLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  ultimateDestructionBailoutCancelActionButton: {
    height: 54,
    backgroundColor: 'transparent',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ultimateDestructionBailoutButtonLabelTypographyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
});