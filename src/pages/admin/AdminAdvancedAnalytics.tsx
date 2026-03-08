import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, Users, ShoppingCart, FileText, Sliders, TrendingUp, Settings, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const navItems = [
  { title: "Overview", url: "/dashboard/admin", icon: BarChart3 },
  { title: "Users", url: "/dashboard/admin/users", icon: Users },
  { title: "Orders", url: "/dashboard/admin/orders", icon: ShoppingCart },
  { title: "Reports", url: "/dashboard/admin/reports", icon: FileText },
  { title: "Analytics", url: "/dashboard/admin/analytics", icon: TrendingUp },
  { title: "Platform", url: "/dashboard/admin/platform", icon: Sliders },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const COLORS = ["hsl(160,50%,45%)", "hsl(220,60%,50%)", "hsl(40,90%,55%)", "hsl(280,60%,55%)", "hsl(0,70%,55%)"];

export default function AdminAdvancedAnalytics() {
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase.from("inventory").select("*"),
    ]).then(([{ data: o }, { data: p }, { data: r }, { data: i }]) => {
      setOrders(o || []);
      setProfiles(p || []);
      setRoles(r || []);
      setInventory(i || []);
      setLoading(false);
    });
  }, []);

  const filteredOrders = useMemo(() => {
    if (period === "all") return orders;
    const now = new Date();
    const cutoff = new Date();
    if (period === "7d") cutoff.setDate(now.getDate() - 7);
    if (period === "30d") cutoff.setDate(now.getDate() - 30);
    if (period === "90d") cutoff.setDate(now.getDate() - 90);
    return orders.filter(o => new Date(o.created_at) >= cutoff);
  }, [orders, period]);

  const dailyOrders = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const d = new Date(o.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).slice(-14).map(([date, count]) => ({ date, count }));
  }, [filteredOrders]);

  const roleDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    roles.forEach(r => { map[r.role] = (map[r.role] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [roles]);

  const revenueByCategory = useMemo(() => {
    const invMap: Record<string, string> = {};
    inventory.forEach(i => { invMap[i.id] = i.category; });
    const catRevenue: Record<string, number> = {};
    filteredOrders.forEach(o => { catRevenue["orders"] = (catRevenue["orders"] || 0) + (o.total_amount || 0); });
    return Object.entries(catRevenue).map(([name, revenue]) => ({ name, revenue }));
  }, [filteredOrders, inventory]);

  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const avgOrderValue = filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length) : 0;
  const conversionRate = profiles.length > 0 ? ((filteredOrders.length / profiles.length) * 100).toFixed(1) : "0";

  if (loading) return <DashboardLayout navItems={navItems} title="Admin Dashboard"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-foreground">Advanced Analytics</h2>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">TZS {totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{filteredOrders.length}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">TZS {avgOrderValue.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Order/User Ratio</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{conversionRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Daily Order Volume</h3>
            {dailyOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No order data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(160,50%,45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">User Role Distribution</h3>
            {roleDistribution.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No user data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
