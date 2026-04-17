import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X, Phone, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface DeactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeactivateAccountModal({ isOpen, onClose }: DeactivateAccountModalProps) {
  const { addToast } = useAppContext();
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reason, setReason] = useState('');

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
    // In a real app, this would log the user out and delete their data
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const resetAndClose = () => {
    setStep(1);
    setPhoneNumber('');
    setReason('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Deactivate Account
              </h2>
              <button
                onClick={resetAndClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                    <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-red-700 mb-1">Warning</h3>
                      <p className="text-sm text-red-600/80 leading-relaxed">
                        Deactivating your account will permanently delete your account info, profile photo, all your groups, and your message history on this device.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-on-surface">
                      Why are you leaving? (Optional)
                    </label>
                    <select 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 outline-none focus:border-red-400 transition-colors text-on-surface appearance-none"
                    >
                      <option value="">Select a reason</option>
                      <option value="changing_device">I am changing my device</option>
                      <option value="changing_number">I am changing my phone number</option>
                      <option value="temporary">I am deleting my account temporarily</option>
                      <option value="missing_feature">Aqualyn is missing a feature</option>
                      <option value="not_working">Aqualyn is not working</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="font-bold text-xl text-on-surface">Confirm your number</h3>
                    <p className="text-sm text-on-surface-variant">
                      To delete your account, confirm your country code and enter your phone number.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-1/3">
                        <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1">Country</label>
                        <input 
                          type="text" 
                          value="India" 
                          disabled
                          className="w-full bg-white/30 border border-white/40 rounded-xl px-4 py-3 text-on-surface opacity-70"
                        />
                      </div>
                      <div className="w-2/3">
                        <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1">Code</label>
                        <input 
                          type="text" 
                          value="+91" 
                          disabled
                          className="w-full bg-white/30 border border-white/40 rounded-xl px-4 py-3 text-on-surface opacity-70"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 outline-none focus:border-red-400 transition-colors text-on-surface font-medium tracking-wide"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3.5 bg-white/50 hover:bg-white/70 text-on-surface rounded-xl font-bold transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={phoneNumber.length < 10}
                      className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                    <Trash2 className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="font-bold text-2xl text-on-surface">Final Confirmation</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    Are you absolutely sure you want to delete your account? This action <strong className="text-red-500">cannot be undone</strong>.
                  </p>

                  <div className="pt-6 space-y-3">
                    <button
                      onClick={handleDelete}
                      className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20"
                    >
                      Yes, Delete My Account
                    </button>
                    <button
                      onClick={resetAndClose}
                      className="w-full py-4 bg-transparent hover:bg-white/40 text-on-surface rounded-xl font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
