import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, ShoppingCart, TrendingUp, Egg, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { title: "Inventory", url: "/dashboard/farmer", icon: Package },
  { title: "Orders", url: "/dashboard/farmer/orders", icon: ShoppingCart },
];

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card rounded-xl p-5 shadow-card border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    product_name: "", category: "chicken" as "chicken" | "eggs" | "meat" | "other", quantity: 0, unit: "pieces",
    price_per_unit: 0, description: "", location: "", health_status: "healthy",
    vaccination_status: "", weight_kg: 0,
  });

  const fetchData = async () => {
    if (!user) return;
    const [{ data: inv }, { data: ord }] = await Promise.all([
      supabase.from("inventory").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setInventory(inv || []);
    setOrders(ord || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const data = { ...form, farmer_id: user.id, is_available: form.quantity > 0 };
    try {
      if (editItem) {
        await supabase.from("inventory").update(data).eq("id", editItem.id);
        toast.success("Item updated");
      } else {
        await supabase.from("inventory").insert(data as any);
        toast.success("Item added");
      }
      setShowForm(false);
      setEditItem(null);
      setForm({ product_name: "", category: "chicken", quantity: 0, unit: "pieces", price_per_unit: 0, description: "", location: "", health_status: "healthy", vaccination_status: "", weight_kg: 0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("inventory").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      product_name: item.product_name, category: item.category, quantity: item.quantity,
      unit: item.unit, price_per_unit: item.price_per_unit, description: item.description || "",
      location: item.location || "", health_status: item.health_status || "healthy",
      vaccination_status: item.vaccination_status || "", weight_kg: item.weight_kg || 0,
    });
    setShowForm(true);
  };

  const totalStock = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.price_per_unit, 0);

  return (
    <DashboardLayout navItems={navItems} title="Farmer Dashboard">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Products" value={inventory.length} icon={Package} color="bg-emerald/10 text-emerald" />
            <KPICard label="Total Stock" value={totalStock.toLocaleString()} icon={Egg} color="bg-blue-100 text-blue-600" />
            <KPICard label="Inventory Value" value={`TZS ${totalValue.toLocaleString()}`} icon={TrendingUp} color="bg-amber-100 text-amber-600" />
            <KPICard label="Pending Orders" value={orders.filter(o => o.status === "pending").length} icon={ShoppingCart} color="bg-purple-100 text-purple-600" />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-foreground">My Inventory</h2>
            <button onClick={() => { setEditItem(null); setShowForm(true); setForm({ product_name: "", category: "chicken", quantity: 0, unit: "pieces", price_per_unit: 0, description: "", location: "", health_status: "healthy", vaccination_status: "", weight_kg: 0 }); }}
              className="flex items-center gap-2 bg-emerald text-accent-foreground px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-light transition-colors">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-card border border-border rounded-xl p-6 shadow-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-semibold">{editItem ? "Edit Product" : "Add Product"}</h3>
                  <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input placeholder="Product Name" value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} required
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as "chicken" | "eggs" | "meat" | "other" }))}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none">
                    <option value="chicken">Chicken</option><option value="eggs">Eggs</option><option value="meat">Meat</option><option value="other">Other</option>
                  </select>
                  <input type="number" placeholder="Quantity" value={form.quantity || ""} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} required
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                  <input placeholder="Unit (pieces, kg, trays)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                  <input type="number" placeholder="Price per unit (TZS)" value={form.price_per_unit || ""} onChange={e => setForm(f => ({ ...f, price_per_unit: +e.target.value }))} required
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                  <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                  <input placeholder="Health Status" value={form.health_status} onChange={e => setForm(f => ({ ...f, health_status: e.target.value }))}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                  <input placeholder="Vaccination Status" value={form.vaccination_status} onChange={e => setForm(f => ({ ...f, vaccination_status: e.target.value }))}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                  <input type="number" step="0.1" placeholder="Weight (kg)" value={form.weight_kg || ""} onChange={e => setForm(f => ({ ...f, weight_kg: +e.target.value }))}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                  <div className="md:col-span-2 lg:col-span-3">
                    <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none resize-none" />
                  </div>
                  <button type="submit" className="bg-emerald text-accent-foreground px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-light transition-colors">
                    {editItem ? "Update" : "Save"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Qty</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">No inventory items yet. Add your first product!</td></tr>
                  ) : inventory.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium text-foreground">{item.product_name}</td>
                      <td className="p-3"><span className="bg-emerald/10 text-emerald text-xs px-2 py-0.5 rounded-full capitalize">{item.category}</span></td>
                      <td className="p-3 text-foreground">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-foreground">TZS {item.price_per_unit.toLocaleString()}</td>
                      <td className="p-3 text-muted-foreground">{item.location || "-"}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_available ? "bg-emerald/10 text-emerald" : "bg-destructive/10 text-destructive"}`}>
                          {item.is_available ? "Available" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {orders.length > 0 && (
            <>
              <h2 className="font-display font-semibold text-lg text-foreground">Recent Orders</h2>
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
                        <tr key={o.id} className="border-b border-border">
                          <td className="p-3 font-medium text-foreground">{o.order_number}</td>
                          <td className="p-3 text-foreground">TZS {o.total_amount.toLocaleString()}</td>
                          <td className="p-3"><span className="text-xs bg-emerald/10 text-emerald px-2 py-0.5 rounded-full capitalize">{o.status}</span></td>
                          <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
