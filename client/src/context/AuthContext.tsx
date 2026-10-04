import * as React from 'react';
import { api, setAuthToken, getAuthToken } from '../lib/api';

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const checkSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res?.user) {
          setUser(res.user);
        } else {
          setAuthToken(null);
        }
      } catch {
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (username: string, pass: string) => {
    try {
      const res = await api.login(username, pass);
      if (res?.token) {
        setAuthToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    try {
      await api.changePassword(oldPass, newPass);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to change password' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
