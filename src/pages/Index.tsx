import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Smartphone, BarChart3, Truck, Users, Bell, CreditCard, Zap, ChevronRight, Mail, Phone, MapPin, Check } from "lucide-react";
import { PhoneSimulator } from "@/components/PhoneSimulator";
import { useState } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

/* ─── Hero ─── */
function HeroSection() {
  return (
    <section className="relative bg-hero min-h-screen flex items-center overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/15 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-emerald" />
              <span className="text-xs font-medium text-primary-foreground/80">Tanzania's #1 Poultry Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground leading-tight mb-6">
              Smart Butcher
              <br />
              <span className="text-gradient">Nationwide Poultry</span>
              <br />
              Marketplace
            </h1>
            
            <p className="text-lg text-primary-foreground/70 max-w-lg mb-8 font-body">
              Connect farmers, buyers, and distributors on one intelligent platform.
              From farm to table — transparent, efficient, and profitable.
            </p>
            
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Join as Farmer", icon: Leaf },
                { label: "Join as Buyer", icon: Users },
                { label: "Join as Distributor", icon: Truck },
              ].map((cta) => (
                <motion.button
                  key={cta.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 bg-emerald text-accent-foreground px-5 py-3 rounded-xl font-display font-semibold text-sm hover:bg-emerald-light transition-colors shadow-glow"
                >
                  <cta.icon className="w-4 h-4" />
                  {cta.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              ))}
            </div>
            
            <div className="flex items-center gap-6 mt-10">
              {[
                { value: "5,000+", label: "Farmers" },
                { value: "50K+", label: "Orders/mo" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-display font-bold text-primary-foreground">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }}>
            <PhoneSimulator />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
const features = [
  { icon: Smartphone, title: "Mobile-First Design", desc: "Manage your entire supply chain from your phone, anywhere in Tanzania." },
  { icon: ShieldCheck, title: "Secure Payments", desc: "M-Pesa integration with escrow protection for every transaction." },
  { icon: Bell, title: "Smart Notifications", desc: "Real-time alerts for orders, low stock, deliveries, and price changes." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Revenue tracking, supply chain insights, and demand forecasting." },
  { icon: Truck, title: "Delivery Tracking", desc: "GPS-enabled route optimization and real-time delivery status." },
  { icon: CreditCard, title: "Flexible Pricing", desc: "Set dynamic prices, bulk discounts, and seasonal adjustments." },
];

function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-emerald font-display font-semibold text-sm uppercase tracking-widest">Features</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
            Everything you need to run a modern poultry business
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border border-border hover:border-emerald/30">
              <div className="w-11 h-11 rounded-xl bg-emerald/10 flex items-center justify-center mb-4 group-hover:bg-emerald/20 transition-colors">
                <f.icon className="w-5 h-5 text-emerald" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
const steps = [
  { step: "01", title: "Sign Up & Choose Role", desc: "Register as a farmer, buyer, or distributor in under 2 minutes." },
  { step: "02", title: "List or Search Products", desc: "Farmers list inventory. Buyers search by location, type, and quantity." },
  { step: "03", title: "Place & Fulfill Orders", desc: "Secure ordering with M-Pesa payments and real-time confirmations." },
  { step: "04", title: "Track & Deliver", desc: "GPS-enabled delivery tracking from farm to your doorstep." },
];

function HowItWorksSection() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-6">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-emerald font-display font-semibold text-sm uppercase tracking-widest">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
            From farm to table in four simple steps
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.step} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.15 }}
              className="relative">
              <div className="bg-card rounded-2xl p-6 shadow-card h-full border border-border">
                <span className="text-4xl font-display font-bold text-emerald/20">{s.step}</span>
                <h3 className="font-display font-semibold text-foreground mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="hidden lg:block absolute top-1/2 -right-4 w-6 h-6 text-emerald/30 -translate-y-1/2" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for small-scale farmers getting started",
    features: ["Up to 100 listings", "Basic analytics", "M-Pesa payments", "Email support"],
    highlight: false,
  },
  {
    name: "Professional",
    price: "TZS 49,000",
    period: "/mo",
    desc: "For growing farms and active buyers",
    features: ["Unlimited listings", "Advanced analytics", "Priority delivery", "SMS notifications", "Bulk pricing tools", "Phone support"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For large distributors and hotel chains",
    features: ["White-label options", "API access", "Dedicated account manager", "Custom integrations", "SLA guarantee", "Route optimization"],
    highlight: false,
  },
];

function PricingSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-emerald font-display font-semibold text-sm uppercase tracking-widest">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3">
            Plans that grow with your business
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.15 }}
              className={`rounded-2xl p-6 border ${
                plan.highlight
                  ? "bg-primary text-primary-foreground border-emerald shadow-glow relative"
                  : "bg-card text-card-foreground border-border shadow-card"
              }`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
              <div className="mt-3 mb-4">
                <span className="text-3xl font-display font-bold">{plan.price}</span>
                {plan.period && <span className="text-sm opacity-70">{plan.period}</span>}
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {plan.desc}
              </p>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-emerald-light" : "text-emerald"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2.5 rounded-xl font-display font-semibold text-sm transition-colors ${
                plan.highlight
                  ? "bg-emerald text-accent-foreground hover:bg-emerald-light"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}>
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Demo Form ─── */
function DemoSection() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="py-24 bg-hero">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">
              Request a Demo
            </h2>
            <p className="text-primary-foreground/60 mt-3">
              See how Smart Butcher can transform your poultry supply chain.
            </p>
          </motion.div>
          
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-primary-foreground/10 border border-primary-foreground/15 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-emerald rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="font-display font-semibold text-xl text-primary-foreground">Thank you!</h3>
              <p className="text-primary-foreground/60 mt-2">We'll be in touch within 24 hours.</p>
            </motion.div>
          ) : (
            <motion.form {...fadeUp} onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              className="bg-primary-foreground/10 border border-primary-foreground/15 rounded-2xl p-8 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name" required
                  className="bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
                <input type="email" placeholder="Email Address" required
                  className="bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
              </div>
              <input type="tel" placeholder="Phone Number" 
                className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50" />
              <select className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-3 text-sm text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald/50">
                <option value="">I am a...</option>
                <option>Farmer / Supplier</option>
                <option>Restaurant / Hotel</option>
                <option>Distributor</option>
                <option>Other</option>
              </select>
              <textarea placeholder="Tell us about your needs" rows={3}
                className="w-full bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald/50 resize-none" />
              <button type="submit"
                className="w-full bg-emerald text-accent-foreground py-3 rounded-xl font-display font-semibold text-sm hover:bg-emerald-light transition-colors shadow-glow">
                Request Demo
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="bg-navy-dark py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <h3 className="font-display font-bold text-xl text-primary-foreground mb-3">Smart Butcher</h3>
            <p className="text-sm text-primary-foreground/50 leading-relaxed">
              Tanzania's leading poultry marketplace connecting farmers, buyers, and distributors nationwide.
            </p>
          </div>
          {[
            { title: "Platform", links: ["Features", "Pricing", "API Docs", "Security"] },
            { title: "Company", links: ["About Us", "Careers", "Blog", "Press Kit"] },
            { title: "Support", links: ["Help Center", "Contact", "Status", "Community"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-primary-foreground text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-primary-foreground/40 hover:text-emerald transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/30">© 2026 Smart Butcher. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/40">
              <Mail className="w-3.5 h-3.5" /> info@smartbutcher.co.tz
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/40">
              <Phone className="w-3.5 h-3.5" /> +255 123 456 789
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/40">
              <MapPin className="w-3.5 h-3.5" /> Dar es Salaam, TZ
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-navy-dark/80 backdrop-blur-xl border-b border-primary-foreground/5">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-primary-foreground text-lg">Smart Butcher</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Features", "How It Works", "Pricing", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm text-primary-foreground/60 hover:text-emerald transition-colors font-medium">
              {item}
            </a>
          ))}
        </div>
        <button className="bg-emerald text-accent-foreground px-4 py-2 rounded-lg font-display font-semibold text-sm hover:bg-emerald-light transition-colors">
          Get Started
        </button>
      </div>
    </motion.nav>
  );
}

/* ─── Main Page ─── */
export default function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <DemoSection />
      <Footer />
    </div>
  );
}
