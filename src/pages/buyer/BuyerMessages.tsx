import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingCart, ShoppingBag, MapPin, Heart, MessageSquare, Settings } from "lucide-react";
import { MessagesPage } from "@/pages/farmer/FarmerMessages";

const navItems = [
  { title: "Marketplace", url: "/dashboard/buyer", icon: ShoppingCart },
  { title: "My Orders", url: "/dashboard/buyer/orders", icon: ShoppingBag },
  { title: "Order Tracking", url: "/dashboard/buyer/tracking", icon: MapPin },
  { title: "Favorites", url: "/dashboard/buyer/favorites", icon: Heart },
  { title: "Messages", url: "/dashboard/buyer/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function BuyerMessages() {
  return <MessagesPage navItems={navItems} title="Buyer Dashboard" />;
}
