import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { UserPlus, User, Phone, Check, ArrowLeft } from 'lucide-react-native';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  addContact: (name: string, phone: string, id: string, avatar: string) => void;
}

export default function AddContactModal({ isOpen, onClose, addContact }: AddContactModalProps) {
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleAddContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      addContact(
        newContactName, 
        newContactPhone, 
        `local_${Date.now()}`, 
        `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(newContactName)}`
      );
      setNewContactName('');
      setNewContactPhone('');
      onClose();
    }
  };

  const isFormValid = newContactName.trim().length > 0 && newContactPhone.trim().length > 0;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalViewportContainer}
      >
        {/* Backdrop Tint */}
        <Animated.View   style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.backdropLayerDismiss} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Slidable Container Sheet */}
        <Animated.View 
          
          
          style={styles.bottomSheetWrapperBody}
        >
          {/* Header Action Bar */}
          <View style={styles.headerToolbarFrame}>
            <View style={styles.headerContentLeftPart}>
              <TouchableOpacity onPress={onClose} style={styles.backActionButtonCircle}>
                <ArrowLeft size={24} color="#0f172a" />
              </TouchableOpacity>
              <h2 style={styles.toolbarPrimaryTitleText}>New Contact</h2>
            </View>
          </View>

          {/* Form Area Wrapper */}
          <View style={styles.formContainerContentArea}>
            <View style={styles.avatarCircularFramePlaceholder}>
              <UserPlus size={36} color="#6366f1" />
            </View>

            <View style={styles.formInputsLayoutGroupStack}>
              {/* Name Input Row */}
              <View style={styles.inputInteractiveFieldWrapperLine}>
                <User size={22} color="rgba(15, 23, 42, 0.4)" style={styles.fieldLeftIconAlignmentPosition} />
                <TextInput
                  placeholder="First name (required)"
                  placeholderTextColor="rgba(15, 23, 42, 0.35)"
                  value={newContactName}
                  onChangeText={setNewContactName}
                  style={styles.textInputFormEngineElement}
                  autoFocus
                />
              </View>

              {/* Phone Number Entry Input Row */}
              <View style={styles.inputInteractiveFieldWrapperLine}>
                <Phone size={22} color="rgba(15, 23, 42, 0.4)" style={styles.fieldLeftIconAlignmentPosition} />
                <View style={styles.phoneNumberLayoutCompositeIntegrationContainer}>
                  <View style={styles.countryCodeStaticLabelBadgeBox}>
                    <Text style={styles.countryCodePlusSymbolMicroText}>+</Text>
                    <Text style={styles.countryCodeNumericLiteralLabelText}>1</Text>
                  </View>
                  <TextInput
                    placeholder="Phone number"
                    placeholderTextColor="rgba(15, 23, 42, 0.35)"
                    keyboardType="phone-pad"
                    value={newContactPhone}
                    onChangeText={(val) => setNewContactPhone(val.replace(/\D/g, ''))}
                    style={styles.textInputPhoneFieldInlineEngine}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Floating Save Action Button Layer */}
          <View style={styles.bottomFabAnchorFrameBoundaryBox}>
            {isFormValid && (
              <Animated.View  >
                <TouchableOpacity 
                  onPress={handleAddContact} 
                  style={styles.floatingActionStickyCircularButtonCircle}
                >
                  <Check size={26} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalViewportContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropLayerDismiss: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheetWrapperBody: {
    width: '100%',
    height: '85%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  headerToolbarFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  headerContentLeftPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backActionButtonCircle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  toolbarPrimaryTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  formContainerContentArea: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  avatarCircularFramePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    marginBottom: 36,
  },
  formInputsLayoutGroupStack: {
    width: '100%',
    gap: 24,
  },
  inputInteractiveFieldWrapperLine: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  fieldLeftIconAlignmentPosition: {
    position: 'absolute',
    left: 4,
    zIndex: 5,
  },
  textInputFormEngineElement: {
    height: 56,
    borderBottomWidth: 2,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    paddingLeft: 44,
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '500',
  },
  phoneNumberLayoutCompositeIntegrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    width: '100%',
  },
  countryCodeStaticLabelBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 44,
    paddingRight: 12,
    height: 56,
    borderRightWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    gap: 1,
  },
  countryCodePlusSymbolMicroText: {
    fontSize: 17,
    color: '#64748b',
    fontWeight: '500',
  },
  countryCodeNumericLiteralLabelText: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '600',
  },
  textInputPhoneFieldInlineEngine: {
    flex: 1,
    height: 56,
    paddingLeft: 16,
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '500',
  },
  bottomFabAnchorFrameBoundaryBox: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    height: 56,
    width: 56,
  },
  floatingActionStickyCircularButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});