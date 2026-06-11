-- Split prediction (category) locking from match locking so the tournament
-- owner can freeze the championship-winner / finalist picks independently of
-- the match-by-match predictions.
--
-- Background: previously the only "lock everything" lever was
-- predictor_tournaments.status = 'locked', which froze BOTH the category
-- predictions and the match predictions at once. Owners need to keep matches
-- predictable (they unlock on their own kickoff schedule) while the category
-- predictions stay locked — otherwise a user could change their tournament
-- winner mid-event.
--
-- These two booleans are independent manual master switches. They are additive:
-- existing status/lock_at/kickoff rules still apply on top of them.

ALTER TABLE predictor_tournaments
  ADD COLUMN IF NOT EXISTS predictions_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS matches_locked     BOOLEAN NOT NULL DEFAULT FALSE;

-- Preserve current behaviour for any tournament that was already locked the
-- old way: a 'locked' tournament had both surfaces frozen, so mirror that into
-- the new flags. (status='finished' keeps locking everything via app logic.)
UPDATE predictor_tournaments
  SET predictions_locked = TRUE,
      matches_locked = TRUE
  WHERE status = 'locked';
