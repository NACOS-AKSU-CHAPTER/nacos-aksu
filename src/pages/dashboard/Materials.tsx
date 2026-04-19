import { useEffect, useMemo, useState } from "react";
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
import { Loader2, Plus, Trash2, ExternalLink, FileText } from "lucide-react";
import { uploadFile } from "@/lib/storage";

interface Material {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  external_link: string | null;
  created_at: string;
}
interface Course {
  id: string;
  code: string;
  title: string;
  level: "100" | "200" | "300" | "400";
}

const Materials = () => {
  const { isStaff, user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [myLevel, setMyLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string>("all");

  const [form, setForm] = useState<{ course_id: string; title: string; description: string; external_link: string }>({
    course_id: "",
    title: "",
    description: "",
    external_link: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    document.title = "Materials — Dashboard";
    (async () => {
      if (!isStaff && user) {
        const { data: prof } = await supabase.from("profiles").select("assigned_level").eq("user_id", user.id).maybeSingle();
        setMyLevel(prof?.assigned_level ?? null);
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from("course_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id,code,title,level").order("code"),
    ]);
    setMaterials((m ?? []) as Material[]);
    setCourses((c ?? []) as Course[]);
    setLoading(false);
  };

  const allowedCourses = useMemo(() => {
    if (isStaff) return courses;
    if (myLevel) return courses.filter((c) => c.level === myLevel);
    return [];
  }, [courses, isStaff, myLevel]);

  const visibleMaterials = useMemo(() => {
    let list = materials;
    if (!isStaff) {
      const allowedIds = new Set(allowedCourses.map((c) => c.id));
      list = list.filter((m) => allowedIds.has(m.course_id));
    }
    if (filterCourse !== "all") list = list.filter((m) => m.course_id === filterCourse);
    return list;
  }, [materials, allowedCourses, isStaff, filterCourse]);

  const courseMap = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);

  const save = async () => {
    if (!form.course_id || !form.title) {
      toast.error("Course and title are required");
      return;
    }
    if (!file && !form.external_link) {
      toast.error("Upload a file or paste a link");
      return;
    }
    setBusy(true);
    try {
      let file_url: string | null = null;
      if (file) file_url = await uploadFile("course-materials", file, form.course_id);
      const { error } = await supabase.from("course_materials").insert({
        course_id: form.course_id,
        title: form.title,
        description: form.description || null,
        file_url,
        external_link: form.external_link || null,
        uploaded_by: user?.id,
      });
      if (error) throw error;
      toast.success("Material added");
      setOpen(false);
      setForm({ course_id: "", title: "", description: "", external_link: "" });
      setFile(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    const { error } = await supabase.from("course_materials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold">Course Materials</h1>
          <p className="text-sm text-muted-foreground">
            {isStaff ? "Upload PDFs, slides, or links for any course." : myLevel
              ? `Upload materials for your assigned level (${myLevel}L).`
              : "No level assigned yet — ask an admin to assign you."}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {allowedCourses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(isStaff || (myLevel && allowedCourses.length > 0)) && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="hero"><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add material</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Course *</Label>
                    <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>
                        {allowedCourses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>File (PDF, slides, etc.)</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="text-center text-xs text-muted-foreground">— or —</div>
                  <div>
                    <Label>External link</Label>
                    <Input placeholder="https://..." value={form.external_link} onChange={(e) => setForm({ ...form, external_link: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button variant="hero" onClick={save} disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Upload
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
        <div className="space-y-2">
          {visibleMaterials.map((m) => {
            const c = courseMap[m.course_id];
            return (
              <Card key={m.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-accent-soft text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{m.title}</span>
                      {c && <Badge variant="outline" className="text-[10px]">{c.code} · {c.level}L</Badge>}
                    </div>
                    {m.description && <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(m.file_url || m.external_link) && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={m.file_url ?? m.external_link!} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {visibleMaterials.length === 0 && <p className="text-sm text-muted-foreground">No materials yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Materials;
