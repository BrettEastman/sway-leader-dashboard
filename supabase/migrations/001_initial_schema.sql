-- Initial schema migration for Sway Leader Dashboard
-- Creates all tables based on schema.json
--
-- This script can be run multiple times safely:
-- - Drops all tables if they exist (in reverse dependency order)
-- - Creates all tables with proper structure
-- - Can be re-run to reset the database to a clean state

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all tables in reverse dependency order (if they exist)
-- This allows re-running the script to reset everything
DROP TABLE IF EXISTS ballot_item_options CASCADE;
DROP TABLE IF EXISTS candidacies CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS office_terms CASCADE;
DROP TABLE IF EXISTS voter_verification_jurisdiction_rels CASCADE;
DROP TABLE IF EXISTS influence_target_viewpoint_group_rels CASCADE;
DROP TABLE IF EXISTS profile_viewpoint_group_rels CASCADE;
DROP TABLE IF EXISTS profile_user_rels CASCADE;
DROP TABLE IF EXISTS measures CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS voter_verifications CASCADE;
DROP TABLE IF EXISTS id_verifications CASCADE;
DROP TABLE IF EXISTS influence_targets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS ballot_items CASCADE;
DROP TABLE IF EXISTS slugs CASCADE;
DROP TABLE IF EXISTS viewpoint_groups CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS jurisdictions CASCADE;
DROP TABLE IF EXISTS elections CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS profile_viewpoint_group_rel_types CASCADE;

-- Enum/Type tables (loaded first, no dependencies)

-- Profile Viewpoint Group Relationship Types
CREATE TABLE IF NOT EXISTS profile_viewpoint_group_rel_types (
  value TEXT PRIMARY KEY,
  description TEXT
);

-- Parties
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  name TEXT,
  abbreviation TEXT,
  civic_engine_id TEXT
);

-- Elections
CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  name TEXT,
  poll_date DATE,
  civic_engine_id TEXT
);

-- Jurisdictions
CREATE TABLE IF NOT EXISTS jurisdictions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  name TEXT,
  geoid TEXT,
  ce_geofence_id TEXT,
  ocdid TEXT,
  valid_from DATE,
  valid_to DATE,
  state TEXT,
  estimated_name TEXT,
  mtfcc TEXT,
  direct_embedding_id UUID,
  level TEXT
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Persons
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  full_name TEXT,
  civic_engine_id TEXT,
  civic_engine_image TEXT,
  direct_embedding_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Viewpoint Groups
-- Note: current_slug_id FK is added after slugs table is created due to circular dependency
CREATE TABLE IF NOT EXISTS viewpoint_groups (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  title TEXT,
  description TEXT,
  current_slug_id UUID,
  influence_target_notes TEXT,
  is_searchable BOOLEAN,
  is_public BOOLEAN,
  direct_embedding_id UUID,
  aggregate_embedding_id UUID,
  title_embedding_id UUID
);

-- Slugs
CREATE TABLE IF NOT EXISTS slugs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  slug TEXT NOT NULL,
  is_current BOOLEAN,
  updated_at TIMESTAMPTZ,
  viewpoint_group_id UUID REFERENCES viewpoint_groups(id),
  direct_embedding_id UUID
);

-- Add foreign key from viewpoint_groups to slugs (circular dependency handled)
-- This constraint is deferred so data can be loaded in either order
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'viewpoint_groups_current_slug_id_fkey'
  ) THEN
    ALTER TABLE viewpoint_groups
    ADD CONSTRAINT viewpoint_groups_current_slug_id_fkey
    FOREIGN KEY (current_slug_id) REFERENCES slugs(id);
  END IF;
END $$;

