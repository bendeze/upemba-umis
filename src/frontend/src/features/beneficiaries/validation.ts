import { z } from 'zod';

export const employeeFormSchema = z.object({
  employee_number: z.string().min(1, 'Employee number is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(255),
  post_name: z.string().max(255).optional().or(z.literal('')),
  first_name: z.string().min(1, 'First name is required').max(255),
  site: z.string().uuid('Please select a valid site'),
  address: z.string().optional().or(z.literal('')),
  employment_status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'RETIRED']),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const dependentFormSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  gender: z.enum(['M', 'F']),
  relationship: z.enum(['SPOUSE', 'CHILD']),
  birth_date: z.string().optional().or(z.literal('')).refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return date <= new Date();
  }, 'Birth date cannot be in the future'),
});

export type DependentFormValues = z.infer<typeof dependentFormSchema>;
