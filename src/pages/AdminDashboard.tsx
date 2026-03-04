import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, Users, ShoppingCart, Truck, TrendingUp, Package, Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, farmers: 0, buyers: 0, distributors: 0, orders: 0, totalRevenue: 0, deliveries: 0, inventory: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Combine profiles with roles
    const usersWithRoles = (profiles || []).map(p => ({
      ...p,
      role: rolesList.find(r => r.user_id === p.user_id)?.role || "unknown",
    }));
    setUsers(usersWithRoles);
    setOrders(allOrders || []);
    setLoading(false);
  };

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
                    <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Approved</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium text-foreground">{u.full_name || "—"}</td>
                      <td className="p-3"><span className="text-xs bg-emerald/10 text-emerald px-2 py-0.5 rounded-full capitalize">{u.role}</span></td>
                      <td className="p-3 text-muted-foreground">{u.location || "—"}</td>
                      <td className="p-3">{u.is_approved ? <CheckCircle className="w-4 h-4 text-emerald" /> : <XCircle className="w-4 h-4 text-destructive" />}</td>
                      <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                        o.status === "delivered" ? "bg-emerald/10 text-emerald" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-700"
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
            <StatCard label="Total Orders" value={stats.orders} icon={ShoppingCart} color="bg-emerald/10 text-emerald" />
            <StatCard label="Revenue" value={`TZS ${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-amber-100 text-amber-600" />
            <StatCard label="Products Listed" value={stats.inventory} icon={Package} color="bg-purple-100 text-purple-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Farmers" value={stats.farmers} icon={Package} color="bg-emerald/10 text-emerald" />
            <StatCard label="Buyers" value={stats.buyers} icon={ShoppingCart} color="bg-blue-100 text-blue-600" />
            <StatCard label="Distributors" value={stats.distributors} icon={Truck} color="bg-amber-100 text-amber-600" />
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
                        o.status === "delivered" ? "bg-emerald/10 text-emerald" : "bg-amber-100 text-amber-700"
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
