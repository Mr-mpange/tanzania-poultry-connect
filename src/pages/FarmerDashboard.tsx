import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, ShoppingCart, TrendingUp, Egg, Plus, Pencil, Trash2, X, Loader2, CheckCircle, XCircle, Truck, Settings, BarChart3, DollarSign, MessageSquare, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { title: "Inventory", url: "/dashboard/farmer", icon: Package },
  { title: "Orders", url: "/dashboard/farmer/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/dashboard/farmer/analytics", icon: BarChart3 },
  { title: "Earnings", url: "/dashboard/farmer/earnings", icon: DollarSign },
  { title: "Messages", url: "/dashboard/farmer/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
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

const isOrdersPage = () => window.location.pathname.includes("/orders");

const ORDER_ACTIONS: Record<string, { next: string; label: string; icon: React.ElementType; color: string }> = {
  pending: { next: "confirmed", label: "Confirm", icon: CheckCircle, color: "text-secondary hover:bg-secondary/10" },
  confirmed: { next: "processing", label: "Process", icon: Truck, color: "text-blue-600 hover:bg-blue-50" },
  processing: { next: "picked_up", label: "Ready for Pickup", icon: Package, color: "text-amber-600 hover:bg-amber-50" },
};

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const uploadImage = async (file: File, itemId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${itemId}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const data = { ...form, farmer_id: user.id, is_available: form.quantity > 0 };
    try {
      if (editItem) {
        let image_url = editItem.image_url;
        if (imageFile) {
          const url = await uploadImage(imageFile, editItem.id);
          if (url) image_url = url;
        }
        await supabase.from("inventory").update({ ...data, image_url } as any).eq("id", editItem.id);
        toast.success("Item updated");
      } else {
        const { data: inserted, error } = await supabase.from("inventory").insert(data as any).select().single();
        if (error) throw error;
        if (imageFile && inserted) {
          const url = await uploadImage(imageFile, inserted.id);
          if (url) await supabase.from("inventory").update({ image_url: url } as any).eq("id", inserted.id);
        }
        toast.success("Item added");
      }
      setShowForm(false);
      setEditItem(null);
      setImageFile(null);
      setImagePreview(null);
      setForm({ product_name: "", category: "chicken", quantity: 0, unit: "pieces", price_per_unit: 0, description: "", location: "", health_status: "healthy", vaccination_status: "", weight_kg: 0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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
    setImageFile(null);
    setImagePreview(item.image_url || null);
    setShowForm(true);
  };

  const handleOrderAction = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order ${newStatus.replace("_", " ")}`);
    fetchData();
  };

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success("Order cancelled");
    fetchData();
  };

  const totalStock = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.price_per_unit, 0);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Farmer Dashboard">
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
      </DashboardLayout>
    );
  }

  if (isOrdersPage()) {
    return (
      <DashboardLayout navItems={navItems} title="Farmer Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard label="Total Orders" value={orders.length} icon={ShoppingCart} color="bg-secondary/10 text-secondary" />
            <KPICard label="Pending" value={orders.filter(o => o.status === "pending").length} icon={Package} color="bg-amber-100 text-amber-600" />
            <KPICard label="Delivered" value={orders.filter(o => o.status === "delivered").length} icon={CheckCircle} color="bg-blue-100 text-blue-600" />
          </div>

          <h2 className="font-display font-semibold text-lg text-foreground">Manage Orders</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Order #</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No orders yet.</td></tr>
                  ) : orders.map((o) => {
                    const action = ORDER_ACTIONS[o.status];
                    return (
                      <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium text-foreground">{o.order_number}</td>
                        <td className="p-3 text-foreground">TZS {o.total_amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            o.status === "delivered" ? "bg-secondary/10 text-secondary" :
                            o.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                            "bg-amber-100 text-amber-700"
                          }`}>{o.status.replace("_", " ")}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {action && (
                              <button onClick={() => handleOrderAction(o.id, action.next)} title={action.label}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${action.color}`}>
                                <action.icon className="w-3.5 h-3.5" /> {action.label}
                              </button>
                            )}
                            {["pending", "confirmed"].includes(o.status) && (
                              <button onClick={() => handleCancelOrder(o.id)} title="Cancel"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Farmer Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Products" value={inventory.length} icon={Package} color="bg-secondary/10 text-secondary" />
          <KPICard label="Total Stock" value={totalStock.toLocaleString()} icon={Egg} color="bg-blue-100 text-blue-600" />
          <KPICard label="Inventory Value" value={`TZS ${totalValue.toLocaleString()}`} icon={TrendingUp} color="bg-amber-100 text-amber-600" />
          <KPICard label="Pending Orders" value={orders.filter(o => o.status === "pending").length} icon={ShoppingCart} color="bg-purple-100 text-purple-600" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-foreground">My Inventory</h2>
          <button onClick={() => { setEditItem(null); setShowForm(true); setForm({ product_name: "", category: "chicken", quantity: 0, unit: "pieces", price_per_unit: 0, description: "", location: "", health_status: "healthy", vaccination_status: "", weight_kg: 0 }); }}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
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
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                  <option value="chicken">Chicken</option><option value="eggs">Eggs</option><option value="meat">Meat</option><option value="other">Other</option>
                </select>
                <input type="number" placeholder="Quantity" value={form.quantity || ""} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} required
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                <input placeholder="Unit (pieces, kg, trays)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                <input type="number" placeholder="Price per unit (TZS)" value={form.price_per_unit || ""} onChange={e => setForm(f => ({ ...f, price_per_unit: +e.target.value }))} required
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                <input placeholder="Health Status" value={form.health_status} onChange={e => setForm(f => ({ ...f, health_status: e.target.value }))}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                <input placeholder="Vaccination Status" value={form.vaccination_status} onChange={e => setForm(f => ({ ...f, vaccination_status: e.target.value }))}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                <input type="number" step="0.1" placeholder="Weight (kg)" value={form.weight_kg || ""} onChange={e => setForm(f => ({ ...f, weight_kg: +e.target.value }))}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                <div className="md:col-span-2 lg:col-span-3">
                  <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted/80 transition-colors">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{imageFile ? imageFile.name : "Upload Product Image"}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
                    )}
                  </label>
                </div>
                <button type="submit" className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
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
                    <td className="p-3"><span className="bg-secondary/10 text-secondary text-xs px-2 py-0.5 rounded-full capitalize">{item.category}</span></td>
                    <td className="p-3 text-foreground">{item.quantity} {item.unit}</td>
                    <td className="p-3 text-foreground">TZS {item.price_per_unit.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{item.location || "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_available ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"}`}>
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
      </div>
    </DashboardLayout>
  );
}
