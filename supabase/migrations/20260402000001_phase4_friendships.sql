-- ============================================================================
-- FitRealm Phase 4 — Friendships
-- ============================================================================

-- ── Table: friendships ───────────────────────────────────────────────────────
-- Bidirectional: adding a friend creates TWO rows (A→B and B→A).
-- This makes reads simple: always filter WHERE user_id = auth.uid().

CREATE TABLE public.friendships (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT friendships_no_self    CHECK (user_id <> friend_id),
  CONSTRAINT friendships_unique     UNIQUE (user_id, friend_id)
);

CREATE INDEX idx_friendships_user_id ON public.friendships (user_id);

COMMENT ON TABLE public.friendships IS
  'Bidirectional friend connections. Each friendship = 2 rows (A→B and B→A).';

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY friendships_select_own
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY friendships_insert_own
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY friendships_delete_own
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── RPC: get_friends_with_stats ───────────────────────────────────────────────
-- Returns all friends with profile + current game state + current week stats.
-- Single query, no JS-side joins needed.

CREATE OR REPLACE FUNCTION public.get_friends_with_stats()
RETURNS TABLE (
  friend_id       uuid,
  display_name    text,
  focus_goal      text,
  invite_code     text,
  streak_count    int,
  last_workout_at timestamptz,
  weekly_mm       numeric,
  total_mm        numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id                                       AS friend_id,
    p.display_name,
    p.focus_goal,
    p.invite_code,
    COALESCE(gs.streak_count, 0)::int          AS streak_count,
    gs.last_workout_at,
    COALESCE(ws.total_mm, 0)                   AS weekly_mm,
    COALESCE(gs.total_mm, 0)                   AS total_mm
  FROM   public.friendships f
  JOIN   public.profiles     p  ON p.id = f.friend_id
  LEFT JOIN public.game_states  gs ON gs.user_id = f.friend_id
  LEFT JOIN public.weekly_stats ws ON ws.user_id  = f.friend_id
    AND ws.week_start = date_trunc('week', current_date)::date
  WHERE  f.user_id = auth.uid();
END;
$$;
