-- Enable Row Level Security (RLS) on all public tables
-- This migration enables RLS and creates policies that allow public read access
-- Since this is a public dashboard showing leader metrics, all data should be readable

-- Enable RLS on all tables
ALTER TABLE profile_viewpoint_group_rel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewpoint_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE slugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ballot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_user_rels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_viewpoint_group_rels ENABLE ROW LEVEL SECURITY;
ALTER TABLE influence_target_viewpoint_group_rels ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_verification_jurisdiction_rels ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ballot_item_options ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (SELECT)
-- These policies allow anyone to read data, which is appropriate for a public dashboard

-- Profile Viewpoint Group Relationship Types
CREATE POLICY "Allow public read access" ON profile_viewpoint_group_rel_types
  FOR SELECT USING (true);

-- Parties
CREATE POLICY "Allow public read access" ON parties
  FOR SELECT USING (true);

-- Elections
CREATE POLICY "Allow public read access" ON elections
  FOR SELECT USING (true);

-- Jurisdictions
CREATE POLICY "Allow public read access" ON jurisdictions
  FOR SELECT USING (true);

-- Users (public read for dashboard metrics)
CREATE POLICY "Allow public read access" ON users
  FOR SELECT USING (true);

-- Persons
CREATE POLICY "Allow public read access" ON persons
  FOR SELECT USING (true);

-- Viewpoint Groups
CREATE POLICY "Allow public read access" ON viewpoint_groups
  FOR SELECT USING (true);

-- Slugs
CREATE POLICY "Allow public read access" ON slugs
  FOR SELECT USING (true);

-- Ballot Items
CREATE POLICY "Allow public read access" ON ballot_items
  FOR SELECT USING (true);

-- Profiles
CREATE POLICY "Allow public read access" ON profiles
  FOR SELECT USING (true);

-- Influence Targets
CREATE POLICY "Allow public read access" ON influence_targets
  FOR SELECT USING (true);

-- ID Verifications
CREATE POLICY "Allow public read access" ON id_verifications
  FOR SELECT USING (true);

-- Voter Verifications
CREATE POLICY "Allow public read access" ON voter_verifications
  FOR SELECT USING (true);

-- Offices
CREATE POLICY "Allow public read access" ON offices
  FOR SELECT USING (true);

-- Measures
CREATE POLICY "Allow public read access" ON measures
  FOR SELECT USING (true);

-- Profile User Relations
CREATE POLICY "Allow public read access" ON profile_user_rels
  FOR SELECT USING (true);

-- Profile Viewpoint Group Relations
CREATE POLICY "Allow public read access" ON profile_viewpoint_group_rels
  FOR SELECT USING (true);

-- Influence Target Viewpoint Group Relations
CREATE POLICY "Allow public read access" ON influence_target_viewpoint_group_rels
  FOR SELECT USING (true);

-- Voter Verification Jurisdiction Relations
CREATE POLICY "Allow public read access" ON voter_verification_jurisdiction_rels
  FOR SELECT USING (true);

-- Office Terms
CREATE POLICY "Allow public read access" ON office_terms
  FOR SELECT USING (true);

-- Races
CREATE POLICY "Allow public read access" ON races
  FOR SELECT USING (true);

-- Candidacies
CREATE POLICY "Allow public read access" ON candidacies
  FOR SELECT USING (true);

-- Ballot Item Options
CREATE POLICY "Allow public read access" ON ballot_item_options
  FOR SELECT USING (true);

-- Note: Write operations (INSERT, UPDATE, DELETE) are not allowed through these policies
-- Only the admin client (using service role key) can perform write operations
-- This is the intended behavior for a read-only public dashboard

