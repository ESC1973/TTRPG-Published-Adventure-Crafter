
export interface Thread {
  id: string;
  goal: string;
  description: string;
  location?: string;
  npcs?: string[];
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  disposition: string;
  motivation: string;
  secrets: string;
  statBlockSuggestion?: string;
}

export interface AdventureFeature {
  id: string;
  feature: string;
  description: string;
}

export interface Encounter {
  name: string;
  trigger: string;
  description: string;
  statBlockSuggestions?: string[];
}

export interface Scene {
  id: string;
  title: string;
  locationId: string;
  setup: string;
  obstacles: string[];
  mechanics: string[];
  milestones: string[];
  encounters: Encounter[];
  associatedNpcs: string[];
  associatedThreads: string[];
  enemyProfile?: string;
  branching: { milestone: string; nextSceneId: string }[];
}

export interface SubLocation {
  name: string;
  description: string;
  significance: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  tone: string;
  associatedNpcs: string[];
  associatedThreads: string[];
  secrets: string[];
  links: { description: string; locationId: string }[];
  sublocations?: SubLocation[];
}

export interface WorldState {
  threads: Thread[];
  npcs: NPC[];
  adventureFeatures: AdventureFeature[];
  scenes: Scene[];
  locations: Location[];
}