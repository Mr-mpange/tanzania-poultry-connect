import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Leaf, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  // Listen for the PASSWORD_RECOVERY event from email link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via password reset link — they can now set a new password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/auth", { replace: true }), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-emerald rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-2xl text-primary-foreground">Smart Butcher</span>
          </div>
          <p className="text-primary-foreground/60 text-sm">Set your new password</p>
        </div>

        <div className="bg-card/10 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-8">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-emerald mx-auto mb-3" />
              <p className="text-primary-foreground font-display font-semibold">Password Updated!</p>
              <p className="text-primary-foreground/60 text-sm mt-1">Redirecting to sign in…</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl pl-10 pr-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                  className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl pl-10 pr-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald text-accent-foreground py-3 rounded-xl font-display font-semibold text-sm hover:bg-emerald-light transition-colors shadow-glow flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>Update Password <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-primary-foreground/30 mt-6">
          <a href="/auth" className="hover:text-emerald">← Back to Sign In</a>
        </p>
      </motion.div>
    </div>
  );
}
