import DashboardLayout from "@/components/DashboardLayout";
import { Truck, Navigation, DollarSign, MessageSquare, Car, Settings } from "lucide-react";
import { MessagesPage } from "@/pages/farmer/FarmerMessages";

const navItems = [
  { title: "Deliveries", url: "/dashboard/distributor", icon: Truck },
  { title: "Route Map", url: "/dashboard/distributor/routes", icon: Navigation },
  { title: "Earnings", url: "/dashboard/distributor/earnings", icon: DollarSign },
  { title: "Messages", url: "/dashboard/distributor/messages", icon: MessageSquare },
  { title: "Vehicles", url: "/dashboard/distributor/vehicles", icon: Car },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function DistributorMessages() {
  return <MessagesPage navItems={navItems} title="Distributor Dashboard" />;
}
