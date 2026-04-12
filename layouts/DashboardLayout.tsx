import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Search, Sparkles, User, Settings, LogOut, Loader2, FileText, X, LogIn } from 'lucide-react';
import { RoutePath, Note } from '../types';
import { noteService } from '../services/noteService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { StorageImage } from '../components/ui/StorageImage';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green/30 selection:text-green-hover">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[64px] bg-white/80 border-b-2 border-border z-50 flex justify-center liquid-glass">
        <div className="w-full max-w-[1440px] px-4 md:px-10 flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate(RoutePath.HOME)}
            >
              <div className="h-10 w-10 rounded-xl bg-green flex items-center justify-center text-white shadow-3d-green group-hover:scale-110 transition-transform">
                <Sparkles size={24} fill="currentColor" />
              </div>
              <span className="font-display text-[24px] text-green lowercase tracking-tight">
                mindful notes
              </span>
            </div>
          </div>

          {/* Right Side - Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {[
              { label: 'My Notes', path: RoutePath.NOTES },
              { label: 'Create Note', path: RoutePath.CREATE_NOTE },
              { label: 'Account', path: RoutePath.ACCOUNT },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.5px] text-gray-nav hover:text-green hover:bg-green/5 rounded-xl transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
            <div className="w-[1px] h-[24px] bg-border mx-2"></div>
            {isAuthenticated ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                className="text-red hover:bg-red/5"
              >
                LOGOUT
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(RoutePath.LOGIN)}
                >
                  SIGN IN
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate(RoutePath.SIGNUP)}
                >
                  SIGN UP
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Icon (Simplified) */}
          <div className="md:hidden">
            <Menu className="text-gray-nav" size={24} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-[64px] w-full max-w-[1440px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
};