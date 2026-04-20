import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/storage";

interface Profile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  position: string | null;
  photo_url: string | null;
  email_public: string | null;
  whatsapp: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  is_approved: boolean;
}

const MyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [positions, setPositions] = useState<{ id: string; label: string }[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [posMode, setPosMode] = useState<"preset" | "custom">("preset");

  useEffect(() => {
    document.title = "My Profile — Dashboard";
    if (user) load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: pos }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("exec_positions").select("id, label").order("display_order"),
    ]);
    setProfile(p as any);
    setPositions((pos ?? []) as any);
    if (p?.position && !(pos ?? []).some((x: any) => x.label === p.position)) setPosMode("custom");
    setLoading(false);
  };

  const save = async () => {
    if (!profile || !user) return;
    setBusy(true);
    try {
      let photo_url = profile.photo_url;
      if (photoFile) photo_url = await uploadFile("avatars", photoFile, user.id);
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          position: profile.position,
          photo_url,
          email_public: profile.email_public,
          whatsapp: profile.whatsapp,
          twitter: profile.twitter,
          linkedin: profile.linkedin,
          instagram: profile.instagram,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile saved");
      setPhotoFile(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const previewUrl = photoFile ? URL.createObjectURL(photoFile) : profile.photo_url;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground">This info appears on the public Executives page once approved.</p>
        </div>
        <Badge variant={profile.is_approved ? "default" : "secondary"}>
          {profile.is_approved ? "Approved — visible publicly" : "Pending admin approval"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Public details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                {(profile.display_name ?? "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <Label>Photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div>
            <Label>Full name</Label>
            <Input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
          </div>

          <div>
            <Label>Position</Label>
            {posMode === "preset" ? (
              <Select
                value={profile.position ?? ""}
                onValueChange={(v) => v === "__other__" ? setPosMode("custom") : setProfile({ ...profile, position: v })}
              >
                <SelectTrigger><SelectValue placeholder="Choose your position" /></SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.label}>{p.label}</SelectItem>
                  ))}
                  <SelectItem value="__other__">Other (type your own)…</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-1">
                <Input placeholder="e.g. Welfare Assistant" value={profile.position ?? ""} onChange={(e) => setProfile({ ...profile, position: e.target.value })} />
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline" onClick={() => setPosMode("preset")}>← Pick from preset list</button>
              </div>
            )}
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea rows={4} placeholder="A short description of what you do…" value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Public email</Label>
              <Input placeholder="you@example.com" value={profile.email_public ?? ""} onChange={(e) => setProfile({ ...profile, email_public: e.target.value })} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input placeholder="+234…" value={profile.whatsapp ?? ""} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} />
            </div>
            <div>
              <Label>Twitter / X</Label>
              <Input placeholder="https://x.com/handle" value={profile.twitter ?? ""} onChange={(e) => setProfile({ ...profile, twitter: e.target.value })} />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input placeholder="https://linkedin.com/in/…" value={profile.linkedin ?? ""} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Instagram</Label>
              <Input placeholder="https://instagram.com/handle" value={profile.instagram ?? ""} onChange={(e) => setProfile({ ...profile, instagram: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="hero" onClick={save} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProfile;
