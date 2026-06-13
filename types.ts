
export interface VectorData {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    type: 'chapter' | 'character' | 'lore' | 'item' | 'memory_fact' | 'plot_node'; // Added 'plot_node' for summaries
    referenceId: string;
    importance?: number;
    entities?: string[]; 
  };
}

export interface CharacterStatus {
    emotion: string;
    location: string;
    immediateGoal: string;
    physicalCondition: string; 
    mentalState?: string; 
}

export interface SceneState {
    time: string;
    weather: string;
    location: string;
    timeline: 'present' | 'past' | 'flashback' | 'future'; 
}

export interface Character {
  id: string;
  name: string;
  description: string;
  role: string; 
  socialStatus?: string; 
  relationships?: string; 
  hierarchyLevel?: number; 
  traits: string[];
  appearance: string;
  dialogueStyle?: string;
  status?: CharacterStatus; 
  avatarUrl?: string;
  isCanon?: boolean; 
}

export interface LoreEntry {
    id: string;
    name: string;
    category: string;
    content: string;
}

export interface ItemEntry {
    id: string;
    name: string;
    type: string;
    rank?: string;
    description: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  order: number;
  lastUpdated: number;
  isSummaryIndexed?: boolean; // Flag to track if the plot node is in RAG
  rating?: number; // User rating 1-5
  feedback?: string; // User feedback
}

export interface MemoryEntry {
    id: string;
    content: string;
    category: 'physical' | 'emotional' | 'relational' | 'world' | 'inventory';
    importance: number; 
    timestamp: number;
    entities?: string[]; 
    isVectorized?: boolean; 
}

export interface PinnedMemory {
    physical: string[];   
    emotional: string[];  
    relational: string[]; 
    world: string[];      
    inventory: string[];
    ledger?: MemoryEntry[];
    lastChapterSummary?: string; 
}

export interface StoryAttribute {
    key: string;
    value: string;
}

export interface HornyStyle {
    pacing: string;
    narrativeVoice: string;
    emotionalTone: string;
    description: string;
    writingSample: string;
    styleStrength?: number; 
    isAnalyzed: boolean;
    // Optional specific fields
    dialogueRatio?: string;
    vocabularyComplexity?: string;
}

export interface SegmentConfig {
    isActive: boolean; 
    beats: string[]; 
    beatLengths?: number[]; // ADDED: Array to store word count for each beat
    currentBeatIndex: number; 
    autoMode: boolean; 
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  globalPlot?: string;    
  setting: string;
  genre: string;
  storyElements?: string;
  theme?: string;      
  fandom?: string;        
  sourceUrl?: string;     
  targetLength?: number;
  autoNewChapter?: boolean;
  writingStyle?: string;  
  pov: string;            
  pronounStyle: string;   
  negativePrompt: string; 
  nsfw?: boolean;         
  pinnedMemory?: PinnedMemory; 
  attributes?: StoryAttribute[];
  
  // Replaced Library with Horny
  hornyStyle?: HornyStyle;
  isHornyActive?: boolean;
  isDeepThinkActive?: boolean;
  isGoogleSearchActive?: boolean;
  
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  thinkingLevel?: 'HIGH' | 'LOW';

  segmentConfig?: SegmentConfig;
  hiddenMemory?: string; // AI's automated internal logic tracker
  playerReminders?: string; // Ghi chú nhắc nhở đặc biệt của người chơi
  chapters: Chapter[];
  characters: Character[];
  lore: LoreEntry[];       
  items: ItemEntry[];      
  createdAt: number;
  lastCheckpoint?: {
      contentLength: number;
      pinnedMemory: PinnedMemory; 
      timestamp: number;
  };
}
