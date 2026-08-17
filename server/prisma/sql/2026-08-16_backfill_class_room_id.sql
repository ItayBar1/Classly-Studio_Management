-- ============================================================================
-- Backfill classes.room_id from the free-text location_room. Safe to re-run.
--
-- WHY
-- classes.room_id is the FK to studio_rooms, but AddClassModal only ever sent
-- location_room (free text), so every existing row has room_id = NULL. The
-- admin schedule grid builds its columns from the studio's rooms and matched
-- classes by comparing location_room to the room *name*, so a class whose name
-- matched nothing silently vanished from the schedule while still appearing in
-- the course list and in attendance.
--
-- This links every class that can be linked: same studio, same branch, and a
-- location_room equal to the room's name (whitespace-insensitive). Rows that
-- match no room are left alone — the grid now shows them under a
-- "ללא שיבוץ חדר" column instead of dropping them.
--
-- HOW TO RUN (from the repo root on the server):
--   docker exec -i classly-db psql -U itay -d classly_db -v ON_ERROR_STOP=1 \
--     < server/prisma/sql/2026-08-16_backfill_class_room_id.sql
--
-- Nothing is deleted and location_room is left untouched.
-- ============================================================================

BEGIN;

\echo '--- classes with no room link, before ---'
SELECT count(*) AS unlinked_before FROM public.classes WHERE room_id IS NULL;

UPDATE public.classes c
SET room_id = r.id
FROM public.studio_rooms r
WHERE c.room_id IS NULL
  AND r.studio_id = c.studio_id
  AND r.branch_id = c.branch_id
  AND btrim(r.name) = btrim(c.location_room);

\echo '--- classes with no room link, after (these show under "ללא שיבוץ חדר") ---'
SELECT count(*) AS unlinked_after FROM public.classes WHERE room_id IS NULL;

COMMIT;

-- ---------------------------------------------------------------------------
-- What is left unlinked, and why: the location_room value has no matching room
-- in that branch. Either create a room with that name or reassign the class.
-- ---------------------------------------------------------------------------
SELECT c.name AS class_name,
       c.day_of_week,
       c.start_time,
       c.location_room,
       b.name AS branch
FROM public.classes c
LEFT JOIN public.branches b ON b.id = c.branch_id
WHERE c.room_id IS NULL
  AND c.is_active
ORDER BY b.name, c.day_of_week, c.start_time;
