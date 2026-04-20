import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  units: number;
  level: "100" | "200" | "300" | "400";
  semester: "first" | "second";
}

const empty: Partial<Course> = { code: "", title: "", units: 3, level: "100", semester: "first" };

const Courses = () => {
  const { isStaff, isCourseRep, assignedLevel } = useAuth();
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Course>>(empty);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const canEdit = isStaff; // Only staff can add/edit/delete courses
  const canView = isStaff || isCourseRep;

  useEffect(() => {
    document.title = "Courses — Dashboard";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("courses").select("*").order("code");
    if (error) toast.error(error.message);
    else setItems(data as Course[]);
    setLoading(false);
  };

  const save = async () => {
    if (!editing.code || !editing.title) {
      toast.error("Code and title are required");
      return;
    }
    setBusy(true);
    try {
      const payload = { ...editing } as any;
      if (editing.id) {
        const { error } = await supabase.from("courses").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
      }
      toast.success("Saved");
      setOpen(false);
      setEditing(empty);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this course and all its materials?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.level === filter);

  // Course reps only see their assigned level
  const visible = isCourseRep && assignedLevel && !isStaff
    ? filtered.filter((i) => i.level === assignedLevel)
    : filtered;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {isStaff
              ? "Manage courses by level."
              : isCourseRep && assignedLevel
                ? `View courses for your level (${assignedLevel}L).`
                : "View available courses."}
          </p>
        </div>
        <div className="flex gap-2">
          {isStaff && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="100">100 Level</SelectItem>
                <SelectItem value="200">200 Level</SelectItem>
                <SelectItem value="300">300 Level</SelectItem>
                <SelectItem value="400">400 Level</SelectItem>
              </SelectContent>
            </Select>
          )}
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" onClick={() => { setEditing(empty); setOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing.id ? "Edit course" : "Add course"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Code *</Label>
                      <Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                      <Label>Units</Label>
                      <Input type="number" value={editing.units ?? 3} onChange={(e) => setEditing({ ...editing, units: Number(e.target.value) })} />
                    </div>
                  </div>
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
                      <Label>Level</Label>
                      <Select value={editing.level} onValueChange={(v: any) => setEditing({ ...editing, level: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="300">300</SelectItem>
                          <SelectItem value="400">400</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Semester</Label>
                      <Select value={editing.semester} onValueChange={(v: any) => setEditing({ ...editing, semester: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first">First</SelectItem>
                          <SelectItem value="second">Second</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.level}L</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                    <Badge variant="secondary" className="text-[10px]">{c.units} units</Badge>
                  </div>
                  <h3 className="font-semibold mt-1 truncate">{c.title}</h3>
                  {c.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</p>}
                </div>
                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {visible.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No courses yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Courses;
