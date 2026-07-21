-- Adds a priority column to journal_event so events can be manually ordered within a case.
-- Existing events are backfilled based on their current timestamp order per case.
ALTER TABLE data.journal_event
    ADD COLUMN IF NOT EXISTS priority INTEGER;

WITH ordered AS (SELECT id,
                        ROW_NUMBER() OVER (PARTITION BY case_id ORDER BY timestamp ASC) - 1 AS rn
                 FROM data.journal_event)
UPDATE data.journal_event je
SET priority = ordered.rn
FROM ordered
WHERE je.id = ordered.id
  AND je.priority IS NULL;
