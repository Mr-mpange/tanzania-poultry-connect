import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Save, User, ShieldCheck, ShieldAlert, ShieldX, Upload, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const USER_DOC_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "business_license", label: "Business License" },
  { value: "tax_certificate", label: "Tax Certificate" },
];

const KYC_BADGE: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending Review", color: "bg-amber-100 text-amber-700", icon: ShieldAlert },
  verified: { label: "Verified", color: "bg-emerald/10 text-emerald", icon: ShieldCheck },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: ShieldX },
};

export default function ProfileSettings() {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // KYC documents
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const docFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Distributor-specific KYC fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [licenseImageUrl, setLicenseImageUrl] = useState("");
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const licenseFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchKycDocs();
      if (role === "distributor") {
        supabase.from("profiles").select("license_number, id_number, license_image_url").eq("user_id", user.id).single()
          .then(({ data }) => {
            if (data) {
              setLicenseNumber((data as any).license_number || "");
              setIdNumber((data as any).id_number || "");
              setLicenseImageUrl((data as any).license_image_url || "");
            }
          });
      }
    }
  }, [user, role]);

  const fetchKycDocs = async () => {
    const { data } = await supabase.from("kyc_documents" as any).select("*").eq("user_id", user!.id);
    setKycDocs(data || []);
    setKycLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Upload failed: " + uploadError.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
    toast.success("Avatar uploaded");
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setUploadingLicense(true);
    const ext = file.name.split(".").pop();
    const path = `licenses/${user.id}/license.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploadingLicense(false); return; }
    const { data } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    setLicenseImageUrl(data.publicUrl);
    setUploadingLicense(false);
    toast.success("License uploaded");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const updates: any = { full_name: fullName, phone, location, avatar_url: avatarUrl || null };
    if (role === "distributor") {
      updates.license_number = licenseNumber || null;
      updates.id_number = idNumber || null;
      updates.license_image_url = licenseImageUrl || null;
    }
    const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated successfully");
  };

  const handleDocUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setUploadingDoc(docType);
    const ext = file.name.split(".").pop();
    const path = `kyc/${user.id}/${docType}.${ext}`;
    const { error: upErr } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Upload failed: " + upErr.message); setUploadingDoc(null); return; }
    const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    const existing = kycDocs.find(d => d.doc_type === docType);
    if (existing) {
      await supabase.from("kyc_documents" as any).update({ doc_url: urlData.publicUrl, status: "pending", admin_note: null, reviewed_at: null }).eq("id", existing.id);
    } else {
      await supabase.from("kyc_documents" as any).insert({ user_id: user.id, doc_type: docType, doc_url: urlData.publicUrl });
    }
    if (profile?.kyc_status === "rejected") {
      await supabase.from("profiles").update({ kyc_status: "pending" }).eq("user_id", user.id);
    }
    toast.success(`${docType.replace(/_/g, " ")} uploaded — pending review`);
    setUploadingDoc(null);
    fetchKycDocs();
  };

  const kycStatus = profile?.kyc_status || "pending";
  const badge = KYC_BADGE[kycStatus] || KYC_BADGE.pending;
  const BadgeIcon = badge.icon;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Profile Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-muted-foreground" />}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-xs text-muted-foreground">Click camera icon to upload (max 2MB)</p>
        </div>

        {/* Role + KYC status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full capitalize font-medium">{role || "—"}</span>
          <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${badge.color}`}>
            <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input value={user?.email || ""} disabled className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 XXX XXX XXX" className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Region" className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
        </div>

        {/* Distributor license fields */}
        {role === "distributor" && (
          <div className="border border-border rounded-xl p-5 space-y-4 bg-card">
            <h3 className="font-display font-semibold text-foreground">Distributor Details</h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">National ID Number</label>
              <input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="e.g. 19901234-12345-00001-23"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Driving License Number</label>
              <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="e.g. DL-123456789"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">License Document</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => licenseFileRef.current?.click()} disabled={uploadingLicense}
                  className="flex items-center gap-2 bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors">
                  {uploadingLicense ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {licenseImageUrl ? "Replace File" : "Upload License"}
                </button>
                {licenseImageUrl && <span className="text-xs text-emerald flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Uploaded</span>}
              </div>
              <input ref={licenseFileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleLicenseUpload} />
              <p className="text-[10px] text-muted-foreground mt-1">Upload a photo or scan of your driving license (max 5MB)</p>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* KYC Documents */}
      <div className="mt-8">
        <h2 className="font-display font-semibold text-lg text-foreground mb-1">KYC Documents</h2>
        <p className="text-xs text-muted-foreground mb-4">Upload required documents for account verification. All documents must be verified before you can use the platform.</p>

        {kycLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            {USER_DOC_TYPES.map(dt => {
              const doc = kycDocs.find(d => d.doc_type === dt.value);
              const isUploading = uploadingDoc === dt.value;
              const docBadge = doc ? KYC_BADGE[doc.status as string] : null;
              const DocBadgeIcon = docBadge?.icon;
              return (
                <div key={dt.value} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{dt.label}</p>
                      {doc ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {DocBadgeIcon && <DocBadgeIcon className={`w-3 h-3 ${docBadge?.color.split(" ")[1]}`} />}
                          <span className={`text-xs font-medium ${docBadge?.color.split(" ")[1]}`}>{docBadge?.label}</span>
                          {doc.admin_note && <span className="text-xs text-muted-foreground">— {doc.admin_note}</span>}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">Not uploaded</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <input ref={el => { docFileRefs.current[dt.value] = el; }} type="file" accept="image/*,.pdf" className="hidden"
                      onChange={e => handleDocUpload(dt.value, e)} />
                    <button onClick={() => docFileRefs.current[dt.value]?.click()} disabled={isUploading}
                      className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
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
