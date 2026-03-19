import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  reportId?: string;
  widgetId?: string;
}

interface CollaborationContextType {
  currentUser: User;
  activeUsers: User[];
  comments: Comment[];
  addComment: (content: string, reportId?: string, widgetId?: string) => void;
  updateUserStatus: (status: User['status']) => void;
  isRealTimeEnabled: boolean;
  toggleRealTime: () => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

interface CollaborationProviderProps {
  children: ReactNode;
}

/**
 * Collaboration Context Provider
 * 
 * Manages real-time collaboration features including:
 * - Active user presence
 * - Comments and annotations
 * - Real-time updates
 * 
 * @param {ReactNode} children - Child components that need collaboration context
 */
export const CollaborationProvider = ({ children }: CollaborationProviderProps) => {
  const [currentUser] = useState<User>({
    id: 'user-1',
    name: 'You',
    status: 'online',
  });

  const [activeUsers, setActiveUsers] = useState<User[]>([
    {
      id: 'user-2',
      name: 'Sarah Johnson',
      avatar: 'SJ',
      status: 'online',
    },
    {
      id: 'user-3',
      name: 'Mike Chen',
      avatar: 'MC',
      status: 'online',
    },
    {
      id: 'user-4',
      name: 'Emma Davis',
      avatar: 'ED',
      status: 'away',
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
  ]);

  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'comment-1',
      userId: 'user-2',
      content: 'The energy efficiency metrics look great! We should add this to the weekly report.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      reportId: '1',
    },
    {
      id: 'comment-2',
      userId: 'user-3',
      content: 'I noticed the vibration levels are trending up. Should we investigate?',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      reportId: '2',
    },
  ]);

  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return undefined;

    const interval = setInterval(() => {
      // Simulate user status changes
      setActiveUsers(prev => prev.map(user => ({
        ...user,
        status: Math.random() > 0.8 ? (user.status === 'online' ? 'away' : 'online') as User['status'] : user.status,
        lastSeen: user.status === 'away' ? new Date() : user.lastSeen,
      })));

      // Simulate new comments occasionally
      if (Math.random() > 0.95) {
        const newComment: Comment = {
          id: `comment-${Date.now()}`,
          userId: activeUsers[Math.floor(Math.random() * activeUsers.length)].id,
          content: [
            'Great work on this report!',
            'The data visualization could be improved.',
            'We should add more KPIs to track.',
            'This metric is showing concerning trends.',
            'Excellent analysis of the efficiency data.',
          ][Math.floor(Math.random() * 5)],
          timestamp: new Date(),
          reportId: Math.random() > 0.5 ? '1' : '2',
        };
        setComments(prev => [...prev, newComment]);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, activeUsers]);

  const addComment = (content: string, reportId?: string, widgetId?: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      content,
      timestamp: new Date(),
      reportId,
      widgetId,
    };
    setComments(prev => [...prev, newComment]);
  };

  const updateUserStatus = (status: User['status']) => {
    // In a real app, this would sync with the server
    console.log('User status updated:', status);
  };

  const toggleRealTime = () => {
    setIsRealTimeEnabled(prev => !prev);
  };

  return (
    <CollaborationContext.Provider
      value={{
        currentUser,
        activeUsers,
        comments,
        addComment,
        updateUserStatus,
        isRealTimeEnabled,
        toggleRealTime,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};
