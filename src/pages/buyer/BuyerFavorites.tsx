import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingCart, ShoppingBag, MapPin, Heart, MessageSquare, Settings, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { title: "Marketplace", url: "/dashboard/buyer", icon: ShoppingCart },
  { title: "My Orders", url: "/dashboard/buyer/orders", icon: ShoppingBag },
  { title: "Order Tracking", url: "/dashboard/buyer/tracking", icon: MapPin },
  { title: "Favorites", url: "/dashboard/buyer/favorites", icon: Heart },
  { title: "Messages", url: "/dashboard/buyer/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function BuyerFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("*, inventory(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFavorites(data || []);
    setLoading(false);
  };

  const removeFavorite = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed from favorites");
    fetchFavorites();
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Buyer Dashboard"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Buyer Dashboard">
      <div className="space-y-6">
        <h2 className="font-display font-semibold text-lg text-foreground">Favorites ({favorites.length})</h2>

        {favorites.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No favorites yet. Browse the marketplace to save products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(fav => {
              const item = fav.inventory;
              if (!item) return null;
              return (
                <div key={fav.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-semibold text-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{item.category} • {item.unit}</p>
                    </div>
                    <button onClick={() => removeFavorite(fav.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-bold text-secondary">TZS {item.price_per_unit.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} available</p>
                  </div>
                  {item.location && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.location}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
