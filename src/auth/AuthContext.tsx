import React, { createContext, useContext } from 'react';
import type { AuthAdapter } from './AuthAdapter';
import { getAuthAdapter } from './AuthRuntime';

/** React context that holds the AuthAdapter instance. */
const AuthContext = createContext<AuthAdapter>(getAuthAdapter());

/** Provider exposes the shared auth adapter; Zustand owns UI auth state. */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthContext.Provider value={getAuthAdapter()}>{children}</AuthContext.Provider>;
};

/** Hook to consume the AuthAdapter anywhere in the app. */
export const useAuth = (): AuthAdapter => useContext(AuthContext);
