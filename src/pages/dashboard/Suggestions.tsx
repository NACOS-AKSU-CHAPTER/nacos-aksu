import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Loader2, Trash2 } from "lucide-react";

interface Suggestion {
  id: string;
  message: string;
  category: string | null;
  is_read: boolean;
  created_at: string;
}

const Suggestions = () => {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Suggestions — Dashboard"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("suggestions").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Suggestion[]);
    setLoading(false);
  };

  const markRead = async (id: string, is_read: boolean) => {
    const { error } = await supabase.from("suggestions").update({ is_read }).eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this suggestion?")) return;
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Anonymous Suggestions</h1>
        <p className="text-sm text-muted-foreground">Submissions from the public Suggestion Box.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Card key={s.id} className={s.is_read ? "opacity-70" : ""}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {s.category && <Badge variant="outline" className="text-[10px]">{s.category}</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</span>
                    {!s.is_read && <Badge className="text-[10px]">New</Badge>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{s.message}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => markRead(s.id, !s.is_read)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No suggestions yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Suggestions;
