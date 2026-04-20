import { useEffect, useState } from "react";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  event_date: string | null;
}
interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "";

const Gallery = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  useEffect(() => {
    document.title = "Gallery — NACOS AKSU";
    (async () => {
      const { data: al } = await supabase
        .from("gallery_albums")
        .select("*")
        .order("event_date", { ascending: false, nullsFirst: false });
      const list = (al ?? []) as Album[];
      setAlbums(list);

      // counts per album
      const entries = await Promise.all(
        list.map((a) =>
          supabase
            .from("gallery_photos")
            .select("id", { count: "exact", head: true })
            .eq("album_id", a.id)
            .then((r) => [a.id, r.count ?? 0] as const),
        ),
      );
      setCounts(Object.fromEntries(entries));
      setLoading(false);
    })();
  }, []);

  const open = async (a: Album) => {
    setOpenAlbum(a);
    setPhotosLoading(true);
    const { data } = await supabase
      .from("gallery_photos")
      .select("id, photo_url, caption")
      .eq("album_id", a.id)
      .order("display_order", { ascending: true });
    setPhotos((data ?? []) as Photo[]);
    setPhotosLoading(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Moments that define our community."
        description="Photos from events, gatherings, and the everyday life of NACOS AKSU."
      />

      <section className="py-16">
        <div className="container mx-auto container-px">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : albums.length === 0 ? (
            <Card className="p-10 text-center border-dashed text-muted-foreground">No albums published yet.</Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {albums.map((a) => (
                <Card
                  key={a.id}
                  onClick={() => open(a)}
                  className="overflow-hidden border-border shadow-card-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth cursor-pointer group"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {a.cover_url ? (
                      <img src={a.cover_url} alt={a.title} className="h-full w-full object-cover group-hover:scale-105 transition-smooth" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary via-primary-glow to-accent/40 flex items-center justify-center text-primary-foreground">
                        <ImageIcon className="h-12 w-12 opacity-40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/95 text-foreground text-xs font-medium">
                      {counts[a.id] ?? 0} photos
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-semibold text-lg">{a.title}</h3>
                    {(a.event_date || a.description) && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {a.event_date && fmtDate(a.event_date)}
                        {a.event_date && a.description ? " — " : ""}
                        {a.description}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!openAlbum} onOpenChange={(v) => !v && setOpenAlbum(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold">{openAlbum?.title}</h2>
              {openAlbum?.event_date && <p className="text-sm text-muted-foreground">{fmtDate(openAlbum.event_date)}</p>}
              {openAlbum?.description && <p className="text-sm mt-2 max-w-2xl">{openAlbum.description}</p>}
            </div>
          </div>
          {photosLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : photos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No photos in this album yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p) => (
                <figure key={p.id} className="space-y-1">
                  <img src={p.photo_url} alt={p.caption ?? ""} className="w-full aspect-square object-cover rounded-lg" />
                  {p.caption && <figcaption className="text-xs text-muted-foreground">{p.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Gallery;
