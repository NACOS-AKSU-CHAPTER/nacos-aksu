import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Calendar, Users, Sparkles, GraduationCap, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: GraduationCap, title: "Studies Hub", desc: "Courses and downloadable materials organized by level — 100 to 400.", to: "/studies" },
  { icon: Calendar, title: "Events & News", desc: "Hackathons, tech talks, and announcements from your association.", to: "/events" },
  { icon: Users, title: "Meet the Execs", desc: "Get to know the leaders driving NACOS AKSU forward this session.", to: "/executives" },
  { icon: Sparkles, title: "Suggestion Box", desc: "Drop anonymous ideas and feedback for the executive board.", to: "/contact" },
];

interface FeaturedEvent { id: string; title: string; description: string | null; event_date: string; cover_url: string | null }
interface NewsItem { id: string; title: string; slug: string; excerpt: string | null; published_at: string }
interface Photo { id: string; photo_url: string }

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
};

const Index = () => {
  const [stats, setStats] = useState({ members: 0, events: 0, courses: 0, execs: 0 });
  const [featured, setFeatured] = useState<FeaturedEvent | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const featuresSection = useScrollAnimation();
  const featuredSection = useScrollAnimation();
  const photosSection = useScrollAnimation();
  const ctaSection = useScrollAnimation();

  useEffect(() => {
    document.title = "NACOS AKSU — Department of Computing";
    (async () => {
      const [m, ev, co, ex, fe, ne, ph] = await Promise.all([
        supabase.from("membership_signups").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("is_approved", true).not("position", "is", null),
        supabase.from("events").select("id, title, description, event_date, cover_url").eq("is_published", true).gte("event_date", new Date().toISOString()).order("event_date", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("news").select("id, title, slug, excerpt, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(3),
        supabase.from("gallery_photos").select("id, photo_url").order("created_at", { ascending: false }).limit(4),
      ]);
      setStats({ members: m.count ?? 0, events: ev.count ?? 0, courses: co.count ?? 0, execs: ex.count ?? 0 });
      setFeatured(fe.data as any);
      setNews((ne.data ?? []) as NewsItem[]);
      setPhotos((ph.data ?? []) as Photo[]);
    })();
  }, []);

  const statCards = [
    { label: "Members", value: stats.members },
    { label: "Approved Execs", value: stats.execs },
    { label: "Courses Listed", value: stats.courses },
    { label: "Published Events", value: stats.events },
  ];

  return (
    <>
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/40" aria-hidden />

        <div className="relative container mx-auto container-px py-20 md:py-32">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 backdrop-blur text-xs font-medium uppercase tracking-wider mb-6 border border-primary-foreground/20">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Nigerian Association of Computing Students • AKSU
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-balance">
              Where computing students <span className="text-accent">build, learn,</span> and lead.
            </h1>
            <p className="mt-6 text-lg md:text-xl opacity-85 max-w-2xl leading-relaxed">
              The official home of NACOS, Akwa Ibom State University chapter — your hub for courses, materials, events, and the people moving our department forward.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg"><Link to="/contact">Join NACOS <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outlineLight" size="lg"><Link to="/studies"><BookOpen className="h-4 w-4" /> Explore Courses</Link></Button>
            </div>
          </div>

          <div className="relative mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-xl bg-primary-foreground/5 backdrop-blur border border-primary-foreground/10 p-5 text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-accent">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider opacity-75">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto container-px">
          <div ref={featuresSection.ref} className={`max-w-2xl mb-12 scroll-animate ${featuresSection.isVisible ? 'animate-in' : ''}`}>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">What's inside</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-balance">Everything a computing student needs, in one place.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, idx) => (
              <Link key={f.title} to={f.to} className="group">
                <Card
                  className={`h-full p-6 border-border hover:border-accent/50 transition-smooth shadow-card-soft hover:shadow-elegant hover:-translate-y-1 scroll-animate-scale ${featuresSection.isVisible ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="h-11 w-11 rounded-lg bg-accent-soft text-accent inline-flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-smooth">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:text-accent transition-smooth">Open <ArrowRight className="h-3.5 w-3.5" /></div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(featured || news.length > 0) && (
        <section className="py-20 md:py-24 gradient-soft">
          <div className="container mx-auto container-px">
            <div ref={featuredSection.ref} className={`flex items-end justify-between mb-10 gap-4 flex-wrap scroll-animate ${featuredSection.isVisible ? 'animate-in' : ''}`}>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">Happening now</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold">Featured event & latest news</h2>
              </div>
              <Button asChild variant="ghost" size="sm"><Link to="/events">View all <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {featured ? (
                <Card className={`lg:col-span-2 overflow-hidden border-border shadow-card-soft scroll-animate-left ${featuredSection.isVisible ? 'animate-in' : ''}`}>
                  {featured.cover_url ? (
                    <img src={featured.cover_url} alt={featured.title} className="aspect-[16/9] w-full object-cover" />
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground"><Calendar className="h-16 w-16 opacity-40" /></div>
                  )}
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 text-xs font-medium text-accent mb-3 uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Upcoming • {new Date(featured.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">{featured.title}</h3>
                    {featured.description && <p className="text-muted-foreground leading-relaxed mb-5 line-clamp-3">{featured.description}</p>}
                    <Button asChild variant="default"><Link to="/events">Learn more <ArrowRight className="h-4 w-4" /></Link></Button>
                  </div>
                </Card>
              ) : (
                <Card className="lg:col-span-2 p-10 text-center border-dashed text-muted-foreground">No upcoming events scheduled yet.</Card>
              )}

              <div className="space-y-5">
                {news.length > 0 ? news.map((n, idx) => (
                  <Card
                    key={n.id}
                    className={`p-5 border-border shadow-card-soft hover:shadow-elegant transition-smooth scroll-animate-right ${featuredSection.isVisible ? 'animate-in' : ''}`}
                    style={{ animationDelay: `${idx * 0.15}s` }}
                  >
                    <div className="text-xs text-muted-foreground mb-2">{formatRelative(n.published_at)}</div>
                    <h4 className="font-display font-semibold leading-snug">{n.title}</h4>
                    {n.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{n.excerpt}</p>}
                  </Card>
                )) : (
                  <Card className="p-5 text-center border-dashed text-muted-foreground text-sm">No news posted yet.</Card>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {photos.length > 0 && (
        <section className="py-20 md:py-24">
          <div className="container mx-auto container-px">
            <div ref={photosSection.ref} className={`flex items-end justify-between mb-10 gap-4 flex-wrap scroll-animate ${photosSection.isVisible ? 'animate-in' : ''}`}>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">Moments</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold">From our community</h2>
              </div>
              <Button asChild variant="ghost" size="sm"><Link to="/gallery">Open gallery <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((p, idx) => (
                <Link
                  key={p.id}
                  to="/gallery"
                  className={`aspect-square rounded-xl overflow-hidden shadow-card-soft hover:scale-[1.02] transition-smooth scroll-animate-scale ${photosSection.isVisible ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="container mx-auto container-px">
          <div ref={ctaSection.ref} className={`rounded-2xl gradient-hero text-primary-foreground p-10 md:p-16 text-center shadow-elegant scroll-animate-scale ${ctaSection.isVisible ? 'animate-in' : ''}`}>
            <h2 className="font-display text-3xl md:text-4xl font-bold max-w-2xl mx-auto text-balance">Ready to be part of something bigger?</h2>
            <p className="mt-4 opacity-85 max-w-xl mx-auto">Join hundreds of computing students learning, building, and shaping the future of tech at AKSU.</p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild variant="hero" size="lg"><Link to="/contact">Become a Member</Link></Button>
              <Button asChild variant="outlineLight" size="lg"><Link to="/about">Learn About Us</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
