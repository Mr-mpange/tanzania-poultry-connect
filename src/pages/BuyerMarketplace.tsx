import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingCart, Search, MapPin, Filter, ShoppingBag, Package, Loader2, Check, Settings, Heart, MessageSquare, Plus, Minus, X, Star, ArrowUpDown } from "lucide-react";
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
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "rating">("newest");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<Record<string, { avg: number; count: number }>>({});
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const { favoriteIds, toggle: toggleFavorite } = useFavorites(user?.id);

  const isOrdersPage = window.location.pathname.includes("/orders");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: inv, error: inventoryError }, { data: ord, error: ordersError }, { data: revData, error: reviewsError }] = await Promise.all([
      supabase.from("inventory").select("*").eq("is_available", true).gt("quantity", 0),
      supabase.from("orders").select("*, order_items(*)").eq("buyer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("reviews" as any).select("inventory_id, rating"),
    ]);

    if (inventoryError || ordersError || reviewsError) {
      toast.error(inventoryError?.message || ordersError?.message || reviewsError?.message || "Failed to load marketplace");
      setInventory([]);
      setOrders([]);
      setReviews({});
      setLoading(false);
      return;
    }

    const farmerIds = Array.from(new Set((inv || []).map((item) => item.farmer_id).filter(Boolean)));
    let profileMap: Record<string, { full_name: string; location: string | null }> = {};

    if (farmerIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, location")
        .in("user_id", farmerIds);

      if (profileError) {
        toast.error(profileError.message);
      } else {
        profileMap = (profileData || []).reduce((acc, profile) => {
          acc[profile.user_id] = { full_name: profile.full_name, location: profile.location };
          return acc;
        }, {} as Record<string, { full_name: string; location: string | null }>);
      }
    }

    setInventory((inv || []).map((item) => ({
      ...item,
      profiles: profileMap[item.farmer_id] ?? null,
    })));
    setOrders(ord || []);

    const reviewMap: Record<string, { total: number; count: number }> = {};
    (revData || []).forEach((r: any) => {
      if (!reviewMap[r.inventory_id]) reviewMap[r.inventory_id] = { total: 0, count: 0 };
      reviewMap[r.inventory_id].total += r.rating;
      reviewMap[r.inventory_id].count += 1;
    });

    const avgMap: Record<string, { avg: number; count: number }> = {};
    Object.entries(reviewMap).forEach(([id, v]) => {
      avgMap[id] = { avg: v.total / v.count, count: v.count };
    });
    setReviews(avgMap);
    setLoading(false);
  };

  const fetchProductReviews = async (inventoryId: string) => {
    const { data, error } = await supabase
      .from("reviews" as any)
      .select("*")
      .eq("inventory_id", inventoryId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setProductReviews([]);
      return;
    }

    const buyerIds = Array.from(new Set((data || []).map((review: any) => review.buyer_id).filter(Boolean)));
    if (buyerIds.length === 0) {
      setProductReviews(data || []);
      return;
    }

    const { data: buyerProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", buyerIds);

    if (profileError) {
      toast.error(profileError.message);
      setProductReviews(data || []);
      return;
    }

    const buyerProfileMap = (buyerProfiles || []).reduce((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {} as Record<string, { user_id: string; full_name: string }>);

    setProductReviews((data || []).map((review: any) => ({
      ...review,
      profiles: buyerProfileMap[review.buyer_id] ?? null,
    })));
  };

  const submitReview = async (inventoryId: string) => {
    if (!user) return;
    // Find a delivered order containing this product
    const deliveredOrder = orders.find(o => o.status === "delivered" && o.order_items?.some((oi: any) => oi.inventory_id === inventoryId));
    if (!deliveredOrder) { toast.error("You can only review products from delivered orders"); return; }
    const { error } = await supabase.from("reviews" as any).insert({
      buyer_id: user.id, inventory_id: inventoryId, order_id: deliveredOrder.id,
      rating: reviewForm.rating, comment: reviewForm.comment || null,
    });
    if (error) {
      if (error.code === "23505") toast.error("You already reviewed this product for that order");
      else toast.error(error.message);
      return;
    }
    toast.success("Review submitted!");
    setReviewForm({ rating: 5, comment: "" });
    fetchProductReviews(inventoryId);
    fetchData();
  };

  const filteredInventory = inventory.filter((item) => {
    const matchSearch = !search || item.product_name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || item.category === categoryFilter;
    const matchLocation = !locationFilter || (item.location || "").toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchCategory && matchLocation;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price_low": return a.price_per_unit - b.price_per_unit;
      case "price_high": return b.price_per_unit - a.price_per_unit;
      case "rating": return (reviews[b.id]?.avg || 0) - (reviews[a.id]?.avg || 0);
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
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
          {/* Order Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search orders..."
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
            </div>
            <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {orders.filter(o => {
            const matchSearch = !orderSearch || o.order_number.toLowerCase().includes(orderSearch.toLowerCase());
            const matchStatus = !orderStatusFilter || o.status === orderStatusFilter;
            return matchSearch && matchStatus;
          }).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No orders found.</div>
          ) : orders.filter(o => {
            const matchSearch = !orderSearch || o.order_number.toLowerCase().includes(orderSearch.toLowerCase());
            const matchStatus = !orderStatusFilter || o.status === orderStatusFilter;
            return matchSearch && matchStatus;
          }).map((order) => (
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
            <div className="flex gap-3 flex-wrap">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none">
                <option value="">All Categories</option>
                <option value="chicken">Chicken</option><option value="eggs">Eggs</option><option value="meat">Meat</option><option value="other">Other</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none">
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
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
                onClick={() => { setSelectedProduct(item); fetchProductReviews(item.id); }}>
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
                  {reviews[item.id] && (
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(reviews[item.id].avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">({reviews[item.id].count})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-display font-bold text-emerald">TZS {item.price_per_unit.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/{item.unit}</span></p>
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

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-lg">{selectedProduct.product_name}</DialogTitle>
              </DialogHeader>
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.product_name} className="w-full h-56 object-cover rounded-xl" />
              ) : (
                <div className="w-full h-56 bg-muted rounded-xl flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-display font-bold text-emerald">TZS {selectedProduct.price_per_unit.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/{selectedProduct.unit}</span></p>
                  <span className="bg-emerald/10 text-emerald text-xs px-2 py-0.5 rounded-full capitalize">{selectedProduct.category}</span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {selectedProduct.location || "Unknown"} · <Package className="w-3.5 h-3.5" /> {(selectedProduct.profiles as any)?.full_name || "Farmer"}
                </p>
                {selectedProduct.description && <p className="text-sm text-foreground">{selectedProduct.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{selectedProduct.quantity} {selectedProduct.unit} available</span>
                  {selectedProduct.health_status && <span>Health: {selectedProduct.health_status}</span>}
                  {selectedProduct.weight_kg && <span>Weight: {selectedProduct.weight_kg} kg</span>}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => toggleFavorite(selectedProduct.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                    <Heart className={`w-4 h-4 ${favoriteIds.has(selectedProduct.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    {favoriteIds.has(selectedProduct.id) ? "Saved" : "Save"}
                  </button>
                  {cart[selectedProduct.id] ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => decreaseQty(selectedProduct.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                      <span className="font-semibold w-6 text-center">{cart[selectedProduct.id]}</span>
                      <button onClick={() => addToCart(selectedProduct.id)} className="w-8 h-8 rounded-lg bg-emerald flex items-center justify-center"><Plus className="w-4 h-4 text-accent-foreground" /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(selectedProduct.id)}
                      className="flex-1 bg-emerald text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-light transition-colors">
                      Add to Cart
                    </button>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-semibold text-sm">Reviews</h4>
                    {reviews[selectedProduct.id] && (
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(reviews[selectedProduct.id].avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{reviews[selectedProduct.id].avg.toFixed(1)} ({reviews[selectedProduct.id].count})</span>
                      </div>
                    )}
                  </div>

                  {/* Write a review */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Write a review (delivered orders only)</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                          <Star className={`w-5 h-5 ${s <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                    <input value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      placeholder="Optional comment..." className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald/50 focus:outline-none" />
                    <button onClick={() => submitReview(selectedProduct.id)}
                      className="bg-emerald text-accent-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-light transition-colors">
                      Submit Review
                    </button>
                  </div>

                  {/* Existing reviews */}
                  {productReviews.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {productReviews.map((r: any) => (
                        <div key={r.id} className="bg-card border border-border rounded-lg p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          {r.comment && <p className="text-xs text-foreground mt-1">{r.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">{(r.profiles as any)?.full_name || "Buyer"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
