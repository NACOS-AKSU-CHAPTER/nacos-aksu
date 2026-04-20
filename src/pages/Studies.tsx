import { useEffect, useState } from "react";
import { Search, FileText, Download, BookOpen, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  description: string | null;
  level: "100" | "200" | "300" | "400";
}
interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  external_link: string | null;
}

const LEVELS = ["100", "200", "300", "400"] as const;

const Studies = () => {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [openCourse, setOpenCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matLoading, setMatLoading] = useState(false);

  useEffect(() => {
    document.title = "Studies Hub — NACOS AKSU";
    (async () => {
      const { data: c } = await supabase.from("courses").select("id, code, title, units, description, level").order("code");
      const list = (c ?? []) as Course[];
      setCourses(list);
      const entries = await Promise.all(
        list.map((co) =>
          supabase
            .from("course_materials")
            .select("id", { count: "exact", head: true })
            .eq("course_id", co.id)
            .then((r) => [co.id, r.count ?? 0] as const),
        ),
      );
      setCounts(Object.fromEntries(entries));
      setLoading(false);
    })();
  }, []);

  const openMaterials = async (c: Course) => {
    setOpenCourse(c);
    setMatLoading(true);
    const { data } = await supabase
      .from("course_materials")
      .select("id, title, description, file_url, external_link")
      .eq("course_id", c.id)
      .order("created_at", { ascending: false });
    setMaterials((data ?? []) as Material[]);
    setMatLoading(false);
  };

  const filterCourses = (level: string) =>
    courses
      .filter((c) => c.level === level)
      .filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.title.toLowerCase().includes(query.toLowerCase()),
      );

  return (
    <>
      <PageHeader
        eyebrow="Studies Hub"
        title="Courses & materials, organized by level."
        description="Find every course offered in our department, browse descriptions, and download materials shared by your peers and lecturers."
      />

      <section className="py-12 md:py-16">
        <div className="container mx-auto container-px">
          <div className="relative max-w-xl mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by course code or title..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 h-12" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : courses.length === 0 ? (
            <Card className="p-10 text-center border-dashed text-muted-foreground">No courses listed yet.</Card>
          ) : (
            <Tabs defaultValue="100" className="w-full">
              <TabsList className="h-auto p-1 bg-secondary flex flex-wrap">
                {LEVELS.map((l) => (
                  <TabsTrigger key={l} value={l} className="flex-1 min-w-[80px] data-[state=active]:bg-background">{l} Level</TabsTrigger>
                ))}
              </TabsList>

              {LEVELS.map((l) => {
                const filtered = filterCourses(l);
                return (
                  <TabsContent key={l} value={l} className="mt-8">
                    {filtered.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        {courses.some((c) => c.level === l) ? "No courses match your search." : "No courses for this level yet."}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((c) => (
                          <Card key={c.id} className="p-6 border-border shadow-card-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth flex flex-col">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0"><BookOpen className="h-5 w-5" /></div>
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{c.units} units</span>
                            </div>
                            <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">{c.code}</div>
                            <h3 className="font-display font-semibold text-lg leading-snug mb-2">{c.title}</h3>
                            {c.description && <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1 line-clamp-3">{c.description}</p>}
                            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                              <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" /> {counts[c.id] ?? 0} materials
                              </span>
                              <Button variant="ghost" size="sm" className="h-8" onClick={() => openMaterials(c)}>
                                <Download className="h-3.5 w-3.5" /> View
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </section>

      <Dialog open={!!openCourse} onOpenChange={(v) => !v && setOpenCourse(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <div className="mb-3">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider">{openCourse?.code}</p>
            <h2 className="font-display text-xl font-bold">{openCourse?.title}</h2>
            {openCourse?.description && <p className="text-sm text-muted-foreground mt-1">{openCourse.description}</p>}
          </div>
          {matLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : materials.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No materials uploaded yet for this course.</p>
          ) : (
            <ul className="space-y-2">
              {materials.map((m) => (
                <li key={m.id} className="p-3 border rounded-lg flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.title}</p>
                    {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {m.file_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={m.file_url} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /> File</a>
                      </Button>
                    )}
                    {m.external_link && (
                      <Button asChild size="sm" variant="outline">
                        <a href={m.external_link} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Link</a>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Studies;
