import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center z-50">
      <div className="text-center">
        {/* SAR Logo */}
        <div className="mb-8">
          <img 
            src="/sar-logo.png" 
            alt="SAR Ambalaj" 
            className="w-24 h-24 mx-auto rounded-full shadow-lg bg-white p-2"
          />
        </div>
        
        {/* App Title */}
        <h1 className="text-3xl font-bold text-white mb-2">SAR Sistem</h1>
        <p className="text-indigo-200 mb-8">İmalat Yönetim Platformu</p>
        
        {/* Loading Spinner */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-white mt-4 text-sm">Yükleniyor...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;