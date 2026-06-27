import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-navy-primary"></div>
      <span className="ml-3 text-navy-primary font-bold">Carregando dados...</span>
    </div>
  );
};