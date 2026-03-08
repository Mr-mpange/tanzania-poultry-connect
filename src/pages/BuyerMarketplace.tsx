import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingCart, Search, MapPin, Filter, ShoppingBag, Package, Loader2, Check, Settings, Heart, MessageSquare, Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const useFavorites = (userId: string | undefined) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    supabase.from("favorites").select("inventory_id").eq("user_id", userId)
      .then(({ data }) => setFavoriteIds(new Set((data || []).map(f => f.inventory_id))));
  }, [userId]);

  const toggle = async (inventoryId: string) => {
    if (!userId) return;
    if (favoriteIds.has(inventoryId)) {
      await supabase.from("favorites").delete().eq("user_id", userId).eq("inventory_id", inventoryId);
      setFavoriteIds(prev => { const n = new Set(prev); n.delete(inventoryId); return n; });
      toast.success("Removed from favorites");
    } else {
      await supabase.from("favorites").insert({ user_id: userId, inventory_id: inventoryId } as any);
      setFavoriteIds(prev => new Set(prev).add(inventoryId));
      toast.success("Added to favorites");
    }
  };

  return { favoriteIds, toggle };
};

const navItems = [
  { title: "Marketplace", url: "/dashboard/buyer", icon: ShoppingCart },
  { title: "My Orders", url: "/dashboard/buyer/orders", icon: ShoppingBag },
  { title: "Order Tracking", url: "/dashboard/buyer/tracking", icon: MapPin },
  { title: "Favorites", url: "/dashboard/buyer/favorites", icon: Heart },
  { title: "Messages", url: "/dashboard/buyer/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function BuyerMarketplace() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { favoriteIds, toggle: toggleFavorite } = useFavorites(user?.id);

  const isOrdersPage = window.location.pathname.includes("/orders");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: inv }, { data: ord }] = await Promise.all([
      supabase.from("inventory").select("*, profiles!inventory_farmer_id_fkey(full_name, location)").eq("is_available", true).gt("quantity", 0),
      supabase.from("orders").select("*, order_items(*)").eq("buyer_id", user.id).order("created_at", { ascending: false }),
    ]);
    setInventory(inv || []);
    setOrders(ord || []);
    setLoading(false);
  };

  const filteredInventory = inventory.filter((item) => {
    const matchSearch = !search || item.product_name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || item.category === categoryFilter;
    const matchLocation = !locationFilter || (item.location || "").toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchCategory && matchLocation;
  });

  const addToCart = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    const currentQty = cart[itemId] || 0;
    if (item && currentQty >= item.quantity) {
      toast.error("Cannot exceed available quantity");
      return;
    }
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    if (!cart[itemId]) toast.success("Added to cart");
  };

  const decreaseQty = (itemId: string) => {
    setCart(prev => {
      const newQty = (prev[itemId] || 0) - 1;
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[itemId];
        return newCart;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const item = inventory.find(i => i.id === id);
    return item ? { ...item, orderQty: qty } : null;
  }).filter(Boolean);

  const cartTotal = cartItems.reduce((s, i: any) => s + i.price_per_unit * i.orderQty, 0);

  const placeOrder = async () => {
    if (!user || cartItems.length === 0) return;
    
    // Group by farmer
    const byFarmer: Record<string, any[]> = {};
    cartItems.forEach((item: any) => {
      if (!byFarmer[item.farmer_id]) byFarmer[item.farmer_id] = [];
      byFarmer[item.farmer_id].push(item);
    });

    try {
      for (const [farmerId, items] of Object.entries(byFarmer)) {
        const total = items.reduce((s, i: any) => s + i.price_per_unit * i.orderQty, 0);
        const { data: order, error } = await supabase.from("orders").insert({
          buyer_id: user.id,
          farmer_id: farmerId,
          total_amount: total,
          status: "pending",
        } as any).select().single();
        
        if (error) throw error;

        const orderItems = items.map((item: any) => ({
          order_id: order.id,
          inventory_id: item.id,
          quantity: item.orderQty,
          unit_price: item.price_per_unit,
          total_price: item.price_per_unit * item.orderQty,
        }));

        await supabase.from("order_items").insert(orderItems as any);
      }

      toast.success("Order placed successfully!");
      setCart({});
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    }
  };

  return (
    <DashboardLayout navItems={navItems} title={isOrdersPage ? "My Orders" : "Marketplace"}>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
      ) : isOrdersPage ? (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No orders yet. Browse the marketplace!</div>
          ) : orders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-display font-semibold text-foreground">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-foreground">TZS {order.total_amount.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${
                    order.status === "delivered" ? "bg-emerald/10 text-emerald" :
                    order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                    "bg-amber-100 text-amber-700"
                  }`}>{order.status.replace("_", " ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
            </div>
            <div className="flex gap-3">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none">
                <option value="">All Categories</option>
                <option value="chicken">Chicken</option><option value="eggs">Eggs</option><option value="meat">Meat</option><option value="other">Other</option>
              </select>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Location..."
                  className="bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm w-40 focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          {Object.keys(cart).length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-emerald/10 border border-emerald/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <p className="font-display font-semibold text-foreground">Cart: {cartItems.length} items</p>
                <p className="text-sm text-muted-foreground">Total: TZS {cartTotal.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCart({})} className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium">Clear</button>
                <button onClick={placeOrder} className="bg-emerald text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-light transition-colors flex items-center gap-2">
                  <Check className="w-4 h-4" /> Place Order
                </button>
              </div>
            </motion.div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground">No products found</div>
            ) : filteredInventory.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all cursor-pointer"
                onClick={() => setSelectedProduct(item)}>
                {/* Product Image */}
                {item.image_url ? (
                  <div className="w-full h-40 bg-muted">
                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{item.product_name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {item.location || "Unknown"} · <Package className="w-3 h-3" /> {(item.profiles as any)?.full_name || "Farmer"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFavorite(item.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <Heart className={`w-4 h-4 ${favoriteIds.has(item.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                      </button>
                      <span className="bg-emerald/10 text-emerald text-xs px-2 py-0.5 rounded-full capitalize">{item.category}</span>
                    </div>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mb-3">{item.description}</p>}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-display font-bold text-emerald">TZS {item.price_per_unit.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} available</p>
                    </div>
                    {cart[item.id] ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => decreaseQty(item.id)}
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                          <Minus className="w-3.5 h-3.5 text-foreground" />
                        </button>
                        <span className="text-sm font-semibold text-foreground w-6 text-center">{cart[item.id]}</span>
                        <button onClick={() => addToCart(item.id)}
                          className="w-7 h-7 rounded-lg bg-emerald flex items-center justify-center hover:bg-emerald-light transition-colors">
                          <Plus className="w-3.5 h-3.5 text-accent-foreground" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="text-xs text-destructive hover:underline ml-1">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item.id)}
                        className="bg-emerald text-accent-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-light transition-colors">
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
