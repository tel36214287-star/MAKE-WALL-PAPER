
import React from 'react';
import { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  onClick: (image: GeneratedImage) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onClick }) => {
  return (
    <div
      className="relative group cursor-pointer aspect-[9/16] overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-800"
      onClick={() => onClick(image)}
    >
      <img
        src={image.url}
        alt={image.prompt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <p className="text-white text-sm truncate font-medium">{image.prompt}</p>
      </div>
    </div>
  );
};

export default ImageCard;
    