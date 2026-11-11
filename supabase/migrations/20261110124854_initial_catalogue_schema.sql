-- Initial Supabase schema for authenticated catalogue persistence.
-- Demo-mode records remain browser-local and are not inserted by this migration.

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null
    or (
      char_length(display_name) <= 120
      and char_length(btrim(display_name)) >= 1
    )
  )
);

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_release_id text not null,
  source_url text,
  artist text not null,
  title text not null,
  release_date text,
  release_year smallint,
  country text,
  barcode text,
  labels jsonb not null default '[]'::jsonb,
  formats jsonb not null default '[]'::jsonb,
  identifiers jsonb not null default '[]'::jsonb,
  genres text[] not null default '{}'::text[],
  styles text[] not null default '{}'::text[],
  tracks jsonb not null default '[]'::jsonb,
  cover_art_url text,
  raw_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint releases_provider_release_unique unique (provider, provider_release_id),
  constraint releases_provider_allowed check (
    provider in ('musicbrainz', 'discogs', 'demo', 'manual')
  ),
  constraint releases_provider_release_id_length check (
    char_length(provider_release_id) <= 255
    and char_length(btrim(provider_release_id)) >= 1
  ),
  constraint releases_artist_length check (
    char_length(artist) <= 500
    and char_length(btrim(artist)) >= 1
  ),
  constraint releases_title_length check (
    char_length(title) <= 500
    and char_length(btrim(title)) >= 1
  ),
  constraint releases_source_url_https check (
    source_url is null
    or (char_length(source_url) <= 2048 and source_url ~ '^https://')
  ),
  constraint releases_cover_art_url_https check (
    cover_art_url is null
    or (char_length(cover_art_url) <= 2048 and cover_art_url ~ '^https://')
  ),
  constraint releases_release_date_length check (
    release_date is null or char_length(release_date) <= 32
  ),
  constraint releases_release_year_range check (
    release_year is null or release_year between 1000 and 9999
  ),
  constraint releases_country_length check (
    country is null
    or (
      char_length(country) <= 100
      and char_length(btrim(country)) >= 1
    )
  ),
  constraint releases_barcode_length check (
    barcode is null
    or (
      char_length(barcode) <= 64
      and char_length(btrim(barcode)) >= 1
    )
  ),
  constraint releases_labels_array check (
    jsonb_typeof(labels) = 'array'
    and octet_length(labels::text) <= 131072
  ),
  constraint releases_formats_array check (
    jsonb_typeof(formats) = 'array'
    and octet_length(formats::text) <= 131072
  ),
  constraint releases_identifiers_array check (
    jsonb_typeof(identifiers) = 'array'
    and octet_length(identifiers::text) <= 131072
  ),
  constraint releases_genres_bound check (
    cardinality(genres) <= 100
    and array_position(genres, null::text) is null
    and octet_length(array_to_json(genres)::text) <= 65536
  ),
  constraint releases_styles_bound check (
    cardinality(styles) <= 100
    and array_position(styles, null::text) is null
    and octet_length(array_to_json(styles)::text) <= 65536
  ),
  constraint releases_tracks_array check (
    jsonb_typeof(tracks) = 'array'
    and octet_length(tracks::text) <= 524288
  ),
  constraint releases_raw_metadata_object check (
    raw_metadata is null or jsonb_typeof(raw_metadata) = 'object'
  ),
  constraint releases_raw_metadata_size check (
    raw_metadata is null or octet_length(raw_metadata::text) <= 262144
  )
);

