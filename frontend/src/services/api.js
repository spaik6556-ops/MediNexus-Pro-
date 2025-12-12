import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Twin Core API
export const twinApi = {
  createEvent: (data) => axios.post(`${API_URL}/v1/twin/events`, data),
  getTimeline: (params) => axios.get(`${API_URL}/v1/twin/timeline`, { params }),
  getAggregate: () => axios.get(`${API_URL}/v1/twin/aggregate`),
};

// Symptoms API
export const symptomsApi = {
  analyze: (data) => axios.post(`${API_URL}/v1/symptoms/analyze`, data),
  getHistory: (limit = 20) => axios.get(`${API_URL}/v1/symptoms/history`, { params: { limit } }),
};

// Lab Results API
export const labsApi = {
  create: (data) => axios.post(`${API_URL}/v1/labs`, data),
  getAll: (params) => axios.get(`${API_URL}/v1/labs`, { params }),
  getTrends: (testName) => axios.get(`${API_URL}/v1/labs/trends/${encodeURIComponent(testName)}`),
};

// Documents API
export const documentsApi = {
  create: (data) => axios.post(`${API_URL}/v1/documents`, data),
  getAll: (params) => axios.get(`${API_URL}/v1/documents`, { params }),
  delete: (id) => axios.delete(`${API_URL}/v1/documents/${id}`),
};

// Care Plans API
export const carePlansApi = {
  create: (data) => axios.post(`${API_URL}/v1/care-plans`, data),
  getAll: (status) => axios.get(`${API_URL}/v1/care-plans`, { params: { status } }),
  updateStatus: (id, status) => axios.put(`${API_URL}/v1/care-plans/${id}/status`, null, { params: { status } }),
};

// Appointments API
export const appointmentsApi = {
  create: (data) => axios.post(`${API_URL}/v1/appointments`, data),
  getAll: (params) => axios.get(`${API_URL}/v1/appointments`, { params }),
  updateStatus: (id, status) => axios.put(`${API_URL}/v1/appointments/${id}/status`, null, { params: { status } }),
};

// Vitals API
export const vitalsApi = {
  create: (data) => axios.post(`${API_URL}/v1/vitals`, data),
  getAll: (params) => axios.get(`${API_URL}/v1/vitals`, { params }),
  getLatest: () => axios.get(`${API_URL}/v1/vitals/latest`),
};

// Doctors API
export const doctorsApi = {
  getAll: (specialty) => axios.get(`${API_URL}/v1/doctors`, { params: { specialty } }),
};

export default {
  twin: twinApi,
  symptoms: symptomsApi,
  labs: labsApi,
  documents: documentsApi,
  carePlans: carePlansApi,
  appointments: appointmentsApi,
  vitals: vitalsApi,
  doctors: doctorsApi,
};
