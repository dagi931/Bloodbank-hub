import { BASE_URL, getHeaders, handleResponse } from './client';

export const donorApi = {
  // Loads history, points, leaderboard, active announcements, countdown in a single call
  getDashboardInfo: async () => {
    const response = await fetch(`${BASE_URL}/donor/dashboard-info`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getStations: async () => {
    const response = await fetch(`${BASE_URL}/donor/stations`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getHistory: async () => {
    const response = await fetch(`${BASE_URL}/donor/history`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getMessages: async () => {
    const response = await fetch(`${BASE_URL}/donor/messages`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
