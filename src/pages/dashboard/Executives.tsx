import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { uploadFile } from "@/lib/storage";

interface Exec {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  whatsapp: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  term: string | null;
  is_current: boolean;
  display_order: number;
}

const empty: Partial<Exec> = { name: "", role: "", bio: "", is_current: true, display_order: 0 };

const Executives = () => {
  const [items, setItems] = useState<Exec[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Exec>>(empty);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Executives — Dashboard";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("executives")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast.error(error.message);
    else setItems(data as Exec[]);
    setLoading(false);
  };

  const save = async () => {
    if (!editing.name || !editing.role) {
      toast.error("Name and role are required");
      return;
    }
    setBusy(true);
    try {
      let photo_url = editing.photo_url ?? null;
      if (photoFile) photo_url = await uploadFile("executives", photoFile);
      const payload = { ...editing, photo_url } as any;
      if (editing.id) {
        const { error } = await supabase.from("executives").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("executives").insert(payload);
        if (error) throw error;
      }
      toast.success("Saved");
      setOpen(false);
      setEditing(empty);
      setPhotoFile(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this executive?")) return;
    const { error } = await supabase.from("executives").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const openNew = () => {
    setEditing(empty);
    setPhotoFile(null);
    setOpen(true);
  };
  const openEdit = (it: Exec) => {
    setEditing(it);
    setPhotoFile(null);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Executives</h1>
          <p className="text-sm text-muted-foreground">Manage current and past leadership.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add executive
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing.id ? "Edit executive" : "Add executive"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name *</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Input value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea rows={3} value={editing.bio ?? ""} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
              </div>
              <div>
                <Label>Photo</Label>
                <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                {editing.photo_url && !photoFile && (
                  <img src={editing.photo_url} alt="" className="mt-2 h-20 w-20 rounded object-cover" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={editing.whatsapp ?? ""} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} />
                </div>
                <div>
                  <Label>Twitter</Label>
                  <Input value={editing.twitter ?? ""} onChange={(e) => setEditing({ ...editing, twitter: e.target.value })} />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input value={editing.linkedin ?? ""} onChange={(e) => setEditing({ ...editing, linkedin: e.target.value })} />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input value={editing.instagram ?? ""} onChange={(e) => setEditing({ ...editing, instagram: e.target.value })} />
                </div>
                <div>
                  <Label>Term</Label>
                  <Input placeholder="2024/2025" value={editing.term ?? ""} onChange={(e) => setEditing({ ...editing, term: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Display order</Label>
                  <Input
                    type="number"
                    value={editing.display_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={editing.is_current ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, is_current: v })}
                  />
                  <Label>Current exec</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={save} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <Card key={it.id}>
              <CardHeader className="flex-row items-start gap-3 space-y-0">
                {it.photo_url ? (
                  <img src={it.photo_url} alt={it.name} className="h-14 w-14 rounded object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{it.name}</CardTitle>
                  <p className="text-xs text-muted-foreground truncate">{it.role}</p>
                  <Badge variant={it.is_current ? "default" : "secondary"} className="mt-1 text-[10px]">
                    {it.is_current ? "Current" : "Past"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2 pt-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(it)}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(it.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No executives yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Executives;
