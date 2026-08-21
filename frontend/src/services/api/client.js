export const BASE_URL = 'http://localhost:5000/api';

export const getHeaders = () => {
  const token = sessionStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.error || `HTTP error! status: ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
};
