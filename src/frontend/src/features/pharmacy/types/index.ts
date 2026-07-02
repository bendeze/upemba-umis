export interface MedicalCenter {
  id: string;
  name: string;
  created_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  unit: string;
  min_stock_level?: number;
}

export interface PharmacyStock {
  id: string;
  medicine: Medicine;
  medical_center: MedicalCenter;
  quantity: number;
  min_stock_level: number;
}

export interface MedicineBatch {
  id: string;
  medicine: Medicine;
  medical_center: MedicalCenter;
  lot_number: string;
  expiration_date: string | null;
  quantity: number;
}

export interface StockMovement {
  id: string;
  medicine: Medicine;
  medical_center: MedicalCenter;
  movement_type: 'IN' | 'OUT' | 'HISTORICAL_OUT' | 'ADJUST';
  quantity: number;
  lot_number?: string;
  expiration_date: string | null;
  date: string;
  notes?: string;
  created_at: string;
}

export interface GlobalSettings {
  id?: number;
  general_min_stock_level: number;
}
