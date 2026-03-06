import { createContext, useContext, ReactNode } from "react";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [], unreadCount: 0, markRead: () => {}, markAllRead: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const value = useNotifications();
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
