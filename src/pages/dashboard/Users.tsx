import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  assigned_level: string | null;
  created_at: string;
}
interface RoleRow {
  user_id: string;
  role: AppRole;
}

const ROLES: AppRole[] = ["admin", "exec", "course_rep"];

const Users = () => {
  const { user: me } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Users — Dashboard"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, assigned_level, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((p ?? []) as ProfileRow[]);
    setRoles((r ?? []) as RoleRow[]);
    setLoading(false);
  };

  const userRoles = (uid: string) => roles.filter((r) => r.user_id === uid).map((r) => r.role);

  const addRole = async (uid: string, role: AppRole) => {
    if (userRoles(uid).includes(role)) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) toast.error(error.message); else { toast.success(`Granted ${role}`); load(); }
  };

  const removeRole = async (uid: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    if (error) toast.error(error.message); else { toast.success(`Removed ${role}`); load(); }
  };

  const setLevel = async (uid: string, level: string) => {
    const { error } = await supabase.from("profiles").update({ assigned_level: level === "none" ? null : (level as any) }).eq("user_id", uid);
    if (error) toast.error(error.message); else { toast.success("Level updated"); load(); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">Promote users to admin / exec / course rep and assign levels.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const ur = userRoles(p.user_id);
            const isMe = p.user_id === me?.id;
            return (
              <Card key={p.user_id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{p.display_name || "(no name)"}</span>
                    {isMe && <Badge variant="outline" className="text-[10px]">You</Badge>}
                    {ur.length === 0 && <Badge variant="secondary" className="text-[10px]">No role</Badge>}
                    {ur.map((r) => (
                      <Badge key={r} className="text-[10px]">
                        {r}
                        {!(isMe && r === "admin") && (
                          <button className="ml-1 opacity-70 hover:opacity-100" onClick={() => removeRole(p.user_id, r)}>
                            <Trash2 className="h-3 w-3 inline" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    {ROLES.filter((r) => !ur.includes(r)).map((r) => (
                      <Button key={r} size="sm" variant="outline" onClick={() => addRole(p.user_id, r)}>+ {r}</Button>
                    ))}
                    {ur.includes("course_rep") && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Level:</span>
                        <Select value={p.assigned_level ?? "none"} onValueChange={(v) => setLevel(p.user_id, v)}>
                          <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                            <SelectItem value="300">300</SelectItem>
                            <SelectItem value="400">400</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Users;
