-- ============================================================================
-- FitRealm Phase 1 — Row Level Security Policies
-- ============================================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats  ENABLE ROW LEVEL SECURITY;

-- ── Profiles ────────────────────────────────────────────────────────────────

CREATE POLICY profiles_select
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Game States ─────────────────────────────────────────────────────────────

CREATE POLICY game_states_select_own
  ON public.game_states FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY game_states_insert_own
  ON public.game_states FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY game_states_update_own
  ON public.game_states FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Workout Logs ────────────────────────────────────────────────────────────

CREATE POLICY workout_logs_select_own
  ON public.workout_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY workout_logs_insert_own
  ON public.workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── Weekly Stats ────────────────────────────────────────────────────────────

CREATE POLICY weekly_stats_select
  ON public.weekly_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY weekly_stats_insert_own
  ON public.weekly_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY weekly_stats_update_own
  ON public.weekly_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
