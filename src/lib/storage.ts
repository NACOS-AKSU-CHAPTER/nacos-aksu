import { supabase } from "@/integrations/supabase/client";

export async function uploadFile(bucket: string, file: File, prefix = ""): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const safe = `${prefix}${prefix ? "/" : ""}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(safe, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(safe);
  return data.publicUrl;
}
