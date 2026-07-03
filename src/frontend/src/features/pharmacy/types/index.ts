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

export interface PrescriptionItem {
  id: string;
  medicine: Medicine;
  medicine_id?: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  dosage_instructions?: string;
}

export interface Prescription {
  id: string;
  medical_center: MedicalCenter;
  medical_center_id?: string;
  date: string;
  patient_type: 'EMPLOYEE' | 'DEPENDENT' | 'EXTERNAL';
  employee?: any; // To avoid circular dependency with beneficiaries
  dependent?: any;
  external_patient_name?: string;
  prescribing_doctor?: string;
  diagnosis?: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  items: PrescriptionItem[];
}
