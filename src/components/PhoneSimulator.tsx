import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ShoppingCart, Truck, BarChart3, Bell, Check, MapPin, TrendingUp, Egg, ChevronRight } from "lucide-react";

interface PhoneScreen {
  role: string;
  label: string;
  color: string;
  icon: React.ElementType;
}

const screens: PhoneScreen[] = [
  { role: "farmer", label: "Farmer", color: "hsl(160 50% 45%)", icon: Package },
  { role: "buyer", label: "Buyer", color: "hsl(200 60% 50%)", icon: ShoppingCart },
  { role: "distributor", label: "Distributor", color: "hsl(30 80% 55%)", icon: Truck },
  { role: "admin", label: "Admin", color: "hsl(270 50% 55%)", icon: BarChart3 },
];

const FarmerScreen = () => (
  <div className="flex flex-col h-full">
    <div className="bg-emerald px-4 py-3 text-accent-foreground">
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold text-sm">My Farm</span>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
          <Bell className="w-4 h-4" />
        </motion.div>
      </div>
    </div>
    <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-lg p-3 shadow-card">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Stock</p>
        <p className="text-xl font-display font-bold text-foreground">2,450</p>
        <div className="flex gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3 text-emerald" />
            <span className="text-[10px] text-muted-foreground">1,200 Chickens</span>
          </div>
          <div className="flex items-center gap-1">
            <Egg className="w-3 h-3 text-emerald" />
            <span className="text-[10px] text-muted-foreground">1,250 Eggs</span>
          </div>
        </div>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card rounded-lg p-3 shadow-card">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] font-medium text-foreground">Recent Orders</p>
          <span className="text-[9px] bg-emerald/10 text-emerald px-1.5 py-0.5 rounded-full font-medium">3 New</span>
        </div>
        {[
          { name: "Hotel Serena", qty: "50 chickens", time: "2m ago" },
          { name: "Mama Lishe", qty: "30 eggs", time: "15m ago" },
        ].map((order, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.2 }}
            className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <div>
              <p className="text-[10px] font-medium text-foreground">{order.name}</p>
              <p className="text-[9px] text-muted-foreground">{order.qty}</p>
            </div>
            <span className="text-[9px] text-muted-foreground">{order.time}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="bg-emerald/10 rounded-lg p-2.5 flex items-center gap-2">
        <Check className="w-3.5 h-3.5 text-emerald" />
        <span className="text-[10px] text-emerald font-medium">Vaccination complete – Batch #47</span>
      </motion.div>
    </div>
  </div>
);

const BuyerScreen = () => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3" style={{ background: "hsl(200 60% 50%)" }}>
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold text-sm text-accent-foreground">Marketplace</span>
        <MapPin className="w-4 h-4 text-accent-foreground" />
      </div>
      <div className="mt-2 bg-background/20 rounded-md px-2.5 py-1.5">
        <span className="text-[10px] text-accent-foreground/80">Search chickens, eggs…</span>
      </div>
    </div>
    <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
      {[
        { name: "Farm Fresh Broilers", price: "TZS 12,000", rating: "4.8", loc: "Dar es Salaam" },
        { name: "Free Range Eggs (Tray)", price: "TZS 8,500", rating: "4.9", loc: "Arusha" },
        { name: "Kienyeji Chicken", price: "TZS 15,000", rating: "4.7", loc: "Dodoma" },
      ].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.2 }}
          className="bg-card rounded-lg p-3 shadow-card flex justify-between items-center">
          <div>
            <p className="text-[10px] font-semibold text-foreground">{item.name}</p>
            <p className="text-[9px] text-muted-foreground">{item.loc} · ⭐ {item.rating}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-emerald">{item.price}</p>
            <div className="mt-1 bg-emerald text-accent-foreground text-[8px] px-2 py-0.5 rounded-full font-medium text-center">
              Order
            </div>
          </div>
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="bg-card rounded-lg p-2.5 shadow-card border-l-2 border-emerald">
        <div className="flex items-center gap-1.5">
          <Check className="w-3 h-3 text-emerald" />
          <span className="text-[10px] font-medium text-foreground">Order #1042 confirmed!</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5">Delivery scheduled for tomorrow 8AM</p>
      </motion.div>
    </div>
  </div>
);