create table public.collection_copies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  release_id uuid references public.releases (id) on delete restrict,
  release_snapshot jsonb,
  identification_method text not null,
  evidence jsonb not null default '{}'::jsonb,
  media_condition text,
  sleeve_condition text,
  notes text,
  shelf text,
  tags text[] not null default '{}'::text[],
  is_favorite boolean not null default false,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_copies_owner_idempotency_unique unique (owner_id, idempotency_key),
  constraint collection_copies_identification_method_allowed check (
    identification_method in ('search', 'barcode', 'photo', 'runout', 'manual', 'demo')
  ),
  constraint collection_copies_release_source check (
    (release_id is not null and release_snapshot is null)
    or (release_id is null and release_snapshot is not null)
  ),
  constraint collection_copies_release_snapshot_object check (
    release_snapshot is null or jsonb_typeof(release_snapshot) = 'object'
  ),
  constraint collection_copies_release_snapshot_size check (
    release_snapshot is null or octet_length(release_snapshot::text) <= 65536
  ),
  constraint collection_copies_evidence_object check (jsonb_typeof(evidence) = 'object'),
  constraint collection_copies_evidence_size check (
    octet_length(evidence::text) <= 65536
  ),
  constraint collection_copies_media_condition_length check (
    media_condition is null
    or (
      char_length(media_condition) <= 32
      and char_length(btrim(media_condition)) >= 1
    )
  ),
  constraint collection_copies_sleeve_condition_length check (
    sleeve_condition is null
    or (
      char_length(sleeve_condition) <= 32
      and char_length(btrim(sleeve_condition)) >= 1
    )
  ),
  constraint collection_copies_notes_length check (
    notes is null or char_length(notes) <= 10000
  ),
  constraint collection_copies_shelf_length check (
    shelf is null
    or (
      char_length(shelf) <= 200
      and char_length(btrim(shelf)) >= 1
    )
  ),
  constraint collection_copies_tags_count check (cardinality(tags) <= 50),
  constraint collection_copies_tags_size check (
    octet_length(array_to_json(tags)::text) <= 8192
  ),
  constraint collection_copies_tags_no_nulls check (
    array_position(tags, null::text) is null
  )
);

create table public.identification_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  method text not null,
  status text not null default 'pending',
  original_input jsonb not null default '{}'::jsonb,
  normalized_evidence jsonb not null default '{}'::jsonb,
  selected_provider text,
  selected_release_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identification_sessions_method_allowed check (
    method in ('search', 'barcode', 'photo', 'runout', 'manual', 'demo')
  ),
  constraint identification_sessions_status_allowed check (
    status in ('pending', 'identifying', 'awaiting_confirmation', 'saved', 'failed')
  ),
  constraint identification_sessions_original_input_object check (
    jsonb_typeof(original_input) = 'object'
  ),
  constraint identification_sessions_original_input_size check (
    octet_length(original_input::text) <= 65536
  ),
  constraint identification_sessions_normalized_evidence_object check (
    jsonb_typeof(normalized_evidence) = 'object'
  ),
  constraint identification_sessions_normalized_evidence_size check (
    octet_length(normalized_evidence::text) <= 65536
  ),
  constraint identification_sessions_selected_provider_allowed check (
    selected_provider is null
    or selected_provider in ('musicbrainz', 'discogs', 'demo', 'manual')
  ),
  constraint identification_sessions_selection_complete check (
    (selected_provider is null) = (selected_release_id is null)
  ),
  constraint identification_sessions_selected_release_id_length check (
    selected_release_id is null
    or (
      char_length(selected_release_id) <= 255
      and char_length(btrim(selected_release_id)) >= 1
    )
  )
);

create table public.record_images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  byte_size integer not null,
  purpose text,
  retention_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint record_images_storage_path_owner_scoped check (
    storage_path ~ (
      '^'
      || owner_id::text
      || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,10}$'
    )
  ),
  constraint record_images_mime_type_allowed check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp')
  ),
  constraint record_images_byte_size_range check (
    byte_size between 1 and 10485760
  ),
  constraint record_images_purpose_length check (
    purpose is null
    or (
      char_length(purpose) <= 64
      and char_length(btrim(purpose)) >= 1
    )
  ),
  constraint record_images_retention_future check (
    retention_until > created_at
  )
);

create index releases_barcode_idx
  on public.releases (barcode)
  where barcode is not null;

create index releases_release_year_idx
  on public.releases (release_year)
  where release_year is not null;

create index collection_copies_owner_updated_idx
  on public.collection_copies (owner_id, updated_at desc);

create index collection_copies_release_idx
  on public.collection_copies (release_id)
  where release_id is not null;

create index collection_copies_owner_favorites_idx
  on public.collection_copies (owner_id, updated_at desc)
  where is_favorite;

create index collection_copies_tags_idx
  on public.collection_copies using gin (tags);

create index identification_sessions_owner_updated_idx
  on public.identification_sessions (owner_id, updated_at desc);

create index identification_sessions_owner_status_idx
  on public.identification_sessions (owner_id, status, updated_at desc);

create index record_images_owner_created_idx
  on public.record_images (owner_id, created_at desc);

create index record_images_retention_idx
  on public.record_images (retention_until);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger releases_set_updated_at
before update on public.releases
for each row execute function public.set_updated_at();

create trigger collection_copies_set_updated_at
before update on public.collection_copies
for each row execute function public.set_updated_at();

