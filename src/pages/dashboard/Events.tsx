import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { uploadFile } from "@/lib/storage";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string | null;
  cover_url: string | null;
  register_link: string | null;
  is_published: boolean;
}

const empty: Partial<Event> = { title: "", event_date: new Date().toISOString().slice(0, 16), is_published: true };

const Events = () => {
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Event>>(empty);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Events — Dashboard"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    if (error) toast.error(error.message);
    else setItems(data as Event[]);
    setLoading(false);
  };

  const save = async () => {
    if (!editing.title || !editing.event_date) { toast.error("Title and date required"); return; }
    setBusy(true);
    try {
      let cover_url = editing.cover_url ?? null;
      if (coverFile) cover_url = await uploadFile("events", coverFile);
      const payload = { ...editing, cover_url, event_date: new Date(editing.event_date as string).toISOString() } as any;
      if (editing.id) {
        const { error } = await supabase.from("events").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }
      toast.success("Saved");
      setOpen(false); setEditing(empty); setCoverFile(null);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const openEdit = (it: Event) => {
    setEditing({ ...it, event_date: new Date(it.event_date).toISOString().slice(0, 16) });
    setCoverFile(null);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">Manage upcoming and past events.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditing(empty); setCoverFile(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? "Edit event" : "Add event"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date & time *</Label>
                  <Input type="datetime-local" value={editing.event_date as string ?? ""} onChange={(e) => setEditing({ ...editing, event_date: e.target.value })} />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input value={editing.venue ?? ""} onChange={(e) => setEditing({ ...editing, venue: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Register link</Label>
                <Input placeholder="https://..." value={editing.register_link ?? ""} onChange={(e) => setEditing({ ...editing, register_link: e.target.value })} />
              </div>
              <div>
                <Label>Cover image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                {editing.cover_url && !coverFile && <img src={editing.cover_url} alt="" className="mt-2 h-20 rounded object-cover" />}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_published ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                <Label>Published</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={save} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id}>
              <CardContent className="p-3 flex items-center gap-3">
                {it.cover_url ? (
                  <img src={it.cover_url} alt="" className="h-12 w-16 rounded object-cover shrink-0" />
                ) : <div className="h-12 w-16 rounded bg-muted shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{it.title}</span>
                    {!it.is_published && <Badge variant="secondary" className="text-[10px]">Draft</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(it.event_date).toLocaleString()} {it.venue && `· ${it.venue}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Events;
