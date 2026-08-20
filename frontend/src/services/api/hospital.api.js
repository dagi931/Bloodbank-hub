import { BASE_URL, getHeaders, handleResponse } from './client';

export const hospitalApi = {
  // Fetches internal hospital stock
  getStock: async () => {
    const response = await fetch(`${BASE_URL}/hospital/stock`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  createRequisition: async (bloodType, unitsNeeded) => {
    const response = await fetch(`${BASE_URL}/hospital/requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ blood_type: bloodType, units_needed: unitsNeeded }),
    });
    return handleResponse(response);
  },
  getRequests: async () => {
    const response = await fetch(`${BASE_URL}/hospital/requests`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getStockLevels: async () => {
    const response = await fetch(`${BASE_URL}/hospital/stock-levels`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  // Emergency clinical patient search from separate Laboratory database
  emergencyPatientLookup: async (faydaId) => {
    const response = await fetch(`${BASE_URL}/hospital/emergency-patient/${faydaId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  // Hospital-to-Hospital request boards
  getInterHospitalRequests: async () => {
    const response = await fetch(`${BASE_URL}/hospital/inter-requests`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  createInterHospitalRequest: async (bloodType, unitsNeeded, receiverId) => {
    const response = await fetch(`${BASE_URL}/hospital/inter-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        blood_type: bloodType,
        units_needed: unitsNeeded,
        receiver_id: receiverId || null,
      }),
    });
    return handleResponse(response);
  },
  fulfillInterHospitalRequest: async (requestId) => {
    const response = await fetch(`${BASE_URL}/hospital/inter-requests/${requestId}/fulfill`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getHospitalList: async () => {
    const response = await fetch(`${BASE_URL}/hospital/list`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getExpiringBags: async () => {
    const response = await fetch(`${BASE_URL}/hospital/expiring-soon`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
