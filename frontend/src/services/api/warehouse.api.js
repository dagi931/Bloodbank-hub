import { BASE_URL, getHeaders, handleResponse } from './client';

export const warehouseApi = {
  getStock: async () => {
    const response = await fetch(`${BASE_URL}/warehouse/stock`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getRequests: async () => {
    const response = await fetch(`${BASE_URL}/warehouse/requests`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  fulfillRequest: async (requestId) => {
    const response = await fetch(`${BASE_URL}/warehouse/requests/${requestId}/fulfill`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  createAnnouncement: async (announcementData) => {
    const response = await fetch(`${BASE_URL}/warehouse/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(announcementData),
    });
    return handleResponse(response);
  },
  getAnnouncements: async () => {
    const response = await fetch(`${BASE_URL}/warehouse/announcements`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  sendEmergencyAlert: async (bloodType) => {
    const response = await fetch(`${BASE_URL}/warehouse/emergency-alert`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ blood_type: bloodType }),
    });
    return handleResponse(response);
  },
  getExpiringBags: async () => {
    const response = await fetch(`${BASE_URL}/warehouse/expiring-soon`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
