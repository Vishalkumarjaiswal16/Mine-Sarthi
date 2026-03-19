import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  avatar?: string;
  lastLogin?: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@mine.com',
    name: 'Admin User',
    role: 'admin',
    avatar: 'AU',
    lastLogin: new Date(),
  },
  {
    id: '2',
    email: 'operator@mine.com',
    name: 'John Operator',
    role: 'operator',
    avatar: 'JO',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '3',
    email: 'viewer@mine.com',
    name: 'Sarah Viewer',
    role: 'viewer',
    avatar: 'SV',
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

// Role-based permissions
const rolePermissions = {
  admin: [
    'read:all',
    'write:all',
    'delete:all',
    'manage:users',
    'manage:settings',
    'export:data',
    'view:reports',
    'edit:reports',
  ],
  operator: [
    'read:dashboard',
    'read:equipment',
    'write:maintenance',
    'view:reports',
    'export:data',
  ],
  viewer: [
    'read:dashboard',
    'read:equipment',
    'view:reports',
  ],
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Context Provider
 * 
 * Provides authentication state and methods throughout the application.
 * Handles user login, logout, and role-based permissions.
 * 
 * @param {ReactNode} children - Child components that need auth context
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // In a real app, validate token with backend
          setUser(parsedUser);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Auth check failed:', errorMessage);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);

    // Mock authentication - in real app, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    const foundUser = mockUsers.find(u => u.email === email);

    if (!foundUser) {
      setIsLoading(false);
      throw new Error('Invalid credentials');
    }

    // Mock password validation (in real app, this would be handled by backend)
    if (password !== 'password123') {
      setIsLoading(false);
      throw new Error('Invalid credentials');
    }

    // Generate mock JWT token
    const token = `mock_jwt_${foundUser.id}_${Date.now()}`;

    // Store auth data
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(foundUser));

    setUser(foundUser);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return rolePermissions[user.role].includes(permission);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
