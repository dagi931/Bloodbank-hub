import { BASE_URL, getHeaders, handleResponse } from './client';

export const adminApi = {
  getUsers: async () => {
    const response = await fetch(`${BASE_URL}/admin/users`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  updateUserStatus: async (userId, status) => {
    const response = await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
  getAnalytics: async () => {
    const response = await fetch(`${BASE_URL}/admin/analytics`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  triggerReminders: async () => {
    const response = await fetch(`${BASE_URL}/admin/reminders/trigger`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getAuditLogs: async () => {
    const response = await fetch(`${BASE_URL}/admin/audit-logs`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  getPasswordResetRequests: async () => {
    const response = await fetch(`${BASE_URL}/admin/reset-requests`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  resolvePasswordReset: async (id, newPassword) => {
    const response = await fetch(`${BASE_URL}/admin/reset-requests/${id}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    return handleResponse(response);
  },
};
