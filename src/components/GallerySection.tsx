import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Maximize2, X, Instagram } from 'lucide-react';

interface GallerySectionProps {
  images: string[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ images }) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <section id="gallery" className="relative py-16 sm:py-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-10 sm:mb-14 text-center">
          <h2 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight font-display">
            VISUAL <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">gallery</span>
          </h2>
          <p className="text-white/70 text-sm max-w-lg mx-auto mt-2">
            Les moments capturés et l'identité visuelle de la MALEDIKE PARTY.
          </p>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {images.map((imgUrl, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setActiveImage(imgUrl)}
              className="relative aspect-square sm:aspect-[4/5] rounded-2xl overflow-hidden glass-smoked border border-white/10 group cursor-pointer shadow-lg hover:border-emerald-500/40 transition-all duration-300"
            >
              <img
                src={imgUrl}
                alt={`Visual Gallery ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <div className="p-3 rounded-full bg-black/70 border border-emerald-500/40 text-emerald-400 transform scale-75 group-hover:scale-100 transition-transform">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-w-2xl w-full aspect-square rounded-3xl overflow-hidden glass-smoked border border-white/20 shadow-2xl"
            >
              <img
                src={activeImage}
                alt="Aperçu Grand Format"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 text-white hover:bg-black/90 border border-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
