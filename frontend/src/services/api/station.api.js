import { BASE_URL, getHeaders, handleResponse } from './client';

export const stationApi = {
  // Differentiates returning vs new donors by query
  lookupDonor: async (queryId) => {
    const response = await fetch(`${BASE_URL}/station/fayda/${queryId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  // Triggers either demographic create or rapid returning log
  registerDonor: async (donorData) => {
    const response = await fetch(`${BASE_URL}/station/donors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(donorData),
    });
    return handleResponse(response);
  },
  createSample: async (sampleData) => {
    const response = await fetch(`${BASE_URL}/station/samples`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sampleData),
    });
    return handleResponse(response);
  },
  getSamples: async () => {
    const response = await fetch(`${BASE_URL}/station/samples`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getLabs: async () => {
    const response = await fetch(`${BASE_URL}/station/labs`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
