
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Photo {
  src: string;
  alt: string;
}

interface PhotoCarouselProps {
  photos: Photo[];
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photos }) => {
  const [index, setIndex] = useState(0);

  const nextPhoto = () => setIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-lg gold-border">
      <AnimatePresence>
        <motion.img
          key={index}
          src={photos[index].src}
          alt={photos[index].alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>
      <Button onClick={prevPhoto} variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white">
        <ChevronLeft />
      </Button>
      <Button onClick={nextPhoto} variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white">
        <ChevronRight />
      </Button>
    </div>
  );
};

export default PhotoCarousel;