const DistributorScreen = () => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3" style={{ background: "hsl(30 80% 55%)" }}>
      <span className="font-display font-semibold text-sm text-accent-foreground">Deliveries</span>
      <div className="flex gap-3 mt-2">
        <div className="bg-background/20 rounded-md px-2 py-1">
          <span className="text-[10px] text-accent-foreground font-medium">Today: 8</span>
        </div>
        <div className="bg-background/20 rounded-md px-2 py-1">
          <span className="text-[10px] text-accent-foreground font-medium">Pending: 3</span>
        </div>
      </div>
    </div>
    <div className="flex-1 p-3 space-y-2 overflow-hidden">
      {[
        { from: "Kibaha Farm", to: "Hotel Serena", status: "In Transit", color: "hsl(30 80% 55%)" },
        { from: "Bagamoyo Eggs", to: "Mama Lishe", status: "Picked Up", color: "hsl(200 60% 50%)" },
        { from: "Morogoro Farm", to: "KFC Dar", status: "Delivered", color: "hsl(160 50% 45%)" },
      ].map((d, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
          className="bg-card rounded-lg p-2.5 shadow-card">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                <p className="text-[10px] font-medium text-foreground">{d.from}</p>
              </div>
              <div className="flex items-center gap-1 mt-0.5 ml-0.5">
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />
                <p className="text-[9px] text-muted-foreground">{d.to}</p>
              </div>
            </div>
            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full" 
              style={{ background: `${d.color}20`, color: d.color }}>
              {d.status}
            </span>
          </div>
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        className="bg-card rounded-lg p-2.5 shadow-card">
        <div className="h-16 bg-muted rounded-md flex items-center justify-center">
          <MapPin className="w-4 h-4 text-muted-foreground mr-1" />
          <span className="text-[9px] text-muted-foreground">Live route map</span>
        </div>
      </motion.div>
    </div>
  </div>
);

const AdminScreen = () => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3" style={{ background: "hsl(270 50% 55%)" }}>
      <span className="font-display font-semibold text-sm text-accent-foreground">Dashboard</span>
    </div>
    <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Revenue", value: "TZS 4.2M", trend: "+12%", icon: TrendingUp },
          { label: "Orders", value: "1,847", trend: "+8%", icon: ShoppingCart },
          { label: "Farmers", value: "342", trend: "+15%", icon: Package },
          { label: "Deliveries", value: "892", trend: "+5%", icon: Truck },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-card rounded-lg p-2.5 shadow-card">
            <kpi.icon className="w-3 h-3 text-muted-foreground mb-1" />
            <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
            <p className="text-sm font-display font-bold text-foreground">{kpi.value}</p>
            <span className="text-[8px] text-emerald font-medium">{kpi.trend}</span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-card rounded-lg p-2.5 shadow-card">
        <p className="text-[10px] font-medium text-foreground mb-2">Supply Chain Activity</p>
        <div className="flex items-end gap-1 h-12">
          {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
              className="flex-1 rounded-sm bg-emerald/70" />
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);

const screenComponents: Record<string, React.FC> = {
  farmer: FarmerScreen,
  buyer: BuyerScreen,
  distributor: DistributorScreen,
  admin: AdminScreen,
};

export function PhoneSimulator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAuto, setIsAuto] = useState(true);

  useEffect(() => {
    if (!isAuto) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAuto]);

  const current = screens[activeIndex];
  const ScreenComponent = screenComponents[current.role];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Role tabs */}
      <div className="flex gap-2">
        {screens.map((screen, i) => (
          <button
            key={screen.role}
            onClick={() => { setActiveIndex(i); setIsAuto(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              i === activeIndex
                ? "bg-card shadow-elevated text-foreground"
                : "text-primary-foreground/60 hover:text-primary-foreground/80"
            }`}
          >
            <screen.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{screen.label}</span>
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-4 rounded-[3rem] opacity-30 blur-2xl" style={{ background: current.color }} />
        
        {/* Phone body */}
        <div className="relative w-[260px] h-[520px] bg-foreground rounded-[2.5rem] p-[8px] shadow-elevated">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground rounded-b-2xl z-10" />
          
          {/* Screen */}
          <div className="w-full h-full bg-background rounded-[2rem] overflow-hidden relative">
            {/* Status bar */}
            <div className="h-7 flex items-center justify-between px-6 text-[9px] text-muted-foreground bg-card">
              <span>9:41</span>
              <div className="flex gap-1 items-center">
                <div className="w-3.5 h-2 border border-muted-foreground rounded-sm relative">
                  <div className="absolute inset-0.5 bg-emerald rounded-[1px]" style={{ width: "70%" }} />
                </div>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={current.role}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="h-[calc(100%-1.75rem)]"
              >
                <ScreenComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {screens.map((_, i) => (
          <div key={i} className="relative w-8 h-1 rounded-full overflow-hidden bg-primary-foreground/20">
            {i === activeIndex && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: current.color }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: isAuto ? 4 : 0.3, ease: "linear" }}
              />
            )}
            {i < activeIndex && (
              <div className="absolute inset-0 rounded-full bg-primary-foreground/40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
