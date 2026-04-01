import { useState, useCallback, useEffect } from "react";

export interface NotificationPreferences {
  browser: {
    orderUpdates: boolean;
    newOrders: boolean;
    reviews: boolean;
  };
  inApp: {
    orderUpdates: boolean;
    newOrders: boolean;
    reviews: boolean;
  };
  sms: {
    orderUpdates: boolean;
    newOrders: boolean;
    reviews: boolean;
  };
  smsPhone: string;
}

const DEFAULT_PREFS: NotificationPreferences = {
  browser: { orderUpdates: true, newOrders: true, reviews: true },
  inApp: { orderUpdates: true, newOrders: true, reviews: true },
  sms: { orderUpdates: false, newOrders: false, reviews: false },
  smsPhone: "",
};

const STORAGE_KEY = "notification_preferences";

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = useCallback(
    (channel: "browser" | "inApp" | "sms", key: keyof NotificationPreferences["browser"], value: boolean) => {
      setPreferences((prev) => ({
        ...prev,
        [channel]: { ...prev[channel], [key]: value },
      }));
    },
    []
  );

  const updatePhone = useCallback((phone: string) => {
    setPreferences((prev) => ({ ...prev, smsPhone: phone }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFS);
  }, []);

  return { preferences, updatePreference, updatePhone, resetToDefaults };
}
