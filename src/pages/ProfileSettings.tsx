import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Save, User, Shield, CheckCircle, Clock, XCircle, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const KYC_STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Not Submitted", icon: Clock, color: "text-muted-foreground" },
  submitted: { label: "Under Review", icon: Clock, color: "text-amber-600" },
  verified: { label: "Verified", icon: CheckCircle, color: "text-emerald" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-destructive" },
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

  // KYC fields (distributor only)
  const [licenseNumber, setLicenseNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [licenseImageUrl, setLicenseImageUrl] = useState("");
  const [kycStatus, setKycStatus] = useState("pending");
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const licenseFileRef = useRef<HTMLInputElement>(null);

  // Fetch KYC data for distributors
  useEffect(() => {
    if (role === "distributor" && user) {
      supabase
        .from("profiles")
        .select("license_number, id_number, license_image_url, kyc_status")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setLicenseNumber((data as any).license_number || "");
            setIdNumber((data as any).id_number || "");
            setLicenseImageUrl((data as any).license_image_url || "");
            setKycStatus((data as any).kyc_status || "pending");
          }
        });
    }
  }, [role, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
    toast.success("Avatar uploaded");
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please select an image or PDF file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setUploadingLicense(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/license.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploadingLicense(false);
      return;
    }

    const { data } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    setLicenseImageUrl(data.publicUrl);
    setUploadingLicense(false);
    toast.success("License document uploaded");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const updates: any = {
      full_name: fullName,
      phone,
      location,
      avatar_url: avatarUrl || null,
    };

    // Include KYC fields for distributors
    if (role === "distributor") {
      updates.license_number = licenseNumber || null;
      updates.id_number = idNumber || null;
      updates.license_image_url = licenseImageUrl || null;
      // Auto-submit KYC if all fields are filled
      if (licenseNumber && idNumber && licenseImageUrl && kycStatus === "pending") {
        updates.kyc_status = "submitted";
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (role === "distributor" && licenseNumber && idNumber && licenseImageUrl && kycStatus === "pending") {
      setKycStatus("submitted");
    }
    toast.success("Profile updated successfully");
  };

  const kycConfig = KYC_STATUS_CONFIG[kycStatus] || KYC_STATUS_CONFIG.pending;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Profile Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-xs text-muted-foreground">Click camera icon to upload (max 2MB)</p>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role:</span>
          <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full capitalize font-medium">
            {role || "—"}
          </span>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+255 XXX XXX XXX"
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Region"
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        {/* KYC Section - Distributor Only */}
        {role === "distributor" && (
          <div className="border border-border rounded-xl p-5 space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" />
                <h3 className="font-display font-semibold text-foreground">KYC Verification</h3>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted ${kycConfig.color}`}>
                <kycConfig.icon className="w-3 h-3" />
                {kycConfig.label}
              </span>
            </div>

            {kycStatus === "verified" ? (
              <div className="flex items-center gap-2 text-emerald bg-emerald/10 rounded-lg p-3">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-medium">Your identity has been verified. You can accept deliveries.</p>
              </div>
            ) : (
              <>
                {kycStatus === "rejected" && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg p-3">
                    <XCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">Verification was rejected. Please re-submit with correct documents.</p>
                  </div>
                )}

                {kycStatus === "submitted" && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3">
                    <Clock className="w-5 h-5" />
                    <p className="text-sm font-medium">Your documents are under review. This usually takes 1-2 business days.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">National ID Number</label>
                  <input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 19901234-12345-00001-23"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Driving License Number</label>
                  <input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-123456789"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">License Document</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => licenseFileRef.current?.click()}
                      disabled={uploadingLicense}
                      className="flex items-center gap-2 bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors"
                    >
                      {uploadingLicense ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {licenseImageUrl ? "Replace File" : "Upload License"}
                    </button>
                    {licenseImageUrl && (
                      <span className="text-xs text-emerald flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>
                  <input ref={licenseFileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleLicenseUpload} />
                  <p className="text-[10px] text-muted-foreground mt-1">Upload a photo or scan of your driving license (max 5MB)</p>
                </div>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
