import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Volume2, VolumeX, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { usePWAInstall } from '../../context/PWAInstallContext';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();


  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#121212] selection:bg-green/30 selection:text-green-hover transition-colors duration-300">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-16 sm:py-20 md:py-32">
        {/* Hero Text At Top */}
        <div className="text-center max-w-4xl mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 border-2 border-green/20 text-green text-[12px] font-black mb-8 animate-in slide-in-from-bottom-4 duration-500">
            <Sparkles size={14} />
            <span>The future of journaling</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-display text-gray-text leading-tight md:leading-[1.1] mb-8 tracking-tighter animate-in slide-in-from-bottom-6 duration-700 drop-shadow-sm hover:scale-[1.02] transition-transform">
            Your mind, <br />
            <span className="bg-gradient-to-r from-green via-blue to-green bg-clip-text text-transparent animate-gradient-x drop-shadow-md">beautifully</span> <br />
            organized.
          </h1>
        </div>

        {/* Video Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full max-w-6xl mb-16 flex flex-col items-center"
        >
          <p className="text-[14px] font-black text-gray-nav mb-6">Experience the sanctuary</p>
          <div className="relative w-full group">
            {/* Persistent breathing glow that intensifies on hover */}
            <div className="absolute -inset-4 bg-gradient-to-r from-green/30 via-blue/30 to-green/30 rounded-[48px] blur-2xl opacity-50 animate-pulse group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative aspect-video rounded-[24px] sm:rounded-[40px] border-2 border-border bg-white/50 backdrop-blur-xl shadow-sm overflow-hidden liquid-glass p-2 sm:p-4">
              <div className="w-full h-full rounded-[16px] sm:rounded-[32px] overflow-hidden border-2 border-white/20 relative">
                <video 
                  ref={videoRef}
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4"
                  className="w-full h-full object-cover bg-black/5"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                />
                
                {/* Custom Mute Button */}
                <button
                  onClick={toggleMute}
                  className="absolute bottom-4 right-4 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all duration-300 ease-out-quart z-10"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action Below Video */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mb-32 px-4"
        >
          <p className="text-[16px] sm:text-[18px] md:text-[24px] text-gray-light font-medium leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10">
            A sanctuary for your thoughts. AI-powered reflections, mood tracking, and a clean space to breathe.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full sm:w-auto h-16 sm:h-20 px-8 sm:px-12 text-[16px] sm:text-[20px] font-bold rounded-[20px] sm:rounded-[24px] shadow-sm liquid-glass group"
              onClick={() => navigate(RoutePath.SIGNUP)}
            >
              <span>Enter sanctuary</span>
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full sm:w-auto h-16 sm:h-20 px-8 sm:px-12 text-[16px] sm:text-[20px] font-bold rounded-[20px] sm:rounded-[24px] border-2 border-border text-blue shadow-sm liquid-glass"
              onClick={() => navigate(RoutePath.LOGIN)}
            >
              Sign in
            </Button>
          </div>
          


          <div className="mt-8 flex justify-center">
             <Button 
               variant="ghost" 
               size="sm" 
               className="text-[14px] font-bold text-gray-nav hover:text-blue hover:bg-blue/5 border-2 border-transparent hover:border-blue/10 rounded-full px-6 py-3 transition-all duration-300 ease-out-quart flex items-center gap-2"
               onClick={() => navigate(RoutePath.FAQ)}
             >
               <Sparkles size={16} />
               <span>Explore how it works (FAQ)</span>
             </Button>
          </div>

          {/* PWA Install Button — moved below FAQ */}
          {canInstall && !isInstalled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-6 flex flex-col items-center gap-2"
            >
              <button
                onClick={triggerInstall}
                className="flex items-center gap-3 px-6 py-3 rounded-full border-2 border-green/30 bg-green/5 text-green font-black text-[13px] transition-all duration-300 ease-out-quart hover:bg-green/10 hover:border-green/50 active:scale-[0.97]"
              >
                <Download size={16} />
                Install app — free
              </button>
              <p className="text-[11px] font-bold text-gray-nav">
                No app store needed · Works offline
              </p>
            </motion.div>
          )}
        </motion.div>


      </div>
    </div>
  );
};

