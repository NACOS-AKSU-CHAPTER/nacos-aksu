import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mnwefpnrifgzqsrpmxge.supabase.co'
const supabaseKey = 'sb_publishable_VrTd_eT2rg8lsIfNOT4-cw_XaE5z2sW'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testIndexQueries() {
  console.log('Running membership_signups query...');
  const m = await supabase.from("membership_signups").select("id", { count: "exact", head: true });
  console.log('membership_signups:', { count: m.count, error: m.error });

  console.log('Running events count query...');
  const ev = await supabase.from("events").select("id", { count: "exact", head: true }).eq("is_published", true);
  console.log('events count:', { count: ev.count, error: ev.error });

  console.log('Running courses query...');
  const co = await supabase.from("courses").select("id", { count: "exact", head: true });
  console.log('courses:', { count: co.count, error: co.error });

  console.log('Running profiles query...');
  const ex = await supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("is_approved", true).not("position", "is", null);
  console.log('profiles:', { count: ex.count, error: ex.error });

  console.log('Running featured event query...');
  const fe = await supabase.from("events").select("id, title, description, event_date, cover_url").eq("is_published", true).gte("event_date", new Date().toISOString()).order("event_date", { ascending: true }).limit(1).maybeSingle();
  console.log('featured event:', { data: fe.data, error: fe.error });

  console.log('Running news query...');
  const ne = await supabase.from("news").select("id, title, slug, excerpt, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(3);
  console.log('news:', { data: ne.data, error: ne.error });

  console.log('Running gallery_photos query...');
  const ph = await supabase.from("gallery_photos").select("id, photo_url").order("created_at", { ascending: false }).limit(4);
  console.log('gallery_photos:', { data: ph.data, error: ph.error });
}

testIndexQueries();
