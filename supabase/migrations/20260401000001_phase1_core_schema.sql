-- ============================================================================
-- FitRealm Phase 1 — Core Schema
-- ============================================================================

-- ── Helper: generate_invite_code ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i      int;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = result);
  END LOOP;
  RETURN result;
END;
$$;

-- ── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url   text,
  invite_code  text UNIQUE NOT NULL DEFAULT public.generate_invite_code(),
  focus_goal   text NOT NULL DEFAULT 'ausdauer'
    CHECK (focus_goal IN ('ausdauer', 'diaet', 'muskelaufbau')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'One row per user — public profile data.';

-- ── Game States ─────────────────────────────────────────────────────────────

CREATE TABLE public.game_states (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Indexed fields (for leaderboards, extracted from GameState)
  rathaus_level    int          NOT NULL DEFAULT 1,
  total_mm         numeric(12,2) NOT NULL DEFAULT 0,
  current_mm       numeric(12,2) NOT NULL DEFAULT 0,
  protein          int          NOT NULL DEFAULT 0,
  wood             numeric(10,2) NOT NULL DEFAULT 0,
  stone            numeric(10,2) NOT NULL DEFAULT 0,
  food             numeric(10,2) NOT NULL DEFAULT 0,
  streak_count     int          NOT NULL DEFAULT 0,
  last_workout_at  timestamptz,

  -- Full game state blob
  state_data       jsonb        NOT NULL DEFAULT '{}',

  -- Sync versioning
  version          int          NOT NULL DEFAULT 1,
  updated_at       timestamptz  NOT NULL DEFAULT now(),
  synced_at        timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.game_states IS 'Cloud save — one per user. Indexed fields for leaderboards, rest in state_data JSONB.';

CREATE INDEX idx_game_states_total_mm      ON public.game_states (total_mm DESC);
CREATE INDEX idx_game_states_streak        ON public.game_states (streak_count DESC);
CREATE INDEX idx_game_states_rathaus_level ON public.game_states (rathaus_level DESC);

-- ── Workout Logs ────────────────────────────────────────────────────────────

CREATE TABLE public.workout_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_type    text NOT NULL,
  duration_min    numeric(6,1)  NOT NULL DEFAULT 0,
  active_kcal     numeric(8,1)  NOT NULL DEFAULT 0,
  steps           int           NOT NULL DEFAULT 0,
  avg_hr          int,
  hr_zone         text,
  mm_earned       numeric(10,2) NOT NULL DEFAULT 0,
  protein_earned  int           NOT NULL DEFAULT 0,
  workout_date    date          NOT NULL,
  recorded_at     timestamptz   NOT NULL DEFAULT now(),
  healthkit_uuid  text UNIQUE
);

COMMENT ON TABLE public.workout_logs IS 'Immutable log of every workout synced from HealthKit.';

CREATE INDEX idx_workout_logs_user_date ON public.workout_logs (user_id, workout_date DESC);

-- ── Weekly Stats ────────────────────────────────────────────────────────────

CREATE TABLE public.weekly_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start      date NOT NULL,
  total_mm        numeric(12,2) NOT NULL DEFAULT 0,
  total_protein   int           NOT NULL DEFAULT 0,
  total_workouts  int           NOT NULL DEFAULT 0,
  total_minutes   numeric(8,1)  NOT NULL DEFAULT 0,
  total_kcal      numeric(10,1) NOT NULL DEFAULT 0,
  total_steps     int           NOT NULL DEFAULT 0,
  streak_max      int           NOT NULL DEFAULT 0,
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (user_id, week_start)
);

COMMENT ON TABLE public.weekly_stats IS 'Aggregated weekly data for leaderboard queries.';

CREATE INDEX idx_weekly_stats_leaderboard ON public.weekly_stats (week_start, total_mm DESC);

-- ── Trigger: handle_new_user ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    )
  );

  INSERT INTO public.game_states (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Trigger: update_updated_at ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_game_states_updated_at
  BEFORE UPDATE ON public.game_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_weekly_stats_updated_at
  BEFORE UPDATE ON public.weekly_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Function: upsert_weekly_stats ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_weekly_stats(
  p_user_id  uuid,
  p_mm       numeric,
  p_protein  int,
  p_minutes  numeric,
  p_kcal     numeric,
  p_steps    int,
  p_streak   int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start date := date_trunc('week', current_date)::date;
BEGIN
  INSERT INTO public.weekly_stats (user_id, week_start, total_mm, total_protein, total_workouts, total_minutes, total_kcal, total_steps, streak_max)
  VALUES (p_user_id, v_week_start, p_mm, p_protein, 1, p_minutes, p_kcal, p_steps, p_streak)
  ON CONFLICT (user_id, week_start) DO UPDATE SET
    total_mm       = weekly_stats.total_mm       + EXCLUDED.total_mm,
    total_protein   = weekly_stats.total_protein   + EXCLUDED.total_protein,
    total_workouts  = weekly_stats.total_workouts  + 1,
    total_minutes   = weekly_stats.total_minutes   + EXCLUDED.total_minutes,
    total_kcal      = weekly_stats.total_kcal      + EXCLUDED.total_kcal,
    total_steps     = weekly_stats.total_steps     + EXCLUDED.total_steps,
    streak_max      = GREATEST(weekly_stats.streak_max, EXCLUDED.streak_max);
END;
$$;
