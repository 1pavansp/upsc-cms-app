import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 
          className={`${sizeClasses[size]} animate-spin text-blue-600`} 
        />
        {text && (
          <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-300`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;

