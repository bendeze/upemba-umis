export interface Region {
  id: string;
  name: string;
  created_at: string;
}

export interface Site {
  id: string;
  name: string;
  region: string;
  region_name: string;
  created_at: string;
}
