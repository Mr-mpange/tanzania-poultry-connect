import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
} from "@/lib/browserNotifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, BellOff, Monitor, Smartphone, RotateCcw, ShieldAlert, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const NOTIFICATION_TYPES = [
  { key: "orderUpdates" as const, label: "Order status updates", description: "Get notified when an order is confirmed, picked up, in transit, or delivered" },
  { key: "newOrders" as const, label: "New orders", description: "Get notified when a new order is placed or available for delivery" },
  { key: "reviews" as const, label: "Reviews & ratings", description: "Get notified when a buyer leaves a review on your product" },
];

export default function NotificationPreferences() {
  const { preferences, updatePreference, updatePhone, resetToDefaults } = useNotificationPreferences();
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">(
    getNotificationPermission()
  );

  useEffect(() => {
    setBrowserPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setBrowserPermission(getNotificationPermission());
    if (granted) {
      toast.success("Browser notifications enabled!");
    } else {
      toast.error("Browser notifications were denied. Please enable them in your browser settings.");
    }
  };

  const browserBlocked = browserPermission === "denied";
  const browserNotSupported = !isNotificationSupported();
  const browserNeedsPermission = browserPermission === "default";

  const hasSmsEnabled = preferences.sms.orderUpdates || preferences.sms.newOrders || preferences.sms.reviews;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="font-display font-bold text-2xl text-foreground mb-2">Notification Preferences</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Choose how you want to be notified about activity on your account.
      </p>

      {/* Browser permission banner */}
      {browserNotSupported && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 mb-6">
          <BellOff className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Browser notifications not supported</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your browser doesn't support push notifications.</p>
          </div>
        </div>
      )}

      {browserBlocked && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 mb-6">
          <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Browser notifications blocked</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You've blocked notifications for this site. Enable them in your browser's site settings to receive alerts.
            </p>
          </div>
        </div>
      )}

      {browserNeedsPermission && !browserNotSupported && (
        <button
          onClick={handleRequestPermission}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary font-medium text-sm mb-6 hover:bg-secondary/20 transition-colors"
        >
          <Bell className="w-4 h-4" />
          Enable browser notifications
        </button>
      )}

      {/* In-App Notifications */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">In-App Notifications</h2>
        </div>
        <div className="space-y-1">
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={`inApp-${type.key}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="pr-4">
                <Label htmlFor={`inApp-${type.key}`} className="text-sm font-medium text-foreground cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              </div>
              <Switch
                id={`inApp-${type.key}`}
                checked={preferences.inApp[type.key]}
                onCheckedChange={(v) => updatePreference("inApp", type.key, v)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Browser Push Notifications */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Browser Push Notifications</h2>
        </div>
        <div className="space-y-1">
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={`browser-${type.key}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="pr-4">
                <Label htmlFor={`browser-${type.key}`} className="text-sm font-medium text-foreground cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              </div>
              <Switch
                id={`browser-${type.key}`}
                checked={preferences.browser[type.key]}
                onCheckedChange={(v) => updatePreference("browser", type.key, v)}
                disabled={browserBlocked || browserNotSupported}
              />
            </div>
          ))}
        </div>
      </section>

      {/* SMS Notifications */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">SMS Notifications</h2>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border">
          <Label htmlFor="sms-phone" className="text-sm font-medium text-foreground">
            Phone number
          </Label>
          <p className="text-xs text-muted-foreground mb-2">Enter your phone number with country code (e.g. +255712345678)</p>
          <Input
            id="sms-phone"
            type="tel"
            placeholder="+255..."
            value={preferences.smsPhone}
            onChange={(e) => updatePhone(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="space-y-1">
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={`sms-${type.key}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="pr-4">
                <Label htmlFor={`sms-${type.key}`} className="text-sm font-medium text-foreground cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              </div>
              <Switch
                id={`sms-${type.key}`}
                checked={preferences.sms[type.key]}
                onCheckedChange={(v) => updatePreference("sms", type.key, v)}
                disabled={!preferences.smsPhone || preferences.smsPhone.length < 10}
              />
            </div>
          ))}
        </div>

        {hasSmsEnabled && (!preferences.smsPhone || preferences.smsPhone.length < 10) && (
          <p className="text-xs text-destructive mt-2">Please enter a valid phone number to receive SMS notifications.</p>
        )}
      </section>

      {/* Reset */}
      <button
        onClick={() => {
          resetToDefaults();
          toast.success("Preferences reset to defaults");
        }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset to defaults
      </button>
    </div>
  );
}
