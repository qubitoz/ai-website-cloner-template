/*
  # Add Clone Progress Tracking to Projects

  ## Overview
  Adds step-by-step progress tracking columns to the projects table
  to support the AI-assisted cloning workflow.

  ## Modified Tables

  ### projects
  - `current_step` (int) — index of the currently active clone phase (0–5), default 0
  - `ai_log` (text) — accumulated streaming log output from the AI analysis
  - `error_message` (text) — last error message if status is 'error'

  ## Notes
  1. current_step maps to the 6 phases defined in SKILL.md:
     0 = Pre-Flight, 1 = Reconnaissance, 2 = Foundation, 3 = Components,
     4 = Assembly, 5 = Visual QA
  2. ai_log is appended to as the AI streams its analysis
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'current_step'
  ) THEN
    ALTER TABLE projects ADD COLUMN current_step integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'ai_log'
  ) THEN
    ALTER TABLE projects ADD COLUMN ai_log text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE projects ADD COLUMN error_message text NOT NULL DEFAULT '';
  END IF;
END $$;
