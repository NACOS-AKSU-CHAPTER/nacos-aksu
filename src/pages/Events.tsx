import { useEffect, useState } from "react";
import { Calendar, MapPin, ArrowRight, Newspaper, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string | null;
  register_link: string | null;
  cover_url: string | null;
}
interface NewsRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const Events = () => {
  const [upcoming, setUpcoming] = useState<EventRow[]>([]);
  const [past, setPast] = useState<EventRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const upcomingSection = useScrollAnimation();
  const newsSection = useScrollAnimation();
  const pastSection = useScrollAnimation();

  useEffect(() => {
    document.title = "Events & News — NACOS AKSU";
    (async () => {
      const now = new Date().toISOString();
      const [up, pa, ne] = await Promise.all([
        supabase.from("events").select("*").eq("is_published", true).gte("event_date", now).order("event_date", { ascending: true }),
        supabase.from("events").select("*").eq("is_published", true).lt("event_date", now).order("event_date", { ascending: false }).limit(20),
        supabase.from("news").select("id, title, slug, excerpt, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(9),
      ]);
      setUpcoming((up.data ?? []) as EventRow[]);
      setPast((pa.data ?? []) as EventRow[]);
      setNews((ne.data ?? []) as NewsRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Events & News"
        title="What's happening in NACOS AKSU."
        description="Upcoming events, past highlights, and the latest announcements from your association."
      />

      <section className="py-16">
        <div className="container mx-auto container-px">
          <h2 ref={upcomingSection.ref} className={`font-display text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 scroll-animate ${upcomingSection.isVisible ? 'animate-in' : ''}`}>
            <span className="h-2 w-2 rounded-full bg-accent" /> Upcoming Events
          </h2>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : upcoming.length === 0 ? (
            <Card className="p-10 text-center border-dashed text-muted-foreground">No upcoming events scheduled — check back soon.</Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {upcoming.map((e, idx) => (
                <Card
                  key={e.id}
                  className={`overflow-hidden border-border shadow-card-soft hover:shadow-elegant transition-smooth scroll-animate-scale ${upcomingSection.isVisible ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${idx * 0.15}s` }}
                >
                  {e.cover_url ? (
                    <img src={e.cover_url} alt={e.title} className="aspect-[16/9] w-full object-cover" />
                  ) : (
                    <div className="aspect-[16/9] gradient-hero flex items-center justify-center text-primary-foreground"><Calendar className="h-14 w-14 opacity-40" /></div>
                  )}
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold mb-3">{e.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground mb-4">
                      <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {fmtDate(e.event_date)}</span>
                      {e.venue && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {e.venue}</span>}
                    </div>
                    {e.description && <p className="text-sm leading-relaxed mb-5 line-clamp-3">{e.description}</p>}
                    {e.register_link && (
                      <Button asChild variant="default">
                        <a href={e.register_link} target="_blank" rel="noreferrer">Register <ArrowRight className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-secondary/40">
        <div className="container mx-auto container-px">
          <h2 ref={newsSection.ref} className={`font-display text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 scroll-animate ${newsSection.isVisible ? 'animate-in' : ''}`}>
            <Newspaper className="h-6 w-6 text-accent" /> Latest News
          </h2>
          {news.length === 0 ? (
            <Card className="p-10 text-center border-dashed text-muted-foreground">No news posted yet.</Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {news.map((n, idx) => (
                <Card
                  key={n.id}
                  className={`p-6 border-border shadow-card-soft hover:shadow-elegant transition-smooth scroll-animate ${newsSection.isVisible ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="text-xs text-muted-foreground mb-2">{fmtDate(n.published_at)}</div>
                  <h3 className="font-display font-semibold text-lg leading-snug mb-2">{n.title}</h3>
                  {n.excerpt && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{n.excerpt}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto container-px">
            <h2 ref={pastSection.ref} className={`font-display text-2xl md:text-3xl font-bold mb-6 scroll-animate ${pastSection.isVisible ? 'animate-in' : ''}`}>Past Events</h2>
            <div className="space-y-3">
              {past.map((e, idx) => (
                <Card
                  key={e.id}
                  className={`p-5 border-border flex items-center justify-between flex-wrap gap-3 scroll-animate-left ${pastSection.isVisible ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div>
                    <h3 className="font-display font-semibold">{e.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{fmtDate(e.event_date)}{e.venue ? ` • ${e.venue}` : ""}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Events;
