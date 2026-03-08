import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, ShoppingCart, TrendingUp, BarChart3, MessageSquare, DollarSign, Settings } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const navItems = [
  { title: "Inventory", url: "/dashboard/farmer", icon: Package },
  { title: "Orders", url: "/dashboard/farmer/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/dashboard/farmer/analytics", icon: BarChart3 },
  { title: "Earnings", url: "/dashboard/farmer/earnings", icon: DollarSign },
  { title: "Messages", url: "/dashboard/farmer/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const COLORS = ["hsl(160,50%,45%)", "hsl(220,60%,50%)", "hsl(40,90%,55%)", "hsl(280,60%,55%)"];

export default function FarmerAnalytics() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("orders").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("inventory").select("*").eq("farmer_id", user.id),
    ]).then(([{ data: o }, { data: inv }]) => {
      setOrders(o || []);
      setInventory(inv || []);
      setLoading(false);
    });
  }, [user]);

  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const m = new Date(o.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
      map[m] = (map[m] || 0) + (o.total_amount || 0);
    });
    return Object.entries(map).slice(-6).map(([month, revenue]) => ({ month, revenue }));
  }, [orders]);

  const productPerformance = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach(i => { map[i.product_name] = (map[i.product_name] || 0) + i.quantity; });
    return Object.entries(map).slice(0, 8).map(([name, qty]) => ({ name, qty }));
  }, [inventory]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach(i => { map[i.category] = (map[i.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  if (loading) return <DashboardLayout navItems={navItems} title="Farmer Dashboard"><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Farmer Dashboard">
      <div className="space-y-6">
        <h2 className="font-display font-semibold text-lg text-foreground">Analytics & Reports</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">TZS {totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{totalOrders}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Avg. Order Value</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">TZS {avgOrderValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Revenue Trends</h3>
            {revenueByMonth.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No revenue data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`TZS ${v.toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(160,50%,45%)" strokeWidth={2.5} dot={{ fill: "hsl(160,50%,45%)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Product Categories</h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No products listed.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card lg:col-span-2">
            <h3 className="font-display font-semibold text-foreground mb-4">Product Stock Levels</h3>
            {productPerformance.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No products listed.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={productPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="hsl(220,60%,50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
