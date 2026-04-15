import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={`/dashboard/${role}`} replace />;
  }

  // Block access if KYC not verified (except admin and settings pages)
  const isSettingsPath = window.location.pathname === "/dashboard/settings" ||
    window.location.pathname === "/dashboard/notifications";
  const isAdmin = role === "admin";

  if (!isAdmin && !isSettingsPath && profile && profile.kyc_status !== "verified") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 text-center shadow-card">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">KYC Verification Required</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {profile.kyc_status === "rejected"
              ? "Your KYC documents were rejected. Please re-upload corrected documents in Settings."
              : "Your account is pending KYC verification. Please upload your documents in Settings and wait for admin approval."}
          </p>
          <a
            href="/dashboard/settings"
            className="inline-block bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
