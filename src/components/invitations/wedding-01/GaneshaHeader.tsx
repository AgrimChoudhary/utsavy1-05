
import React from 'react';
import { cn } from '@/lib/utils';

const GaneshaHeader: React.FC = () => {
  return (
    <div className="relative py-6 px-4 text-center max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
        <img 
          src="/lovable-uploads/30c38585-d39b-49c0-851d-b6c39d4f17de.png" 
          alt="Lord Ganesha" 
          width="160"
          height="160"
          loading="eager"
          fetchPriority="high"
          className="w-32 h-32 md:w-40 md:h-40 object-contain"
        />
        <div className="text-center md:text-left">
          <h3 className="font-cormorant text-xl md:text-2xl text-yellow-300 mb-2">
            ॐ गणेशाय नमः
          </h3>
          <div className="text-yellow-200/80 font-cormorant text-lg md:text-xl italic">
            <p>वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।</p>
            <p>निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaneshaHeader;
