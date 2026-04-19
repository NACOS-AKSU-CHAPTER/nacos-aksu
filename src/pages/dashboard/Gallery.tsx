import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { uploadFile } from "@/lib/storage";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  event_date: string | null;
}
interface Photo {
  id: string;
  album_id: string;
  photo_url: string;
  caption: string | null;
}

const Gallery = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Album>>({});
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const [photoModal, setPhotoModal] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { document.title = "Gallery — Dashboard"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("gallery_albums").select("*").order("created_at", { ascending: false });
    setAlbums((data ?? []) as Album[]);
    setLoading(false);
  };

  const loadPhotos = async (albumId: string) => {
    const { data } = await supabase.from("gallery_photos").select("*").eq("album_id", albumId).order("display_order");
    setPhotos((data ?? []) as Photo[]);
  };

  const saveAlbum = async () => {
    if (!editing.title) { toast.error("Title required"); return; }
    setBusy(true);
    try {
      let cover_url = editing.cover_url ?? null;
      if (coverFile) cover_url = await uploadFile("gallery", coverFile, "covers");
      const payload = { ...editing, cover_url } as any;
      if (editing.id) {
        const { error } = await supabase.from("gallery_albums").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gallery_albums").insert(payload);
        if (error) throw error;
      }
      toast.success("Saved");
      setOpen(false); setEditing({}); setCoverFile(null);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const removeAlbum = async (id: string) => {
    if (!confirm("Delete this album and all its photos?")) return;
    const { error } = await supabase.from("gallery_albums").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const openPhotos = async (a: Album) => {
    setPhotoModal(a);
    await loadPhotos(a.id);
  };

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files || !photoModal) return;
    setUploading(true);
    try {
      const uploads = Array.from(files).map(async (f, i) => {
        const url = await uploadFile("gallery", f, photoModal.id);
        return { album_id: photoModal.id, photo_url: url, display_order: photos.length + i };
      });
      const rows = await Promise.all(uploads);
      const { error } = await supabase.from("gallery_photos").insert(rows);
      if (error) throw error;
      toast.success(`${rows.length} photo(s) uploaded`);
      loadPhotos(photoModal.id);
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const removePhoto = async (id: string) => {
    const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { if (photoModal) loadPhotos(photoModal.id); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Gallery</h1>
          <p className="text-sm text-muted-foreground">Albums and photos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditing({}); setCoverFile(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New album
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Edit album" : "New album"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Event date</Label>
                <Input type="date" value={editing.event_date ?? ""} onChange={(e) => setEditing({ ...editing, event_date: e.target.value })} />
              </div>
              <div>
                <Label>Cover image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                {editing.cover_url && !coverFile && <img src={editing.cover_url} alt="" className="mt-2 h-20 rounded object-cover" />}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={saveAlbum} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((a) => (
            <Card key={a.id}>
              {a.cover_url ? <img src={a.cover_url} alt="" className="h-32 w-full object-cover rounded-t-lg" /> : <div className="h-32 bg-muted rounded-t-lg flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold truncate">{a.title}</h3>
                {a.event_date && <p className="text-xs text-muted-foreground">{new Date(a.event_date).toLocaleDateString()}</p>}
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openPhotos(a)}>Manage photos</Button>
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setCoverFile(null); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => removeAlbum(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {albums.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No albums yet.</p>}
        </div>
      )}

      <Dialog open={!!photoModal} onOpenChange={(v) => !v && setPhotoModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Photos · {photoModal?.title}</DialogTitle></DialogHeader>
          <div>
            <Label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-secondary text-sm">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload photos"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUploadPhotos(e.target.files)} />
            </Label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative group">
                <img src={p.photo_url} alt="" className="aspect-square w-full object-cover rounded" />
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length === 0 && <p className="text-sm text-muted-foreground col-span-3">No photos yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
