import React from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Mock = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <style>{`
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.1;
        }
        .angled-section {
          clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%);
        }
        .angled-section-reverse {
          clip-path: polygon(0 10%, 100% 0, 100% 100%, 0 100%);
        }
        .angled-button {
          clip-path: polygon(0 0, 100% 0, 100% 80%, 90% 100%, 0 100%);
        }
        .angled-card {
          clip-path: polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%);
        }
        .glow {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }
        .text-glow {
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-screen angled-section bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 noise-bg"></div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-white rounded-full filter blur-[150px]"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-8xl md:text-[12rem] font-black mb-8 text-white tracking-tighter text-glow"
              >
                FORMS
              </motion.h1>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-4xl md:text-6xl font-light mb-8 text-white/80 tracking-widest"
              >
                REIMAGINED
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-xl text-white/60 mb-12 max-w-xl font-light tracking-wider"
              >
                Create intelligent, AI-powered forms in seconds. Let our advanced technology handle the heavy lifting.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-6"
              >
                <Button className="group relative px-12 py-6 text-lg font-bold bg-white text-black hover:bg-white/90 transition-all duration-300 angled-button glow">
                  <span className="relative z-10">GET STARTED</span>
                </Button>
                <Button className="group relative px-12 py-6 text-lg font-bold border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 angled-button glow">
                  <span className="relative z-10">WATCH DEMO</span>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full filter blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full filter blur-3xl"></div>
              <div className="relative bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10 glow">
                <div className="space-y-4">
                  <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                  <div className="h-2 w-1/2 bg-white/20 rounded"></div>
                  <div className="h-2 w-2/3 bg-white/20 rounded"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Mock;
