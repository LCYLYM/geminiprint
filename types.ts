export interface CanvasImage {
  id: string;
  url: string;
  prompt: string;
  parentId?: string; // If derived from another image
  timestamp: number;
  isLoading?: boolean;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface GenerationRequest {
  prompt: string;
  referenceImage?: string; // Base64
  style?: string;
}

export enum GenerationStatus {
  IDLE,
  GENERATING,
  ERROR,
  SUCCESS
}