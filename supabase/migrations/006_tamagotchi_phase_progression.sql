-- Tamagotchi phase progression: starter days 1-4 + mood rotation after day 4

ALTER TABLE public.tamagotchi_phases
  ADD COLUMN IF NOT EXISTS phase_kind TEXT NOT NULL DEFAULT 'mood'
    CHECK (phase_kind IN ('starter', 'mood')),
  ADD COLUMN IF NOT EXISTS day_number INT
    CHECK (day_number IS NULL OR (day_number >= 1 AND day_number <= 4)),
  ADD COLUMN IF NOT EXISTS rotation_order INT NOT NULL DEFAULT 0;

-- Starter days must be unique
CREATE UNIQUE INDEX IF NOT EXISTS tamagotchi_phases_starter_day_unique
  ON public.tamagotchi_phases (day_number)
  WHERE phase_kind = 'starter' AND day_number IS NOT NULL;

-- Mood names should be unique
CREATE UNIQUE INDEX IF NOT EXISTS tamagotchi_phases_mood_name_unique
  ON public.tamagotchi_phases (phase_name)
  WHERE phase_kind = 'mood';

-- Starter day constraint: day_number required for starter, null for mood
ALTER TABLE public.tamagotchi_phases
  DROP CONSTRAINT IF EXISTS tamagotchi_phases_starter_day_check;

ALTER TABLE public.tamagotchi_phases
  ADD CONSTRAINT tamagotchi_phases_starter_day_check
  CHECK (
    (phase_kind = 'starter' AND day_number IS NOT NULL)
    OR (phase_kind = 'mood' AND day_number IS NULL)
  );

-- Optional seed rows (replace image_url after uploading sprites)
INSERT INTO public.tamagotchi_phases (phase_name, phase_kind, day_number, rotation_order, image_url, condition_description)
VALUES
  ('day_1', 'starter', 1, 0, 'https://placehold.co/128x128/3ddbcf/131421?text=Day+1', 'Day 1 — Your companion has hatched!'),
  ('day_2', 'starter', 2, 0, 'https://placehold.co/128x128/ff9a56/131421?text=Day+2', 'Day 2 — Growing stronger every session.'),
  ('day_3', 'starter', 3, 0, 'https://placehold.co/128x128/ff4d8d/131421?text=Day+3', 'Day 3 — Learning the city-pop rhythm.'),
  ('day_4', 'starter', 4, 0, 'https://placehold.co/128x128/9b59b6/131421?text=Day+4', 'Day 4 — Almost ready for the open world!')
ON CONFLICT (phase_name) DO NOTHING;

INSERT INTO public.tamagotchi_phases (phase_name, phase_kind, day_number, rotation_order, image_url, condition_description)
VALUES
  ('happy', 'mood', NULL, 0, 'https://placehold.co/128x128/3ddbcf/131421?text=Happy', 'Thriving — streak active and today is on track!'),
  ('hungry', 'mood', NULL, 1, 'https://placehold.co/128x128/ff9a56/131421?text=Hungry', 'Hungry — complete today''s task to cheer them up.'),
  ('sad', 'mood', NULL, 2, 'https://placehold.co/128x128/ff4d8d/131421?text=Sad', 'Sad — no active streak. Start learning again!')
ON CONFLICT (phase_name) DO NOTHING;
