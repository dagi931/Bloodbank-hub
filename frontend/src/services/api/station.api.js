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
  collectSample: async (sampleData) => {
    const payload = {
      fayda_id: sampleData.fayda_id || sampleData.faydaId,
      donor_id: sampleData.donor_id || sampleData.donorId,
      blood_type: sampleData.blood_type || sampleData.bloodType,
      lab_id: sampleData.lab_id || sampleData.labId,
      appointment_id: sampleData.appointment_id || sampleData.appointmentId,
      screening_data: sampleData.screening_data,
      health_notes: sampleData.health_notes || (sampleData.screening_data ? JSON.stringify(sampleData.screening_data) : null),
    };
    const response = await fetch(`${BASE_URL}/station/samples`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
  routeSampleToLab: async (sampleId, labId) => {
    const response = await fetch(`${BASE_URL}/station/samples/${sampleId}/route`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ lab_id: labId }),
    });
    return handleResponse(response);
  },
  registerAndCollect: async (payload) => {
    const response = await fetch(`${BASE_URL}/station/register-and-collect`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
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
  getDonorsList: async () => {
    const response = await fetch(`${BASE_URL}/station/donors`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getReports: async () => {
    const response = await fetch(`${BASE_URL}/station/reports`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
