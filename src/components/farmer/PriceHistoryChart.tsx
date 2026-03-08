import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

const COLORS = [
  "hsl(var(--secondary))",
  "hsl(var(--primary))",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
];

interface PriceHistoryChartProps {
  inventoryItems: { id: string; product_name: string }[];
}

export default function PriceHistoryChart({ inventoryItems }: PriceHistoryChartProps) {
  const { user } = useAuth();
  const [priceData, setPriceData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || inventoryItems.length === 0) return;
    const fetchPriceHistory = async () => {
      const ids = inventoryItems.map(i => i.id);
      const { data } = await supabase
        .from("price_history" as any)
        .select("*")
        .eq("farmer_id", user.id)
        .in("inventory_id", ids)
        .order("recorded_at", { ascending: true })
        .limit(500);
      setPriceData((data as any[]) || []);
      setLoading(false);
    };
    fetchPriceHistory();
  }, [user, inventoryItems]);

  if (loading || priceData.length === 0) return null;

  // Build chart data grouped by date
  const productMap = new Map(inventoryItems.map(i => [i.id, i.product_name]));
  const filteredData = selectedProduct === "all"
    ? priceData
    : priceData.filter((d: any) => d.inventory_id === selectedProduct);

  // Get unique products in filtered data
  const activeProductIds = [...new Set(filteredData.map((d: any) => d.inventory_id))];

  // Group by date, pivoting products as columns
  const dateMap = new Map<string, Record<string, number>>();
  filteredData.forEach((d: any) => {
    const date = new Date(d.recorded_at).toLocaleDateString();
    if (!dateMap.has(date)) dateMap.set(date, { date } as any);
    const entry = dateMap.get(date)!;
    entry[d.inventory_id] = d.price;
  });
  const chartData = Array.from(dateMap.values());

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-secondary" /> Price History
        </h2>
        <select
          value={selectedProduct}
          onChange={e => setSelectedProduct(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="all">All Products</option>
          {inventoryItems.map(item => (
            <option key={item.id} value={item.id}>{item.product_name}</option>
          ))}
        </select>
      </div>

      {chartData.length < 2 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Not enough price data yet. Update product prices to start tracking trends.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={v => `${v.toLocaleString()}`} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number, name: string) => [`TZS ${value.toLocaleString()}`, productMap.get(name) || name]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            {activeProductIds.length > 1 && (
              <Legend formatter={(value: string) => productMap.get(value) || value} />
            )}
            {activeProductIds.map((pid, i) => (
              <Line
                key={pid}
                type="monotone"
                dataKey={pid}
                name={pid}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
