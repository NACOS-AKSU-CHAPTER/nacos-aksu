import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Loader2, Mail, Trash2 } from "lucide-react";

interface Signup {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  matric_number: string | null;
  level: string | null;
  message: string | null;
  is_processed: boolean;
  created_at: string;
}

const Signups = () => {
  const [items, setItems] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Signups — Dashboard"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("membership_signups").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Signup[]);
    setLoading(false);
  };

  const toggle = async (id: string, v: boolean) => {
    const { error } = await supabase.from("membership_signups").update({ is_processed: v }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this signup?")) return;
    const { error } = await supabase.from("membership_signups").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Membership Signups</h1>
        <p className="text-sm text-muted-foreground">Students who want to join NACOS.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Card key={s.id} className={s.is_processed ? "opacity-70" : ""}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{s.full_name}</span>
                    {s.level && <Badge variant="outline" className="text-[10px]">{s.level}L</Badge>}
                    {s.is_processed && <Badge variant="secondary" className="text-[10px]">Processed</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <a className="hover:underline" href={`mailto:${s.email}`}>{s.email}</a>
                    {s.phone && ` · ${s.phone}`}
                    {s.matric_number && ` · ${s.matric_number}`}
                  </p>
                  {s.message && <p className="text-sm mt-1 whitespace-pre-wrap">{s.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(s.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" asChild><a href={`mailto:${s.email}`}><Mail className="h-4 w-4" /></a></Button>
                  <Button size="icon" variant="ghost" onClick={() => toggle(s.id, !s.is_processed)}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No signups yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Signups;
