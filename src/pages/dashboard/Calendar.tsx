import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

interface CalEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  category: string;
}

const empty: Partial<CalEvent> = { title: "", start_date: new Date().toISOString().slice(0, 10), category: "general" };

const Calendar = () => {
  const [items, setItems] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CalEvent>>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Calendar — Dashboard"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("calendar_events").select("*").order("start_date");
    setItems((data ?? []) as CalEvent[]);
    setLoading(false);
  };

  const save = async () => {
    if (!editing.title || !editing.start_date) { toast.error("Title and date required"); return; }
    setBusy(true);
    try {
      const payload = { ...editing } as any;
      if (editing.id) {
        const { error } = await supabase.from("calendar_events").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("calendar_events").insert(payload);
        if (error) throw error;
      }
      toast.success("Saved");
      setOpen(false); setEditing(empty);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Academic Calendar</h1>
          <p className="text-sm text-muted-foreground">Exam weeks, key dates, event days.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditing(empty); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Edit entry" : "Add entry"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start date *</Label>
                  <Input type="date" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>End date</Label>
                  <Input type="date" value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                  </SelectContent>
                </Select>
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
          {items.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] capitalize">{e.category}</Badge>
                    <span className="font-medium truncate">{e.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.start_date).toLocaleDateString()}
                    {e.end_date && ` → ${new Date(e.end_date).toLocaleDateString()}`}
                  </p>
                  {e.description && <p className="text-xs text-muted-foreground line-clamp-1">{e.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Calendar;
