import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your name").max(100);
const positionSchema = z.string().trim().min(2, "Choose or enter a position").max(80);

interface Position { id: string; label: string }

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [posMode, setPosMode] = useState<"preset" | "custom">("preset");

  const [li, setLi] = useState({ email: "", password: "" });
  const [su, setSu] = useState({ name: "", email: "", password: "", position: "", customPosition: "" });

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = "Sign in — NACOS AKSU";
    supabase
      .from("exec_positions")
      .select("id, label")
      .order("display_order", { ascending: true })
      .then(({ data }) => setPositions((data ?? []) as Position[]));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      emailSchema.parse(li.email);
      passwordSchema.parse(li.password);
      const { error } = await supabase.auth.signInWithPassword({ email: li.email, password: li.password });
      if (error) throw error;
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const finalPosition = posMode === "preset" ? su.position : su.customPosition;
      nameSchema.parse(su.name);
      emailSchema.parse(su.email);
      passwordSchema.parse(su.password);
      positionSchema.parse(finalPosition);

      const { error } = await supabase.auth.signUp({
        email: su.email,
        password: su.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { display_name: su.name, position: finalPosition },
        },
      });
      if (error) throw error;
      toast.success("Account created — pending admin approval");
      const { error: e2 } = await supabase.auth.signInWithPassword({ email: su.email, password: su.password });
      if (e2) throw e2;
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 gradient-soft">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to site</Link>
        </div>
        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle>NACOS AKSU</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="li-email">Email</Label>
                    <Input id="li-email" type="email" required value={li.email} onChange={(e) => setLi({ ...li, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="li-password">Password</Label>
                    <Input id="li-password" type="password" required value={li.password} onChange={(e) => setLi({ ...li, password: e.target.value })} />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" required value={su.name} onChange={(e) => setSu({ ...su, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" required value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" type="password" required minLength={8} value={su.password} onChange={(e) => setSu({ ...su, password: e.target.value })} />
                    <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    {posMode === "preset" ? (
                      <Select value={su.position} onValueChange={(v) => v === "__other__" ? setPosMode("custom") : setSu({ ...su, position: v })}>
                        <SelectTrigger><SelectValue placeholder="Choose your position" /></SelectTrigger>
                        <SelectContent>
                          {positions.map((p) => (
                            <SelectItem key={p.id} value={p.label}>{p.label}</SelectItem>
                          ))}
                          <SelectItem value="__other__">Other (type your own)…</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-1">
                        <Input placeholder="e.g. Welfare Assistant" value={su.customPosition} onChange={(e) => setSu({ ...su, customPosition: e.target.value })} />
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline" onClick={() => setPosMode("preset")}>← Pick from preset list</button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Your account will be reviewed by an admin before showing publicly.</p>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
