import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, ArrowLeft, Loader2, Share2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  is_published: boolean;
  published_at: string;
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setPost(data as NewsItem);
        document.title = `${data.title} — NACOS AKSU`;
      } catch (err) {
        toast.error("Failed to load news article");
        console.error("Error fetching news details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt || "",
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-muted-foreground text-sm animate-pulse">Loading news article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto container-px py-24 text-center max-w-md">
        <h2 className="font-display text-2xl font-bold mb-4">Article Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The news article you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button asChild>
          <Link to="/events">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to News & Events
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="News & Announcements"
        title={post.title}
        description={post.excerpt || undefined}
      />

      <section className="py-16 bg-background">
        <div className="container mx-auto container-px max-w-4xl animate-fade-in-up">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Button asChild variant="ghost" className="hover:bg-secondary/80">
              <Link to="/events" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to News & Events
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-accent" />
                {formatDate(post.published_at)}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-8 gap-1.5 text-xs hover:bg-secondary"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-border/80 shadow-elegant p-0 mb-12">
            {post.cover_url && (
              <div className="aspect-[21/9] w-full relative overflow-hidden group">
                <img
                  src={post.cover_url}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              </div>
            )}

            <div className="p-8 md:p-12">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-line text-foreground/90 text-base md:text-lg leading-relaxed font-sans">
                  {post.content}
                </p>
              </div>
            </div>
          </Card>
          
          <div className="pt-8 border-t border-border/60 flex justify-center">
            <Button asChild variant="outline" className="group">
              <Link to="/events" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to News & Events
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default NewsDetail;
