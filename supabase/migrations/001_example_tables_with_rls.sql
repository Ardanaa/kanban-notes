-- Kanban Notes schema generated per tech-doc.md

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Clean up legacy example tables when present
DROP TABLE IF EXISTS public.private_notes CASCADE;
DROP TABLE IF EXISTS public.collaborations CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;

-- Deterministic mapping between Clerk user IDs and UUID primary keys
CREATE OR REPLACE FUNCTION public.clerk_id_to_uuid(clerk_id text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT uuid_generate_v5('6ba7b814-9dad-11d1-80b4-00c04fd430c8'::uuid, clerk_id);
$$;

-- Generic trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_current_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  description text,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  content text,
  position integer NOT NULL DEFAULT 0,
  column_id uuid NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE
);

-- Updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_profiles'
  ) THEN
    CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_boards'
  ) THEN
    CREATE TRIGGER set_timestamp_boards BEFORE UPDATE ON public.boards
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_columns'
  ) THEN
    CREATE TRIGGER set_timestamp_columns BEFORE UPDATE ON public.columns
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_cards'
  ) THEN
    CREATE TRIGGER set_timestamp_cards BEFORE UPDATE ON public.cards
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp();
  END IF;
END $$;

-- Indexes to support ordered queries
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON public.boards(user_id);
CREATE INDEX IF NOT EXISTS idx_columns_board_position ON public.columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_column_position ON public.cards(column_id, position);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Profiles policies: owner can manage their row
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  USING (id = clerk_id_to_uuid(auth.jwt() ->> 'sub'));

CREATE POLICY profiles_upsert ON public.profiles
  FOR ALL
  USING (id = clerk_id_to_uuid(auth.jwt() ->> 'sub'))
  WITH CHECK (id = clerk_id_to_uuid(auth.jwt() ->> 'sub'));

-- Boards policies: owner-only access
CREATE POLICY boards_owner_crud ON public.boards
  FOR ALL
  USING (user_id = clerk_id_to_uuid(auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = clerk_id_to_uuid(auth.jwt() ->> 'sub'));

-- Columns policies: owner of parent board
CREATE POLICY columns_owner_crud ON public.columns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id
        AND b.user_id = clerk_id_to_uuid(auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id
        AND b.user_id = clerk_id_to_uuid(auth.jwt() ->> 'sub')
    )
  );

-- Cards policies: owner of parent board via column
CREATE POLICY cards_owner_crud ON public.cards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.columns c
      JOIN public.boards b ON b.id = c.board_id
      WHERE c.id = column_id
        AND b.user_id = clerk_id_to_uuid(auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.columns c
      JOIN public.boards b ON b.id = c.board_id
      WHERE c.id = column_id
        AND b.user_id = clerk_id_to_uuid(auth.jwt() ->> 'sub')
    )
  );
