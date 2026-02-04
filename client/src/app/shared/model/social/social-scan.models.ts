
export interface NetworkNode {
  id: string | number;
  label: string;
  shape: string;
  image?: string;
  size: number;
  font: { color: string; size?: number };
  color: { border: string; background:string; highlight?: { border: string; background: string }, hover?: { border: string; background: string } };
  title?: string;
  shadow?: boolean | { enabled: boolean; color: string; size: number; x: number; y: number; };
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: any[];
}

export interface Job {
  id: string;
  username: string;
  status: 'in_progress' | 'completed' | 'failed';
  progress: number;
  step: string;
}

export interface PlatformResult {
  platform: string;
  username: string;
  url: string;
  isSelected: boolean; 
  description?: string;
  followers?: number;
  joiningDate?: string;
  email?: string;
  allMetadata: Record<string, any>;
}

export type ScanEvent =
  | { type: 'progress'; payload: Partial<Job> }
  | { type: 'complete'; payload: PlatformResult[] };