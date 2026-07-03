export interface Consultation {
    id: string;
    medical_center: string; // UUID
    date: string;
    patient_type: 'EMPLOYEE' | 'DEPENDENT' | 'EXTERNAL';
    employee?: string | null;
    dependent?: string | null;
    external_patient_name?: string | null;
    doctor_name?: string | null;
    symptoms?: string | null;
    diagnosis?: string | null;
    notes?: string | null;
    employee_details?: any;
    dependent_details?: any;
    prescriptions?: any[];
}
