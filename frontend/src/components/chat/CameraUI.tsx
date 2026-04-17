import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera as CameraIcon, Video, RefreshCcw, Zap, ZapOff, Check, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface CameraUIProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (mediaUrl: string, type: 'photo' | 'video') => void;
}

export default function CameraUI({ isOpen, onClose, onCapture }: CameraUIProps) {
  const { addToast } = useAppContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ url: string, type: 'photo' | 'video' } | null>(null);

  useEffect(() => {
    if (isOpen && !capturedMedia) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode, capturedMedia]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: mode === 'video'
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      addToast("Could not access camera", "error");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (mode === 'photo') {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setCapturedMedia({ url: dataUrl, type: 'photo' });
        }
      }
    } else {
      // Mock video recording for now
      if (isRecording) {
        setIsRecording(false);
        setCapturedMedia({ url: 'mock-video-url', type: 'video' });
      } else {
        setIsRecording(true);
      }
    }
  };

  const handleSend = () => {
    if (capturedMedia) {
      onCapture(capturedMedia.url, capturedMedia.type);
      setCapturedMedia(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedMedia(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          {/* Top Controls */}
          <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
            <button onClick={onClose} className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors">
              <X className="w-6 h-6" />
            </button>
            {!capturedMedia && (
              <button onClick={() => setFlash(!flash)} className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors">
                {flash ? <Zap className="w-6 h-6 text-yellow-400" /> : <ZapOff className="w-6 h-6" />}
              </button>
            )}
          </div>

          {/* Viewfinder / Preview */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {capturedMedia ? (
              capturedMedia.type === 'photo' ? (
                <img src={capturedMedia.url} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  Video Preview (Mock)
                </div>
              )
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            )}
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col items-center gap-6 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-12">
            
            {!capturedMedia && (
              <div className="flex gap-6 mb-4">
                <button 
                  onClick={() => setMode('photo')}
                  className={`text-sm font-bold uppercase tracking-widest transition-colors ${mode === 'photo' ? 'text-secondary' : 'text-white/50'}`}
                >
                  Photo
                </button>
                <button 
                  onClick={() => setMode('video')}
                  className={`text-sm font-bold uppercase tracking-widest transition-colors ${mode === 'video' ? 'text-secondary' : 'text-white/50'}`}
                >
                  Video
                </button>
              </div>
            )}

            <div className="flex justify-between items-center w-full max-w-xs">
              {capturedMedia ? (
                <>
                  <button onClick={handleRetake} className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button onClick={handleSend} className="p-5 rounded-full bg-secondary text-white shadow-lg shadow-secondary/30 hover:scale-105 transition-transform">
                    <Check className="w-8 h-8" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12" /> {/* Spacer */}
                  <button 
                    onClick={handleCapture}
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                      mode === 'video' ? 'border-red-500' : 'border-white'
                    }`}
                  >
                    <div className={`rounded-full transition-all ${
                      mode === 'video' 
                        ? (isRecording ? 'w-8 h-8 bg-red-500 rounded-md' : 'w-16 h-16 bg-red-500')
                        : 'w-16 h-16 bg-white'
                    }`} />
                  </button>
                  <button onClick={toggleCamera} className="p-3 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors">
                    <RefreshCcw className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
