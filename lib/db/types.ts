// Database type definitions based on schema.json

export interface ProfileViewpointGroupRelType {
  value: 'default' | 'administrator' | 'leader' | 'bookmarker' | 'supporter';
  description: string;
}

export interface Party {
  id: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  abbreviation: string | null;
  civic_engine_id: string | null;
}

export interface Election {
  id: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  poll_date: string | null;
  civic_engine_id: string | null;
}

export interface Jurisdiction {
  id: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  geoid: string | null;
  ce_geofence_id: string | null;
  ocdid: string | null;
  valid_from: string | null;
  valid_to: string | null;
  state: string | null;
  estimated_name: string | null;
  mtfcc: string | null;
  direct_embedding_id: string | null;
  level: string | null;
}

export interface User {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Person {
  id: string;
  user_id: string | null;
  full_name: string | null;
  civic_engine_id: string | null;
  civic_engine_image: string | null;
  direct_embedding_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViewpointGroup {
  id: string;
  created_at: string;
  updated_at: string;
  title: string | null;
  description: string | null;
  current_slug_id: string | null;
  influence_target_notes: string | null;
  is_searchable: boolean | null;
  is_public: boolean | null;
  direct_embedding_id: string | null;
  aggregate_embedding_id: string | null;
  title_embedding_id: string | null;
}

export interface Slug {
  id: string;
  created_at: string;
  slug: string;
  is_current: boolean | null;
  updated_at: string;
  viewpoint_group_id: string;
  direct_embedding_id: string | null;
}

export interface BallotItem {
  id: string;
  created_at: string;
  updated_at: string;
  election_id: string;
  jurisdiction_id: string;
  num_selections_max: number | null;
  is_ranked_choice: boolean | null;
  num_winners: number | null;
}

export interface Profile {
  id: string;
  person_id: string;
  display_name_long: string | null;
  display_name_short: string | null;
  bio: string | null;
  extended_bio: string | null;
  avatar_media_id: string | null;
  header_image_id: string | null;
  profile_type: string | null;
  location: string | null;
  is_disabled: boolean | null;
  is_id_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface InfluenceTarget {
  id: string;
  created_at: string;
  updated_at: string;
  jurisdiction_id: string;
  description: string | null;
  civic_engine_id: string | null;
  direct_embedding_id: string | null;
  aggregate_embedding_id: string | null;
}

export interface IdVerification {
  id: string;
  person_id: string;
  id_first_name: string | null;
  id_last_name: string | null;
  needs_manual_review: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface VoterVerification {
  id: string;
  person_id: string;
  id_verification_id: string | null;
  is_fully_verified: boolean | null;
  has_confirmed_voted: boolean | null;
  needs_manual_review: boolean | null;
  id_match_needs_manual_review: boolean | null;
  vv_first_name: string | null;
  vv_last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Office {
  id: string;
  created_at: string;
  updated_at: string;
  influence_target_id: string;
  name: string | null;
  civic_engine_id: string | null;
  level: string | null;
  judicial: boolean | null;
}

export interface Measure {
  id: string;
  name: string | null;
  title: string | null;
  summary: string | null;
  full_text: string | null;
  created_at: string;
  updated_at: string;
  con_snippet: string | null;
  pro_snippet: string | null;
  influence_target_id: string | null;
  ballot_item_id: string | null;
}

export interface ProfileUserRel {
  id: string;
  profile_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileViewpointGroupRel {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  viewpoint_group_id: string;
  type: 'default' | 'administrator' | 'leader' | 'bookmarker' | 'supporter';
  is_public: boolean | null;
}

export interface InfluenceTargetViewpointGroupRel {
  id: string;
  influence_target_id: string;
  viewpoint_group_id: string;
  weight: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface VoterVerificationJurisdictionRel {
  id: string;
  created_at: string;
  updated_at: string;
  jurisdiction_id: string;
  voter_verification_id: string;
}

export interface OfficeTerm {
  id: string;
  created_at: string;
  updated_at: string;
  office_id: string;
  holder_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
}

export interface Race {
  id: string;
  created_at: string;
  updated_at: string;
  ballot_item_id: string;
  office_term_id: string;
  party_id: string | null;
  is_partisan: boolean | null;
  is_primary: boolean | null;
}

export interface Candidacy {
  id: string;
  created_at: string;
  updated_at: string;
  race_id: string;
  candidate_id: string;
  party_id: string | null;
  is_withdrawn: boolean | null;
  result: string | null;
  civic_engine_id: string | null;
}

export interface BallotItemOption {
  id: string;
  text: string | null;
  created_at: string;
  updated_at: string;
  candidacy_id: string | null;
  ballot_item_id: string;
}

// Database table name mappings for type-safe queries
export type Database = {
  public: {
    Tables: {
      profile_viewpoint_group_rel_types: {
        Row: ProfileViewpointGroupRelType;
        Insert: ProfileViewpointGroupRelType;
        Update: Partial<ProfileViewpointGroupRelType>;
      };
      parties: {
        Row: Party;
        Insert: Party;
        Update: Partial<Party>;
      };
      elections: {
        Row: Election;
        Insert: Election;
        Update: Partial<Election>;
      };
      jurisdictions: {
        Row: Jurisdiction;
        Insert: Jurisdiction;
        Update: Partial<Jurisdiction>;
      };
      users: {
        Row: User;
        Insert: User;
        Update: Partial<User>;
      };
      persons: {
        Row: Person;
        Insert: Person;
        Update: Partial<Person>;
      };
      viewpoint_groups: {
        Row: ViewpointGroup;
        Insert: ViewpointGroup;
        Update: Partial<ViewpointGroup>;
      };
      slugs: {
        Row: Slug;
        Insert: Slug;
        Update: Partial<Slug>;
      };
      ballot_items: {
        Row: BallotItem;
        Insert: BallotItem;
        Update: Partial<BallotItem>;
      };
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Profile>;
      };
      influence_targets: {
        Row: InfluenceTarget;
        Insert: InfluenceTarget;
        Update: Partial<InfluenceTarget>;
      };
      id_verifications: {
        Row: IdVerification;
        Insert: IdVerification;
        Update: Partial<IdVerification>;
      };
      voter_verifications: {
        Row: VoterVerification;
        Insert: VoterVerification;
        Update: Partial<VoterVerification>;
      };
      offices: {
        Row: Office;
        Insert: Office;
        Update: Partial<Office>;
      };
      measures: {
        Row: Measure;
        Insert: Measure;
        Update: Partial<Measure>;
      };
      profile_user_rels: {
        Row: ProfileUserRel;
        Insert: ProfileUserRel;
        Update: Partial<ProfileUserRel>;
      };
      profile_viewpoint_group_rels: {
        Row: ProfileViewpointGroupRel;
        Insert: ProfileViewpointGroupRel;
        Update: Partial<ProfileViewpointGroupRel>;
      };
      influence_target_viewpoint_group_rels: {
        Row: InfluenceTargetViewpointGroupRel;
        Insert: InfluenceTargetViewpointGroupRel;
        Update: Partial<InfluenceTargetViewpointGroupRel>;
      };
      voter_verification_jurisdiction_rels: {
        Row: VoterVerificationJurisdictionRel;
        Insert: VoterVerificationJurisdictionRel;
        Update: Partial<VoterVerificationJurisdictionRel>;
      };
      office_terms: {
        Row: OfficeTerm;
        Insert: OfficeTerm;
        Update: Partial<OfficeTerm>;
      };
      races: {
        Row: Race;
        Insert: Race;
        Update: Partial<Race>;
      };
      candidacies: {
        Row: Candidacy;
        Insert: Candidacy;
        Update: Partial<Candidacy>;
      };
      ballot_item_options: {
        Row: BallotItemOption;
        Insert: BallotItemOption;
        Update: Partial<BallotItemOption>;
      };
    };
  };
};

