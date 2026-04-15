import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, ShoppingCart, BarChart3, MessageSquare, DollarSign, Settings, Send, Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { title: "Inventory", url: "/dashboard/farmer", icon: Package },
  { title: "Orders", url: "/dashboard/farmer/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/dashboard/farmer/analytics", icon: BarChart3 },
  { title: "Earnings", url: "/dashboard/farmer/earnings", icon: DollarSign },
  { title: "Messages", url: "/dashboard/farmer/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function FarmerMessages() {
  return <MessagesPage navItems={navItems} title="Farmer Dashboard" />;
}

export function MessagesPage({ navItems, title }: { navItems: { title: string; url: string; icon: React.ElementType }[]; title: string }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          setMessages(prev => [...prev, msg]);
          fetchConversations();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const msgs = data || [];
    const userIds = new Set<string>();
    msgs.forEach(m => {
      if (m.sender_id !== user.id) userIds.add(m.sender_id);
      if (m.receiver_id !== user.id) userIds.add(m.receiver_id);
    });

    if (userIds.size > 0) {
      const { data: profs } = await supabase.from("profiles").select("*").in("user_id", Array.from(userIds));
      const map: Record<string, any> = {};
      (profs || []).forEach(p => { map[p.user_id] = p; });
      setProfiles(prev => ({ ...prev, ...map }));
    }

    const convMap: Record<string, any> = {};
    msgs.forEach(m => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!convMap[otherId]) convMap[otherId] = { userId: otherId, lastMessage: m, unread: 0 };
      if (m.receiver_id === user.id && !m.is_read) convMap[otherId].unread++;
    });

    setConversations(Object.values(convMap));
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    if (!user) return;
    setLoadingUsers(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const roleMap: Record<string, string> = {};
    (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

    const users = (profs || [])
      .filter(p => p.user_id !== user.id)
      .map(p => ({ ...p, role: roleMap[p.user_id] || "user" }));

    setAllUsers(users);
    const map: Record<string, any> = {};
    users.forEach(p => { map[p.user_id] = p; });
    setProfiles(prev => ({ ...prev, ...map }));
    setLoadingUsers(false);
  };

  const startNewConversation = (userId: string) => {
    setSelectedUser(userId);
    setShowNewChat(false);
    setUserSearch("");
    setMessages([]);
    // Check if there's an existing conversation
    selectConversationById(userId);
  };

  const selectConversationById = async (userId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);

    await supabase.from("messages").update({ is_read: true })
      .eq("sender_id", userId).eq("receiver_id", user.id).eq("is_read", false);
    fetchConversations();
  };

  const selectConversation = async (conv: any) => {
    setSelectedUser(conv.userId);
    setShowNewChat(false);
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conv.userId}),and(sender_id.eq.${conv.userId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);

    await supabase.from("messages").update({ is_read: true })
      .eq("sender_id", conv.userId).eq("receiver_id", user.id).eq("is_read", false);
    fetchConversations();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !user || !selectedUser) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      content: newMsg.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setNewMsg("");
  };

  const filteredUsers = allUsers.filter(u =>
    !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const ROLE_COLORS: Record<string, string> = {
    farmer: "bg-emerald/10 text-emerald",
    buyer: "bg-blue-100 text-blue-600",
    distributor: "bg-purple-100 text-purple-600",
    admin: "bg-amber-100 text-amber-700",
  };

  if (loading) return <DashboardLayout navItems={navItems} title={title}><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title={title}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-foreground">Messages</h2>
          <button onClick={() => { setShowNewChat(true); fetchAllUsers(); }}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>

        {/* New Chat User Picker */}
        {showNewChat && (
          <div className="bg-card border border-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Start a new conversation</p>
              <button onClick={() => setShowNewChat(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or role..."
                className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
            </div>
            {loadingUsers ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredUsers.map(u => (
                  <button key={u.user_id} onClick={() => startNewConversation(u.user_id)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">{u.full_name || "User"}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || "bg-muted text-muted-foreground"}`}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[400px]">
          {/* Conversation List */}
          <div className="w-72 bg-card border border-border rounded-xl overflow-hidden flex-shrink-0">
            <div className="p-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">Conversations</p>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No conversations yet. Click "New Message" to start one!</p>
              ) : conversations.map(conv => {
                const profile = profiles[conv.userId];
                return (
                  <button key={conv.userId} onClick={() => selectConversation(conv)}
                    className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors ${selectedUser === conv.userId ? "bg-muted" : ""}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "User"}</p>
                      {conv.unread > 0 && (
                        <span className="min-w-[20px] h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">{conv.unread}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage.content}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
                <p>Select a conversation or start a new one</p>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{profiles[selectedUser]?.full_name || "User"}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">No messages yet. Say hello! 👋</div>
                  )}
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                        m.sender_id === user?.id
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <p>{m.content}</p>
                        <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message…"
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                  <button type="submit" disabled={sending || !newMsg.trim()}
                    className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
