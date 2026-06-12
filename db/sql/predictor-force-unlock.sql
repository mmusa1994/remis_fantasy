-- Owner's explicit "Otključaj" for category predictions must actually open
-- them even after lock_at / registration_lock_at have passed — e.g. a player
-- forgot to enter his championship-winner pick before the event started and
-- the owner wants to let him fill it in.
--
-- predictions_locked        TRUE  -> hard lock (overrides everything)
-- predictions_force_unlocked TRUE -> hard open (overrides time locks & status)
-- both FALSE                      -> automatic time-based locking (default)
--
-- The owner UI keeps the two mutually exclusive: "Zaključaj" sets
-- locked=TRUE/force_unlocked=FALSE, "Otključaj" sets locked=FALSE/force_unlocked=TRUE.

ALTER TABLE predictor_tournaments
  ADD COLUMN IF NOT EXISTS predictions_force_unlocked BOOLEAN NOT NULL DEFAULT FALSE;
