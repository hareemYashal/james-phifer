
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedRegion {
  id: string;
  coordinates: BoundingBox;
  pageNumber: number;
  fieldType?: string;
  confidence: number;
}

export interface ExtractedField {
  id: string;
  key: string;
  displayName: string;
  value: string;
  confidence: number;
  coordinates: BoundingBox;
  category: string;
  pageNumber: number;
  regionId: string;
}

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}