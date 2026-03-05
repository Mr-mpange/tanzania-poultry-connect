import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Leaf, Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your email for the reset link!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
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
          <p className="text-primary-foreground/60 text-sm">Reset your password</p>
        </div>

        <div className="bg-card/10 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-emerald mx-auto mb-3" />
              <p className="text-primary-foreground font-display font-semibold">Email Sent!</p>
              <p className="text-primary-foreground/60 text-sm mt-1">Check your inbox for the password reset link.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-primary-foreground/70 text-sm mb-2">Enter your email and we'll send you a link to reset your password.</p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl pl-10 pr-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald text-accent-foreground py-3 rounded-xl font-display font-semibold text-sm hover:bg-emerald-light transition-colors shadow-glow flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
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