create trigger identification_sessions_set_updated_at
before update on public.identification_sessions
for each row execute function public.set_updated_at();

create trigger record_images_set_updated_at
before update on public.record_images
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(left(new.raw_user_meta_data ->> 'display_name', 120)), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_user_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.releases enable row level security;
alter table public.releases force row level security;
alter table public.collection_copies enable row level security;
alter table public.collection_copies force row level security;
alter table public.identification_sessions enable row level security;
alter table public.identification_sessions force row level security;
alter table public.record_images enable row level security;
alter table public.record_images force row level security;

create policy "Profiles are selectable by their owner"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Profiles are insertable by their owner"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Profiles are updatable by their owner"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Profiles are deletable by their owner"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

create policy "Releases are readable by authenticated users"
on public.releases
for select
to authenticated
using (true);

create policy "Collection copies are selectable by their owner"
on public.collection_copies
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Collection copies are insertable by their owner"
on public.collection_copies
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Collection copies are updatable by their owner"
on public.collection_copies
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Collection copies are deletable by their owner"
on public.collection_copies
for delete
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Identification sessions are selectable by their owner"
on public.identification_sessions
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Identification sessions are insertable by their owner"
on public.identification_sessions
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Identification sessions are updatable by their owner"
on public.identification_sessions
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Identification sessions are deletable by their owner"
on public.identification_sessions
for delete
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Record images are selectable by their owner"
on public.record_images
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Record images are insertable by their owner"
on public.record_images
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Record images are updatable by their owner"
on public.record_images
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Record images are deletable by their owner"
on public.record_images
for delete
to authenticated
using ((select auth.uid()) = owner_id);

revoke all on table public.profiles from anon;
revoke all on table public.releases from anon;
revoke all on table public.collection_copies from anon;
revoke all on table public.identification_sessions from anon;
revoke all on table public.record_images from anon;

revoke all on table public.profiles from authenticated;
revoke all on table public.releases from authenticated;
revoke all on table public.collection_copies from authenticated;
revoke all on table public.identification_sessions from authenticated;
revoke all on table public.record_images from authenticated;

grant select, delete on table public.profiles to authenticated;
grant insert (id, display_name) on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

grant select on table public.releases to authenticated;

grant select, delete on table public.collection_copies to authenticated;
grant insert (
  owner_id,
  release_id,
  release_snapshot,
  identification_method,
  evidence,
  media_condition,
  sleeve_condition,
  notes,
  shelf,
  tags,
  is_favorite,
  idempotency_key
) on table public.collection_copies to authenticated;
grant update (
  media_condition,
  sleeve_condition,
  notes,
  shelf,
  tags,
  is_favorite
) on table public.collection_copies to authenticated;

grant select, delete on table public.identification_sessions to authenticated;
grant insert (
  owner_id,
  method,
  status,
  original_input,
  normalized_evidence,
  selected_provider,
  selected_release_id
) on table public.identification_sessions to authenticated;
grant update (
  status,
  normalized_evidence,
  selected_provider,
  selected_release_id
) on table public.identification_sessions to authenticated;

grant select, delete on table public.record_images to authenticated;
grant insert (
  owner_id,
  storage_path,
  mime_type,
  byte_size,
  purpose,
  retention_until
) on table public.record_images to authenticated;
grant update (purpose, retention_until) on table public.record_images to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'record-images',
  'record-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object names must be <owner UUID>/<random UUID>.<extension>. The UUID-shaped
-- name is structural validation; the application must generate it unpredictably.
create policy "Record image objects are selectable by their owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'record-images'
  and owner_id = (select auth.uid())::text
  and name ~ (
    '^'
    || (select auth.uid())::text
    || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,10}$'
  )
);

create policy "Record image objects are insertable by their owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'record-images'
  and owner_id = (select auth.uid())::text
  and name ~ (
    '^'
    || (select auth.uid())::text
    || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,10}$'
  )
);

create policy "Record image objects are updatable by their owner"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'record-images'
  and owner_id = (select auth.uid())::text
  and name ~ (
    '^'
    || (select auth.uid())::text
    || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,10}$'
  )
)
with check (
  bucket_id = 'record-images'
  and owner_id = (select auth.uid())::text
  and name ~ (
    '^'
    || (select auth.uid())::text
    || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,10}$'
  )
);

create policy "Record image objects are deletable by their owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'record-images'
  and owner_id = (select auth.uid())::text
  and name ~ (
    '^'
    || (select auth.uid())::text
    || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,10}$'
  )
);
