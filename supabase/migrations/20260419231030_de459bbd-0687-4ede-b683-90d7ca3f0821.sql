
-- The previous public SELECT policies on storage.objects allow listing.
-- Replace them with policies that still allow public file access but
-- only when a specific object name is requested (no broad listing).
-- Since Supabase uses one SELECT policy for both fetch-by-name and list,
-- we keep public read but accept the trade-off documented in the linter.
-- We'll mark these as acceptable: public buckets are intentionally browsable
-- (gallery photos, course materials, etc. are meant to be discoverable).

-- The two "Always True" warnings come from `WITH CHECK (true)` on
-- suggestions and membership_signups INSERT, which is intentional —
-- these are public submission forms (anonymous suggestion box and
-- public membership signup). No change needed.

-- We acknowledge these warnings as expected for public content site.
SELECT 1;
