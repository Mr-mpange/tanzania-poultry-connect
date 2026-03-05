import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

type AppRole = "farmer" | "buyer" | "distributor" | "admin";

const roles: { value: AppRole; label: string; desc: string }[] = [
  { value: "farmer", label: "Farmer / Supplier", desc: "Manage your poultry inventory" },
  { value: "buyer", label: "Buyer", desc: "Order chickens, eggs & meat" },
  { value: "distributor", label: "Distributor", desc: "Manage pickups & deliveries" },
  { value: "admin", label: "Admin", desc: "Platform management" },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("buyer");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && role) navigate(`/dashboard/${role}`, { replace: true });
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
        // redirect handled by useEffect
      } else {
        await signUp(email, password, fullName, selectedRole);
        toast.success("Account created! Check your email to confirm.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-emerald rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-2xl text-primary-foreground">Smart Butcher</span>
          </div>
          <p className="text-primary-foreground/60 text-sm">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="bg-card/10 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div key="signup-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="space-y-4 mb-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                      <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                        className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl pl-10 pr-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
                    </div>
                    <div>
                      <p className="text-xs text-primary-foreground/60 mb-2 font-medium">I am a:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {roles.map((r) => (
                          <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                            className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                              selectedRole === r.value
                                ? "border-emerald bg-emerald/10 text-primary-foreground"
                                : "border-primary-foreground/10 text-primary-foreground/60 hover:border-primary-foreground/25"
                            }`}>
                            <p className="font-semibold">{r.label}</p>
                            <p className="text-[10px] opacity-70 mt-0.5">{r.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl pl-10 pr-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl pl-10 pr-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-emerald text-accent-foreground py-3 rounded-xl font-display font-semibold text-sm hover:bg-emerald-light transition-colors shadow-glow flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {isLogin && (
            <p className="text-center text-xs text-primary-foreground/50 mt-4">
              <a href="/forgot-password" className="text-emerald hover:text-emerald-light font-medium">Forgot password?</a>
            </p>
          )}

          <p className="text-center text-xs text-primary-foreground/50 mt-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-emerald hover:text-emerald-light font-medium">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-primary-foreground/30 mt-6">
          <a href="/" className="hover:text-emerald">← Back to Home</a>
        </p>
      </motion.div>
    </div>
  );
}
