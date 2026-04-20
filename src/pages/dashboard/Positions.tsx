import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Position { id: string; label: string; display_order: number }

const Positions = () => {
  const [items, setItems] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Positions — Dashboard";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exec_positions")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Position[]);
    setLoading(false);
  };

  const add = async () => {
    if (!newLabel.trim()) return;
    setBusy(true);
    const order = items.length ? Math.max(...items.map((i) => i.display_order)) + 1 : 1;
    const { error } = await supabase.from("exec_positions").insert({ label: newLabel.trim(), display_order: order });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Added");
      setNewLabel("");
      load();
    }
  };

  const updateLabel = async (id: string, label: string) => {
    const { error } = await supabase.from("exec_positions").update({ label }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const updateOrder = async (id: string, display_order: number) => {
    const { error } = await supabase.from("exec_positions").update({ display_order }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this position?")) return;
    const { error } = await supabase.from("exec_positions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Executive Positions</h1>
        <p className="text-sm text-muted-foreground">Manage the dropdown of positions users can choose during signup.</p>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-2">
          <Input placeholder="New position (e.g. Treasurer)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button variant="hero" onClick={add} disabled={busy || !newLabel.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center gap-2">
                <Input
                  className="w-20"
                  type="number"
                  defaultValue={p.display_order}
                  onBlur={(e) => updateOrder(p.id, Number(e.target.value))}
                />
                <Input
                  defaultValue={p.label}
                  onBlur={(e) => e.target.value !== p.label && updateLabel(p.id, e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={() => remove(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No positions yet — add one above.</p>}
        </div>
      )}
    </div>
  );
};

export default Positions;
