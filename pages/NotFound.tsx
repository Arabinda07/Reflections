import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { RoutePath } from '../types';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <div className="h-20 w-20 rounded-[28px] bg-blue/5 text-blue mb-8 flex items-center justify-center border border-blue/10 bg-white liquid-glass">
        <Sparkles size={40} className="opacity-50" />
      </div>
      <h1 className="text-4xl font-display text-gray-text lowercase mb-4">this path doesn't exist yet.</h1>
      <p className="max-w-md text-gray-light font-medium mb-10">
        it's hiding in the quiet space between thoughts. let's head back to the sanctuary.
      </p>
      <Button variant="primary" size="lg" onClick={() => navigate(RoutePath.HOME)} className="rounded-2xl border-2 border-border shadow-3d-gray px-8 uppercase font-black">
        <ArrowLeft size={18} className="mr-2" />
        RETURN HOME
      </Button>
    </div>
  );
};