-- Ballot Items
CREATE TABLE IF NOT EXISTS ballot_items (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  election_id UUID REFERENCES elections(id),
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  num_selections_max INTEGER,
  is_ranked_choice BOOLEAN,
  num_winners INTEGER
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  person_id UUID REFERENCES persons(id),
  display_name_long TEXT,
  display_name_short TEXT,
  bio TEXT,
  extended_bio TEXT,
  avatar_media_id UUID,
  header_image_id UUID,
  profile_type TEXT,
  location TEXT,
  is_disabled BOOLEAN,
  is_id_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Influence Targets
CREATE TABLE IF NOT EXISTS influence_targets (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  description TEXT,
  civic_engine_id TEXT,
  direct_embedding_id UUID,
  aggregate_embedding_id UUID,
  title_embedding_id UUID
);

-- ID Verifications
CREATE TABLE IF NOT EXISTS id_verifications (
  id UUID PRIMARY KEY,
  person_id UUID REFERENCES persons(id),
  id_first_name TEXT,
  id_last_name TEXT,
  needs_manual_review BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Voter Verifications
CREATE TABLE IF NOT EXISTS voter_verifications (
  id UUID PRIMARY KEY,
  person_id UUID REFERENCES persons(id),
  id_verification_id UUID REFERENCES id_verifications(id),
  is_fully_verified BOOLEAN,
  has_confirmed_voted BOOLEAN,
  needs_manual_review BOOLEAN,
  id_match_needs_manual_review BOOLEAN,
  vv_first_name TEXT,
  vv_last_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Offices
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  influence_target_id UUID REFERENCES influence_targets(id),
  name TEXT,
  civic_engine_id TEXT,
  level TEXT,
  judicial BOOLEAN,
  retention BOOLEAN,
  direct_embedding_id UUID
);

-- Measures
CREATE TABLE IF NOT EXISTS measures (
  id UUID PRIMARY KEY,
  name TEXT,
  title TEXT,
  summary TEXT,
  full_text TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  con_snippet TEXT,
  pro_snippet TEXT,
  influence_target_id UUID REFERENCES influence_targets(id),
  ballot_item_id UUID REFERENCES ballot_items(id),
  civic_engine_id TEXT,
  direct_embedding_id UUID
);

-- Relationship/Junction Tables

-- Profile User Relations
CREATE TABLE IF NOT EXISTS profile_user_rels (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile Viewpoint Group Relations
CREATE TABLE IF NOT EXISTS profile_viewpoint_group_rels (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  profile_id UUID REFERENCES profiles(id),
  viewpoint_group_id UUID REFERENCES viewpoint_groups(id),
  type TEXT REFERENCES profile_viewpoint_group_rel_types(value),
  is_public BOOLEAN
);

-- Influence Target Viewpoint Group Relations
CREATE TABLE IF NOT EXISTS influence_target_viewpoint_group_rels (
  id UUID PRIMARY KEY,
  influence_target_id UUID REFERENCES influence_targets(id),
  viewpoint_group_id UUID REFERENCES viewpoint_groups(id),
  weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voter Verification Jurisdiction Relations
CREATE TABLE IF NOT EXISTS voter_verification_jurisdiction_rels (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  voter_verification_id UUID REFERENCES voter_verifications(id)
);

-- Office Terms
CREATE TABLE IF NOT EXISTS office_terms (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  office_id UUID REFERENCES offices(id),
  holder_id UUID REFERENCES persons(id),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN,
  civic_engine_id TEXT
);

-- Races
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  ballot_item_id UUID REFERENCES ballot_items(id),
  office_term_id UUID REFERENCES office_terms(id),
  party_id UUID REFERENCES parties(id),
  is_partisan BOOLEAN,
  is_primary BOOLEAN,
  is_recall BOOLEAN,
  is_runoff BOOLEAN,
  is_off_schedule BOOLEAN,
  civic_engine_id TEXT
);

-- Candidacies
CREATE TABLE IF NOT EXISTS candidacies (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  race_id UUID REFERENCES races(id),
  candidate_id UUID REFERENCES persons(id),
  party_id UUID REFERENCES parties(id),
  is_withdrawn BOOLEAN,
  result TEXT,
  civic_engine_id TEXT,
  direct_embedding_id UUID
);

-- Ballot Item Options
CREATE TABLE IF NOT EXISTS ballot_item_options (
  id UUID PRIMARY KEY,
  text TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  candidacy_id UUID REFERENCES candidacies(id),
  ballot_item_id UUID REFERENCES ballot_items(id)
);

-- Create indexes for foreign keys and commonly queried fields

-- Viewpoint Groups
CREATE INDEX IF NOT EXISTS idx_viewpoint_groups_current_slug_id ON viewpoint_groups(current_slug_id);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_person_id ON profiles(person_id);

-- Profile Viewpoint Group Relations
CREATE INDEX IF NOT EXISTS idx_pvgr_profile_id ON profile_viewpoint_group_rels(profile_id);
CREATE INDEX IF NOT EXISTS idx_pvgr_viewpoint_group_id ON profile_viewpoint_group_rels(viewpoint_group_id);
CREATE INDEX IF NOT EXISTS idx_pvgr_type ON profile_viewpoint_group_rels(type);

-- Voter Verifications
CREATE INDEX IF NOT EXISTS idx_voter_verifications_person_id ON voter_verifications(person_id);
CREATE INDEX IF NOT EXISTS idx_voter_verifications_id_verification_id ON voter_verifications(id_verification_id);

-- Voter Verification Jurisdiction Relations
CREATE INDEX IF NOT EXISTS idx_vvjr_voter_verification_id ON voter_verification_jurisdiction_rels(voter_verification_id);
CREATE INDEX IF NOT EXISTS idx_vvjr_jurisdiction_id ON voter_verification_jurisdiction_rels(jurisdiction_id);

-- Ballot Items
CREATE INDEX IF NOT EXISTS idx_ballot_items_election_id ON ballot_items(election_id);
CREATE INDEX IF NOT EXISTS idx_ballot_items_jurisdiction_id ON ballot_items(jurisdiction_id);

-- Elections (for filtering by poll_date)
CREATE INDEX IF NOT EXISTS idx_elections_poll_date ON elections(poll_date);

-- Jurisdictions (for filtering by state)
CREATE INDEX IF NOT EXISTS idx_jurisdictions_state ON jurisdictions(state);

-- Influence Targets
CREATE INDEX IF NOT EXISTS idx_influence_targets_jurisdiction_id ON influence_targets(jurisdiction_id);

-- Races
CREATE INDEX IF NOT EXISTS idx_races_ballot_item_id ON races(ballot_item_id);
CREATE INDEX IF NOT EXISTS idx_races_office_term_id ON races(office_term_id);

-- Candidacies
CREATE INDEX IF NOT EXISTS idx_candidacies_race_id ON candidacies(race_id);
CREATE INDEX IF NOT EXISTS idx_candidacies_candidate_id ON candidacies(candidate_id);

