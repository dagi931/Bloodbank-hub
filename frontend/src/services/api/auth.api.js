import { BASE_URL, getHeaders, handleResponse } from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
  // Step 1: Send verification email
  registerVerifyEmail: async (email) => {
    const response = await fetch(`${BASE_URL}/auth/register-verify-email`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },
  // Step 2: Validate code
  verifyCode: async (email, code) => {
    const response = await fetch(`${BASE_URL}/auth/verify-code`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, code }),
    });
    return handleResponse(response);
  },
  // Step 3: Complete registration
  registerComplete: async (registrationData) => {
    const response = await fetch(`${BASE_URL}/auth/register-complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(registrationData),
    });
    return handleResponse(response);
  },
  faydaLookup: async (faydaId) => {
    const response = await fetch(`${BASE_URL}/auth/fayda-lookup/${faydaId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
  getCurrentUser: () => {
    try {
      const userStr = sessionStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  forgotPassword: async (email) => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },
  resetPasswordDonor: async (email, code, newPassword) => {
    const response = await fetch(`${BASE_URL}/auth/reset-password-donor`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, code, newPassword }),
    });
    return handleResponse(response);
  },
};
