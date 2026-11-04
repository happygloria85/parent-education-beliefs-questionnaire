CREATE TABLE IF NOT EXISTS questionnaire_submissions (
  id BIGSERIAL PRIMARY KEY,
  parent_name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL,
  grade TEXT NOT NULL,
  gender TEXT NOT NULL,
  answers_json JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE questionnaire_submissions
  ALTER COLUMN contact DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questionnaire_submissions_completed
  ON questionnaire_submissions(completed_at DESC, id DESC);
