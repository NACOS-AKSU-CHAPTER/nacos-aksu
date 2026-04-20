import { useState } from "react";
import { z } from "zod";
import { Mail, MapPin, Phone, Send, MessageSquareLock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const messageSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(5, "Message is too short").max(2000),
});

const suggestionSchema = z.string().trim().min(5, "Suggestion is too short").max(2000);

const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  matric_number: z.string().trim().max(50).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  level: z.enum(["100", "200", "300", "400"]).optional(),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

const Contact = () => {
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [suggBusy, setSuggBusy] = useState(false);

  // membership signup state
  const [signup, setSignup] = useState({ full_name: "", email: "", matric_number: "", phone: "", level: "" as "" | "100" | "200" | "300" | "400", message: "" });
  const [signupBusy, setSignupBusy] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const payload = {
      full_name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      message: `[${String(fd.get("subject") ?? "Contact")}] ${String(fd.get("message") ?? "")}`,
    };
    try {
      messageSchema.parse(payload);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    // Store contact messages as suggestions with category "contact" so staff sees them
    const { error } = await supabase.from("suggestions").insert({
      category: "contact",
      message: `From: ${payload.full_name} <${payload.email}>\n\n${payload.message}`,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Message sent — we'll get back to you shortly.");
      form.reset();
    }
  };

  const handleSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      suggestionSchema.parse(suggestion);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setSuggBusy(true);
    const { error } = await supabase.from("suggestions").insert({ category: "anonymous", message: suggestion.trim() });
    setSuggBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Suggestion received — thanks for sharing.");
      setSuggestion("");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      signupSchema.parse(signup);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setSignupBusy(true);
    const { error } = await supabase.from("membership_signups").insert({
      full_name: signup.full_name.trim(),
      email: signup.email.trim(),
      matric_number: signup.matric_number || null,
      phone: signup.phone || null,
      level: signup.level || null,
      message: signup.message || null,
    });
    setSignupBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Welcome aboard! We'll be in touch.");
      setSignup({ full_name: "", email: "", matric_number: "", phone: "", level: "", message: "" });
      setShowJoin(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's hear from you."
        description="Reach out to the executive board, ask a question, or drop an anonymous suggestion."
      />

      <section className="py-16">
        <div className="container mx-auto container-px grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 md:p-8 border-border shadow-card-soft">
              <h2 className="font-display text-2xl font-bold mb-2">Send us a message</h2>
              <p className="text-sm text-muted-foreground mb-6">We typically respond within 48 hours.</p>
              <form onSubmit={handleContact} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" name="name" required placeholder="Your name" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@aksu.edu.ng" maxLength={255} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" required placeholder="What's this about?" maxLength={150} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" required placeholder="Tell us more..." rows={6} maxLength={1000} />
                </div>
                <Button type="submit" variant="default" size="lg" disabled={submitting}>
                  <Send className="h-4 w-4" /> {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Card>

            <Card className="p-6 md:p-8 border-border shadow-card-soft bg-accent-soft/40">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground inline-flex items-center justify-center shrink-0"><MessageSquareLock className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-display text-xl font-bold">Anonymous Suggestion Box</h2>
                  <p className="text-sm text-muted-foreground mt-1">No name, no email — just your honest thoughts. Only the executive board sees these.</p>
                </div>
              </div>
              <form onSubmit={handleSuggestion} className="space-y-4">
                <Textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} placeholder="Share an idea, concern, or feedback..." rows={4} maxLength={2000} className="bg-background" />
                <Button type="submit" variant="hero" disabled={suggBusy}>
                  <Send className="h-4 w-4" /> {suggBusy ? "Submitting..." : "Submit Anonymously"}
                </Button>
              </form>
            </Card>

            {showJoin && (
              <Card className="p-6 md:p-8 border-border shadow-card-soft" id="join">
                <h2 className="font-display text-2xl font-bold mb-2">Become a Member</h2>
                <p className="text-sm text-muted-foreground mb-6">Fill this in and we'll add you to the NACOS AKSU member list.</p>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full name *</Label>
                      <Input required value={signup.full_name} onChange={(e) => setSignup({ ...signup, full_name: e.target.value })} maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" required value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} maxLength={255} />
                    </div>
                    <div className="space-y-2">
                      <Label>Matric number</Label>
                      <Input value={signup.matric_number} onChange={(e) => setSignup({ ...signup, matric_number: e.target.value })} maxLength={50} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={signup.phone} onChange={(e) => setSignup({ ...signup, phone: e.target.value })} maxLength={30} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Level</Label>
                      <Select value={signup.level} onValueChange={(v) => setSignup({ ...signup, level: v as any })}>
                        <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="300">300</SelectItem>
                          <SelectItem value="400">400</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Anything else?</Label>
                    <Textarea rows={3} value={signup.message} onChange={(e) => setSignup({ ...signup, message: e.target.value })} maxLength={1000} />
                  </div>
                  <Button type="submit" variant="hero" disabled={signupBusy}>
                    <Send className="h-4 w-4" /> {signupBusy ? "Submitting..." : "Submit application"}
                  </Button>
                </form>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-6 border-border shadow-card-soft">
              <h3 className="font-display font-semibold text-lg mb-4">Get in touch</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <div>
                    <div className="font-medium">Department of Computing</div>
                    <div className="text-muted-foreground">Akwa Ibom State University, Mkpat Enin</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <a href="mailto:nacos@aksu.edu.ng" className="hover:text-accent transition-smooth">nacos@aksu.edu.ng</a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <span className="text-muted-foreground">+234 800 000 0000</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 border-border shadow-card-soft gradient-hero text-primary-foreground">
              <h3 className="font-display font-semibold text-lg mb-2">Become a Member</h3>
              <p className="text-sm opacity-85 mb-4">Join NACOS and get access to materials, events, and a community of computing students.</p>
              <Button variant="hero" className="w-full" onClick={() => { setShowJoin(true); setTimeout(() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" }), 50); }}>
                {showJoin ? "Scroll to form" : "Join Now"}
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
