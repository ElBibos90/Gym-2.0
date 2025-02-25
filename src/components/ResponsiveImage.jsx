import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

const ResponsiveImage = ({ src, alt, maxWidth = 'max-w-lg', maxHeight = 'max-h-96' }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">Immagine non disponibile</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${maxWidth} mx-auto overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full ${maxHeight} object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default ResponsiveImage;