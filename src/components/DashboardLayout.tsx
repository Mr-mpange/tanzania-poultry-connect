import { ReactNode, useState, useRef, useEffect } from "react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar
} from "@/components/ui/sidebar";
import { Leaf, LogOut, User, Bell, Sun, Moon } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}

function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-elevated z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-display font-semibold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-secondary hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">No notifications yet</p>
            ) : (
              notifications.slice(0, 20).map(n => (
                <button key={n.id} onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? "bg-secondary/5" : ""}`}>
                  <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                  {n.detail && <p className="text-xs text-muted-foreground">{n.detail}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{n.timestamp.toLocaleTimeString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="p-2 rounded-lg hover:bg-muted transition-colors mr-1" title="Toggle theme">
      {theme === "dark" ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
}

function AppSidebar({ navItems, title }: { navItems: NavItem[]; title: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-secondary-foreground" />
          </div>
          {!collapsed && <span className="font-display font-bold text-sidebar-foreground text-sm">{title}</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <RouterNavLink to={item.url} end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                        }`
                      }>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 space-y-2">
          {!collapsed && profile && (
            <div className="text-xs text-sidebar-foreground/50 truncate">
              <User className="w-3 h-3 inline mr-1" />
              {profile.full_name || "User"}
            </div>
          )}
          <button onClick={async () => { await signOut(); navigate("/"); }}
            className="flex items-center gap-2 text-xs text-sidebar-foreground/50 hover:text-destructive transition-colors w-full">
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar navItems={navItems} title={title} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <h1 className="font-display font-semibold text-foreground text-lg flex-1">{title}</h1>
            <ThemeToggle />
            <NotificationBell />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
