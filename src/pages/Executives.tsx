import { useEffect, useState } from "react";
import { Mail, Linkedin, Twitter, Instagram, MessageCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";

interface ExecProfile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  position: string | null;
  photo_url: string | null;
  email_public: string | null;
  whatsapp: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  display_order: number;
}

const initials = (name: string | null) =>
  (name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const getPositionRank = (position: string | null): number => {
  if (!position) return 99;
  const pos = position.toLowerCase().trim();
  
  if (pos === "president") return 1;
  if (pos.includes("vice president")) return 2;
  if (pos.includes("stakeholder") || pos.includes("chairman")) return 3;
  if (pos.includes("software") || pos.includes("technology") || pos.includes("tech")) return 4;
  if (pos.includes("general secretary") || pos === "secretary") return 5;
  if (pos.includes("assistant general secretary") || pos.includes("assistant secretary")) return 6;
  if (pos.includes("financial secretary")) return 7;
  if (pos.includes("treasurer")) return 8;
  if (pos.includes("p.r.o") || pos.includes("pro") || pos.includes("public relations") || pos.includes("information") || pos.includes("publicity")) return 9;
  if (pos.includes("welfare")) return 10;
  if (pos.includes("social")) return 11;
  if (pos.includes("sports")) return 12;
  
  return 20; // other positions
};

const sortExecutives = (a: ExecProfile, b: ExecProfile) => {
  const rankA = getPositionRank(a.position);
  const rankB = getPositionRank(b.position);
  
  if (rankA !== rankB) {
    return rankA - rankB;
  }
  
  if (a.display_order !== b.display_order) {
    return a.display_order - b.display_order;
  }
  
  const nameA = a.display_name ?? "";
  const nameB = b.display_name ?? "";
  return nameA.localeCompare(nameB);
};

const Executives = () => {
  const [list, setList] = useState<ExecProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Executives — NACOS AKSU";
    supabase
      .from("profiles")
      .select("user_id, display_name, bio, position, photo_url, email_public, whatsapp, twitter, linkedin, instagram, display_order")
      .eq("is_approved", true)
      .not("position", "is", null)
      .then(({ data }) => {
        const sorted = ((data ?? []) as ExecProfile[]).sort(sortExecutives);
        setList(sorted);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Leadership"
        title="Meet the people leading NACOS AKSU."
        description="The executive board working day-to-day to serve every computing student in our department."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto container-px">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No approved executives yet — check back soon.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {list.map((e) => (
                <Card key={e.user_id} className="p-6 border-border shadow-card-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth text-center">
                  {e.photo_url ? (
                    <img src={e.photo_url} alt={e.display_name ?? ""} className="mx-auto h-24 w-24 rounded-full object-cover mb-4 shadow-glow" />
                  ) : (
                    <div className="mx-auto h-24 w-24 rounded-full gradient-hero text-primary-foreground flex items-center justify-center font-display text-2xl font-bold mb-4 shadow-glow">
                      {initials(e.display_name)}
                    </div>
                  )}
                  <h3 className="font-display font-semibold text-lg">{e.display_name ?? "—"}</h3>
                  <p className="text-accent text-sm font-medium mt-1">{e.position}</p>
                  {e.bio && <p className="text-muted-foreground text-sm mt-3 leading-relaxed line-clamp-4">{e.bio}</p>}
                  <div className="flex justify-center gap-1 mt-5 flex-wrap">
                    {e.email_public && (
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <a href={`mailto:${e.email_public}`} aria-label="Email"><Mail className="h-4 w-4" /></a>
                      </Button>
                    )}
                    {e.whatsapp && (
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <a href={`https://wa.me/${e.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
                      </Button>
                    )}
                    {e.linkedin && (
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <a href={e.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></a>
                      </Button>
                    )}
                    {e.twitter && (
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <a href={e.twitter} target="_blank" rel="noreferrer" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
                      </Button>
                    )}
                    {e.instagram && (
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <a href={e.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Executives;
