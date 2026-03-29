/*
  # Create Clone Manager Tables

  ## Overview
  Creates the core tables for the Website Clone Manager interface.

  ## New Tables

  ### 1. projects
  Stores each website clone project.
  - `id` (uuid, primary key) — unique identifier
  - `name` (text) — display name for the project
  - `target_url` (text) — the URL of the website being cloned
  - `status` (text) — current state: 'idle', 'in-progress', or 'complete'
  - `notes` (text) — optional notes about the project
  - `screenshot_url` (text) — optional URL to a reference screenshot
  - `created_at` (timestamptz) — when the project was created
  - `updated_at` (timestamptz) — last modified time

  ### 2. design_tokens
  Stores extracted design tokens per project.
  - `id` (uuid, primary key)
  - `project_id` (uuid, FK -> projects.id) — owning project
  - `category` (text) — 'color', 'typography', 'spacing', 'radius', 'shadow', 'other'
  - `name` (text) — token name (e.g., "primary-bg")
  - `value` (text) — token value (e.g., "#1a1a2e", "16px", "Inter")
  - `created_at` (timestamptz)

  ### 3. assets
  Tracks downloaded or referenced assets per project.
  - `id` (uuid, primary key)
  - `project_id` (uuid, FK -> projects.id) — owning project
  - `asset_type` (text) — 'image', 'video', 'font', 'svg', 'other'
  - `name` (text) — descriptive name for the asset
  - `source_url` (text) — original URL from the target site
  - `local_path` (text) — path after being downloaded locally
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all three tables
  - All tables allow anonymous read AND write (this is a personal tool, no auth required)
    — Using anon role policies for full access to enable public usage

  ## Notes
  1. `projects.status` is constrained to valid values via a CHECK constraint
  2. `design_tokens.category` is constrained to valid category values
  3. `assets.asset_type` is constrained to valid type values
  4. Foreign keys use CASCADE delete so removing a project removes all its tokens and assets
  5. An `updated_at` trigger keeps `projects.updated_at` current on every update
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  target_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'in-progress', 'complete')),
  notes text NOT NULL DEFAULT '',
  screenshot_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS design_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('color', 'typography', 'spacing', 'radius', 'shadow', 'other')),
  name text NOT NULL DEFAULT '',
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'other' CHECK (asset_type IN ('image', 'video', 'font', 'svg', 'other')),
  name text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  local_path text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS design_tokens_project_id_idx ON design_tokens(project_id);
CREATE INDEX IF NOT EXISTS assets_project_id_idx ON assets(project_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_projects_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER set_projects_updated_at
      BEFORE UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on projects"
  ON projects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert on projects"
  ON projects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on projects"
  ON projects FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete on projects"
  ON projects FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon select on design_tokens"
  ON design_tokens FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert on design_tokens"
  ON design_tokens FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on design_tokens"
  ON design_tokens FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete on design_tokens"
  ON design_tokens FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon select on assets"
  ON assets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert on assets"
  ON assets FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on assets"
  ON assets FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete on assets"
  ON assets FOR DELETE
  TO anon
  USING (true);
