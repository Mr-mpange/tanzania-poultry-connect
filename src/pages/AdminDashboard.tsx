import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, Users, ShoppingCart, Truck, TrendingUp, Package, Loader2, CheckCircle, XCircle, Pencil, Trash2, ShieldCheck, ShieldX, X } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

const navItems = [
  { title: "Overview", url: "/dashboard/admin", icon: BarChart3 },
  { title: "Users", url: "/dashboard/admin/users", icon: Users },
  { title: "Orders", url: "/dashboard/admin/orders", icon: ShoppingCart },
];

function StatCard({ label, value, icon: Icon, color, trend }: { label: string; value: string | number; icon: React.ElementType; color: string; trend?: string }) {
  return (
    <div className="bg-card rounded-xl p-5 shadow-card border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
          {trend && <p className="text-xs text-emerald mt-1">{trend}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

const CHART_COLORS = ["hsl(160,50%,45%)", "hsl(220,60%,50%)", "hsl(40,90%,55%)", "hsl(280,60%,55%)", "hsl(0,70%,55%)"];

function EditUserModal({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [location, setLocation] = useState(user.location || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone, location }).eq("user_id", user.user_id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("User updated");
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-elevated" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-semibold text-foreground">Edit User</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" required
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone"
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location"
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
          <button type="submit" disabled={saving}
            className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, farmers: 0, buyers: 0, distributors: 0, orders: 0, totalRevenue: 0, deliveries: 0, inventory: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);

  const isUsersPage = window.location.pathname.includes("/users");
  const isOrdersPage = window.location.pathname.includes("/orders") && window.location.pathname.includes("/admin");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: profiles }, { data: roles }, { data: allOrders }, { data: inv }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("inventory").select("*"),
    ]);

    const rolesList = roles || [];
    setStats({
      users: (profiles || []).length,
      farmers: rolesList.filter(r => r.role === "farmer").length,
      buyers: rolesList.filter(r => r.role === "buyer").length,
      distributors: rolesList.filter(r => r.role === "distributor").length,
      orders: (allOrders || []).length,
      totalRevenue: (allOrders || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0),
      deliveries: (allOrders || []).filter((o: any) => o.status === "delivered").length,
      inventory: (inv || []).length,
    });

    const usersWithRoles = (profiles || []).map(p => ({
      ...p,
      role: rolesList.find(r => r.user_id === p.user_id)?.role || "unknown",
    }));
    setUsers(usersWithRoles);
    setOrders(allOrders || []);
    setInventory(inv || []);
    setLoading(false);
  };

  const handleApprove = async (userId: string, approve: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_approved: approve }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "User approved" : "User rejected");
    fetchAll();
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success("User deleted");
    fetchAll();
  };

  // --- Chart Data ---
  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const m = new Date(o.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
      map[m] = (map[m] || 0) + (o.total_amount || 0);
    });
    return Object.entries(map).slice(-6).map(([month, revenue]) => ({ month, revenue }));
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [orders]);

  const topFarmers = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.farmer_id] = (map[o.farmer_id] || 0) + (o.total_amount || 0); });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, revenue], i) => {
        const profile = users.find(u => u.user_id === id);
        return { name: profile?.full_name || `Farmer ${i + 1}`, revenue };
      });
  }, [orders, users]);

  const supplyChain = useMemo(() => {
    const categories: Record<string, number> = {};
    inventory.forEach(item => { categories[item.category] = (categories[item.category] || 0) + item.quantity; });
    return Object.entries(categories).map(([name, qty]) => ({ name, qty }));
  }, [inventory]);

  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
      ) : isUsersPage ? (
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-foreground">All Users ({users.length})</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium text-foreground">{u.full_name || "—"}</td>
                      <td className="p-3"><span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full capitalize">{u.role}</span></td>
                      <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                      <td className="p-3 text-muted-foreground">{u.location || "—"}</td>
                      <td className="p-3">
                        {u.is_approved ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {!u.is_approved ? (
                            <button onClick={() => handleApprove(u.user_id, true)} title="Approve"
                              className="p-1.5 rounded-lg hover:bg-secondary/10 transition-colors">
                              <ShieldCheck className="w-4 h-4 text-secondary" />
                            </button>
                          ) : (
                            <button onClick={() => handleApprove(u.user_id, false)} title="Deactivate"
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                              <ShieldX className="w-4 h-4 text-destructive" />
                            </button>
                          )}
                          <button onClick={() => setEditingUser(u)} title="Edit"
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(u.user_id, u.full_name)} title="Delete"
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={fetchAll} />}
        </div>
      ) : isOrdersPage ? (
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-foreground">All Orders ({orders.length})</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Order #</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium text-foreground">{o.order_number}</td>
                      <td className="p-3 text-foreground">TZS {o.total_amount.toLocaleString()}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        o.status === "delivered" ? "bg-secondary/10 text-secondary" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-700"
                      }`}>{o.status.replace("_", " ")}</span></td>
                      <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.users} icon={Users} color="bg-blue-100 text-blue-600" />
            <StatCard label="Total Orders" value={stats.orders} icon={ShoppingCart} color="bg-secondary/10 text-secondary" />
            <StatCard label="Revenue" value={`TZS ${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-amber-100 text-amber-600" />
            <StatCard label="Products Listed" value={stats.inventory} icon={Package} color="bg-purple-100 text-purple-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Farmers" value={stats.farmers} icon={Package} color="bg-secondary/10 text-secondary" />
            <StatCard label="Buyers" value={stats.buyers} icon={ShoppingCart} color="bg-blue-100 text-blue-600" />
            <StatCard label="Distributors" value={stats.distributors} icon={Truck} color="bg-amber-100 text-amber-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Revenue Trends</h3>
              {revenueByMonth.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No revenue data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220,15%,46%)" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(220,15%,46%)" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`TZS ${v.toLocaleString()}`, "Revenue"]}
                      contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,90%)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(160,50%,45%)" strokeWidth={2.5} dot={{ fill: "hsl(160,50%,45%)", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Order Status</h3>
              {ordersByStatus.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No orders yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={11}>
                      {ordersByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,90%)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Top Farmers</h3>
              {topFarmers.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No farmer data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topFarmers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(220,15%,46%)" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(220,15%,46%)" }} width={100} />
                    <Tooltip formatter={(v: number) => [`TZS ${v.toLocaleString()}`, "Revenue"]}
                      contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,90%)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="hsl(220,60%,50%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Supply Chain Flow</h3>
              {supplyChain.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No inventory data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={supplyChain}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(220,15%,46%)" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(220,15%,46%)" }} />
                    <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,90%)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="qty" fill="hsl(160,50%,45%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Recent Orders</h3>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">TZS {o.total_amount.toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                        o.status === "delivered" ? "bg-secondary/10 text-secondary" : "bg-amber-100 text-amber-700"
                      }`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
