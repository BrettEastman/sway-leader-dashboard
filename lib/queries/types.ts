// TypeScript interfaces for query result types

export interface SwayScoreResult {
  count: number;
}

export interface ElectoralInfluenceByJurisdiction {
  jurisdictionId: string;
  jurisdictionName: string | null;
  supporterCount: number;
  state: string | null;
}

export interface ElectoralInfluenceByRace {
  raceId: string;
  raceName: string | null;
  jurisdictionId: string;
  jurisdictionName: string | null;
  electionId: string;
  electionName: string | null;
  pollDate: string | null;
  supporterCount: number;
}

export interface UpcomingElectionRace {
  raceId: string;
  supporterCount: number;
}

export interface UpcomingElection {
  electionId: string;
  electionName: string | null;
  pollDate: string | null;
  totalSupporters: number;
  races: UpcomingElectionRace[];
}

export interface ElectoralInfluenceResult {
  byJurisdiction: ElectoralInfluenceByJurisdiction[];
  byRace: ElectoralInfluenceByRace[];
  upcomingElections: UpcomingElection[];
}

export interface GrowthOverTimeDataPoint {
  date: string; // ISO date string
  cumulativeCount: number;
  periodChange?: number; // Optional: change from previous period
}

export interface GrowthOverTimeResult {
  dataPoints: GrowthOverTimeDataPoint[];
  totalGrowth: number; // Overall change
  growthRate?: number; // Percentage or ratio
}

export interface NetworkLeader {
  profileId: string;
  displayName: string | null;
  viewpointGroupId: string;
  viewpointGroupTitle: string | null;
  downstreamVerifiedVoters: number;
  supporterCount?: number; // Optional: total supporters (not just verified)
}

export interface NetworkReachResult {
  networkLeaders: NetworkLeader[];
  totalDownstreamReach: number; // Sum of all downstream verified voters
}

