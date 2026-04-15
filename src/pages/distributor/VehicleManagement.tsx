import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Truck, Navigation, DollarSign, MessageSquare, Car, Settings, Plus, Pencil, Trash2, X, Loader2, FileText, Upload, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { title: "Deliveries", url: "/dashboard/distributor", icon: Truck },
  { title: "Route Map", url: "/dashboard/distributor/routes", icon: Navigation },
  { title: "Earnings", url: "/dashboard/distributor/earnings", icon: DollarSign },
  { title: "Messages", url: "/dashboard/distributor/messages", icon: MessageSquare },
  { title: "Vehicles", url: "/dashboard/distributor/vehicles", icon: Car },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const VEHICLE_DOC_TYPES = [
  { value: "registration", label: "Vehicle Registration" },
  { value: "insurance", label: "Insurance Certificate" },
  { value: "roadworthiness", label: "Roadworthiness Certificate" },
];

const KYC_BADGE: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: ShieldAlert },
  verified: { label: "Verified", color: "bg-emerald/10 text-emerald", icon: ShieldCheck },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: ShieldX },
};

function VehicleKycPanel({ vehicle, distributorId, onClose }: { vehicle: any; distributorId: string; onClose: () => void }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    const { data } = await supabase.from("vehicle_kyc_documents" as any).select("*").eq("vehicle_id", vehicle.id);
    setDocs(data || []);
    setLoading(false);
  };

  const handleUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setUploadingDoc(docType);
    const ext = file.name.split(".").pop();
    const path = `vehicle-kyc/${vehicle.id}/${docType}.${ext}`;
    const { error: upErr } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Upload failed: " + upErr.message); setUploadingDoc(null); return; }
    const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    const existing = docs.find(d => d.doc_type === docType);
    if (existing) {
      await supabase.from("vehicle_kyc_documents" as any).update({ doc_url: urlData.publicUrl, status: "pending", admin_note: null, reviewed_at: null }).eq("id", existing.id);
    } else {
      await supabase.from("vehicle_kyc_documents" as any).insert({ vehicle_id: vehicle.id, distributor_id: distributorId, doc_type: docType, doc_url: urlData.publicUrl });
    }
    // Reset vehicle kyc_status to pending if rejected
    if (vehicle.kyc_status === "rejected") {
      await supabase.from("vehicles").update({ kyc_status: "pending" }).eq("id", vehicle.id);
    }
    toast.success(`${docType.replace(/_/g, " ")} uploaded — pending review`);
    setUploadingDoc(null);
    fetchDocs();
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-elevated" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-display font-semibold text-foreground">Vehicle KYC — {vehicle.vehicle_name}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Upload all required documents. Vehicle can only be used for deliveries once all docs are verified.</p>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            {VEHICLE_DOC_TYPES.map(dt => {
              const doc = docs.find(d => d.doc_type === dt.value);
              const isUploading = uploadingDoc === dt.value;
              const badge = doc ? KYC_BADGE[doc.status as string] : null;
              const BadgeIcon = badge?.icon;
              return (
                <div key={dt.value} className="flex items-center justify-between gap-3 bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{dt.label}</p>
                      {doc ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          {BadgeIcon && <BadgeIcon className={`w-3 h-3 ${badge?.color.split(" ")[1]}`} />}
                          <span className={`text-xs font-medium ${badge?.color.split(" ")[1]}`}>{badge?.label}</span>
                          {doc.admin_note && <span className="text-xs text-muted-foreground">— {doc.admin_note}</span>}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not uploaded</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <input ref={el => { fileRefs.current[dt.value] = el; }} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleUpload(dt.value, e)} />
                    <button onClick={() => fileRefs.current[dt.value]?.click()} disabled={isUploading}
                      className="flex items-center gap-1 bg-card border border-border text-foreground px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
                      {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      {doc ? "Re-upload" : "Upload"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehicleManagement() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [kycVehicle, setKycVehicle] = useState<any>(null);
  const [form, setForm] = useState({ vehicle_name: "", plate_number: "", vehicle_type: "motorcycle", capacity_kg: "" });

  useEffect(() => { if (user) fetchVehicles(); }, [user]);

  const fetchVehicles = async () => {
    const { data } = await supabase.from("vehicles").select("*").eq("distributor_id", user!.id).order("created_at", { ascending: false });
    setVehicles(data || []);
    setLoading(false);
  };

  const resetForm = () => { setForm({ vehicle_name: "", plate_number: "", vehicle_type: "motorcycle", capacity_kg: "" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = { ...form, capacity_kg: Number(form.capacity_kg) || 0, distributor_id: user.id };
    if (editing) {
      const { error } = await supabase.from("vehicles").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Vehicle updated");
    } else {
      const { error } = await supabase.from("vehicles").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Vehicle added — upload KYC documents to activate it");
    }
    resetForm();
    fetchVehicles();
  };

  const handleEdit = (v: any) => {
    setForm({ vehicle_name: v.vehicle_name, plate_number: v.plate_number, vehicle_type: v.vehicle_type, capacity_kg: String(v.capacity_kg) });
    setEditing(v);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vehicle?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Vehicle deleted");
    fetchVehicles();
  };

  const toggleActive = async (v: any) => {
    if (v.kyc_status !== "verified") {
      toast.error("Vehicle KYC must be verified before activating");
      return;
    }
    const { error } = await supabase.from("vehicles").update({ is_active: !v.is_active }).eq("id", v.id);
    if (error) { toast.error(error.message); return; }
    fetchVehicles();
  };

  if (loading) return (
    <DashboardLayout navItems={navItems} title="Distributor Dashboard">
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={navItems} title="Distributor Dashboard">
      {kycVehicle && <VehicleKycPanel vehicle={kycVehicle} distributorId={user!.id} onClose={() => { setKycVehicle(null); fetchVehicles(); }} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-foreground">Vehicle Management</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">{editing ? "Edit Vehicle" : "Add Vehicle"}</h3>
              <button onClick={resetForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.vehicle_name} onChange={e => setForm(f => ({ ...f, vehicle_name: e.target.value }))} placeholder="Vehicle Name" required
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
              <input value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} placeholder="Plate Number" required
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
              <select value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                <option value="motorcycle">Motorcycle</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="truck">Truck</option>
              </select>
              <input type="number" value={form.capacity_kg} onChange={e => setForm(f => ({ ...f, capacity_kg: e.target.value }))} placeholder="Capacity (kg)"
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
              <button type="submit" className="sm:col-span-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                {editing ? "Update" : "Add"} Vehicle
              </button>
            </form>
          </div>
        )}

        {vehicles.length === 0 && !showForm ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
            <Car className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No vehicles registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => {
              const kycBadge = KYC_BADGE[v.kyc_status || "pending"];
              const KycIcon = kycBadge.icon;
              return (
                <div key={v.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-semibold text-foreground">{v.vehicle_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.plate_number} • {v.vehicle_type}</p>
                    </div>
                    <button onClick={() => toggleActive(v)}
                      className={`text-xs px-2 py-0.5 rounded-full ${v.is_active ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}>
                      {v.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Capacity: {v.capacity_kg} kg</p>

                  {/* KYC status */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <KycIcon className={`w-3.5 h-3.5 ${kycBadge.color.split(" ")[1]}`} />
                    <span className={`text-xs font-medium ${kycBadge.color.split(" ")[1]}`}>KYC: {kycBadge.label}</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setKycVehicle(v)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors">
                      <FileText className="w-3.5 h-3.5" /> KYC Docs
                    </button>
                    <button onClick={() => handleEdit(v)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
