export interface Field {
  id: string;
  key: string;
  value: string;
  confidence: number;
  pageNumber: number;
  displayName: string;
  category: string;
  regionId: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Document {
  id: string;
  userId: string;
  created_at: string;
  data: Field[];
}
