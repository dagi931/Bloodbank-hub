import { BASE_URL, getHeaders, handleResponse } from './client';

export const notifApi = {
  getNotifications: async () => {
    const response = await fetch(`${BASE_URL}/notifications`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
