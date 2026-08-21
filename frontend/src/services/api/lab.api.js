import { BASE_URL, getHeaders, handleResponse } from './client';

export const labApi = {
  getPendingSamples: async () => {
    const response = await fetch(`${BASE_URL}/lab/samples`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getWarehouses: async () => {
    const response = await fetch(`${BASE_URL}/lab/warehouses`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  // Submits vitals/diseases tests -> writes to SQLite AND updates Postgres points
  submitTestResult: async (sampleId, testData) => {
    const response = await fetch(`${BASE_URL}/lab/samples/${sampleId}/test`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(testData),
    });
    return handleResponse(response);
  },
  getLabRecords: async () => {
    const response = await fetch(`${BASE_URL}/lab/records`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getDonorPoints: async () => {
    const response = await fetch(`${BASE_URL}/lab/points`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getInventoryOut: async () => {
    const response = await fetch(`${BASE_URL}/lab/inventory-out`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getLabReports: async () => {
    const response = await fetch(`${BASE_URL}/lab/reports`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
