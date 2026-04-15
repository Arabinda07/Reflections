import React from 'react';
import { ErrorState } from '../components/ui/ErrorState';

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <ErrorState 
        title="this path doesn't exist yet."
        message="it's hiding in the quiet space between thoughts. let's head back."
      />
    </div>
  );
};
