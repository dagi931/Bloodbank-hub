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
  bookAppointment: async (stationId, dateTime) => {
    const response = await fetch(`${BASE_URL}/donor/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ station_id: stationId, date_time: dateTime }),
    });
    return handleResponse(response);
  },
  getAppointments: async () => {
    const response = await fetch(`${BASE_URL}/donor/appointments`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  cancelAppointment: async (apptId) => {
    const response = await fetch(`${BASE_URL}/donor/appointments/${apptId}`, {
      method: 'DELETE',
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
};
