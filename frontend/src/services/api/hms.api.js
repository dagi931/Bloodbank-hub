import { BASE_URL, getHeaders, handleResponse } from './client';

export const hmsApi = {
  // Patients
  admitPatient: async (patientData) => {
    const response = await fetch(`${BASE_URL}/hms/patients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },
  getPatients: async (status) => {
    const url = status ? `${BASE_URL}/hms/patients?status=${status}` : `${BASE_URL}/hms/patients`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },
  getPatientById: async (id) => {
    const response = await fetch(`${BASE_URL}/hms/patients/${id}`, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },
  dischargePatient: async (id) => {
    const response = await fetch(`${BASE_URL}/hms/patients/${id}/discharge`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Blood Orders
  createBloodOrder: async (orderData) => {
    const response = await fetch(`${BASE_URL}/hms/blood-orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },
  getBloodOrders: async () => {
    const response = await fetch(`${BASE_URL}/hms/blood-orders`, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },
  markTransfused: async (id) => {
    const response = await fetch(`${BASE_URL}/hms/blood-orders/${id}/transfused`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  cancelBloodOrder: async (id) => {
    const response = await fetch(`${BASE_URL}/hms/blood-orders/${id}/cancel`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
