import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const useRegions = () => {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => api.getRegions(),
  });
};

export const useSites = (regionId?: string) => {
  return useQuery({
    queryKey: ['sites', regionId],
    queryFn: () => api.getSites(regionId),
  });
};

export const useEmployees = (params: {
  page: number;
  search: string;
  regionId: string;
  siteId: string;
  status: string;
}) => {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => api.getEmployees(params),
    placeholderData: (previousData) => previousData, // Keeps UI responsive during pagination transitions
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.getEmployee(id),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createEmployee>[0]) => api.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateEmployee>[1] }) =>
      api.updateEmployee(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', data.id] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useAddDependent = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.addDependent>[1]) => api.addDependent(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDeleteDependent = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDependent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useImportExcel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.importExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
};

export const useAuditLogs = (params: { entityType?: string; entityId?: string }) => {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api.getAuditLogs(params),
  });
};
