import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min for large queries
});

// ── Datasets ──────────────────────────────────────────────
export const uploadDataset = async (file, name, sourceType = null, sourceMeta = null, existingId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  if (sourceType) formData.append('source_type', sourceType);
  if (sourceMeta) formData.append('source_meta', JSON.stringify(sourceMeta));
  if (existingId) formData.append('id', existingId);
  const { data } = await api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 min for large uploads
  });
  return data;
};

export const listDatasets = async () => {
  const { data } = await api.get('/datasets');
  return data;
};

export const getDataset = async (id) => {
  const { data } = await api.get(`/datasets/${id}`);
  return data;
};

export const previewDataset = async (id, page = 1, pageSize = 50) => {
  const { data } = await api.get(`/datasets/${id}/preview`, {
    params: { page, page_size: pageSize },
  });
  return data;
};

export const deleteDataset = async (id) => {
  const { data } = await api.delete(`/datasets/${id}`);
  return data;
};

// ── External Sources ──────────────────────────────────────────────────────────
export const probeUrl = async (url) => {
  const { data } = await api.post('/external/url/probe', { url });
  return data;
};

export const registerUrlDataset = async (url, name) => {
  const { data } = await api.post('/external/url/register', { url, name });
  return data;
};

export const probeDbConnection = async (params) => {
  const { data } = await api.post('/external/db/probe', params);
  return data;
};

export const saveDbConnection = async (params) => {
  const { data } = await api.post('/external/db/connect', params);
  return data;
};

export const listDbConnections = async () => {
  const { data } = await api.get('/external/db/connections');
  return data;
};

export const deleteDbConnection = async (id) => {
  const { data } = await api.delete(`/external/db/connections/${id}`);
  return data;
};

export const probeExistingDbConnection = async (id) => {
  const { data } = await api.post(`/external/db/connections/${id}/probe`);
  return data;
};

export const registerDbTable = async (payload) => {
  const { data } = await api.post('/external/db/register-table', payload);
  return data;
};

export const refreshExternalDataset = async (id) => {
  const { data } = await api.post(`/external/refresh/${id}`);
  return data;
};

// ── Queries ───────────────────────────────────────────────
export const executeQuery = async (sql, datasetId, page = 1, pageSize = 50) => {
  const { data } = await api.post('/queries/execute', {
    sql,
    dataset_id: datasetId,
    page,
    page_size: pageSize,
  });
  return data;
};

export const saveQuery = async (payload) => {
  const { data } = await api.post('/queries/save', payload);
  return data;
};

export const saveQueryAsDataset = async (name, sql, datasetId) => {
  const { data } = await api.post('/queries/save_dataset', {
    name,
    sql,
    dataset_id: datasetId,
  });
  return data;
};

export const listSavedQueries = async (datasetId) => {
  const params = datasetId ? { dataset_id: datasetId } : {};
  const { data } = await api.get('/queries', { params });
  return data;
};

export const deleteSavedQuery = async (id) => {
  const { data } = await api.delete(`/queries/${id}`);
  return data;
};

export const getSavedQuery = async (id) => {
  const { data } = await api.get(`/queries/${id}`);
  return data;
};

export const validateQuery = async (sql, datasetId) => {
  const { data } = await api.post('/queries/validate', {
    sql,
    dataset_id: datasetId,
  });
  return data;
};

export const exportQueryCSV = async (sql, datasetId) => {
  const response = await api.post('/queries/export', {
    sql,
    dataset_id: datasetId,
  }, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'query_results.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const getColumnStats = async (datasetId, tableName, column) => {
  const { data } = await api.post('/queries/execute', {
    sql: `SELECT DISTINCT "${column}" as val FROM "${tableName}" WHERE "${column}" IS NOT NULL ORDER BY 1 LIMIT 200`,
    dataset_id: datasetId,
    page: 1,
    page_size: 200,
  });
  return (data.rows || []).map(r => r.val).filter(v => v !== null && v !== '');
};

// ── Visualizations ────────────────────────────────────────
export const createVisualization = async (payload) => {
  const { data } = await api.post('/visualizations', payload);
  return data;
};

export const listVisualizations = async (datasetId) => {
  const params = datasetId ? { dataset_id: datasetId } : {};
  const { data } = await api.get('/visualizations', { params });
  return data;
};

export const getVisualization = async (id) => {
  const { data } = await api.get(`/visualizations/${id}`);
  return data;
};

export const updateVisualization = async (id, payload) => {
  const { data } = await api.put(`/visualizations/${id}`, payload);
  return data;
};

export const deleteVisualization = async (id) => {
  const { data } = await api.delete(`/visualizations/${id}`);
  return data;
};

// ── Dashboards ────────────────────────────────────────────
export const createDashboard = async (payload) => {
  const { data } = await api.post('/dashboards', payload);
  return data;
};

export const listDashboards = async () => {
  const { data } = await api.get('/dashboards');
  return data;
};

export const getDashboard = async (id) => {
  const { data } = await api.get(`/dashboards/${id}`);
  return data;
};

export const updateDashboard = async (id, payload) => {
  const { data } = await api.put(`/dashboards/${id}`, payload);
  return data;
};

export const deleteDashboard = async (id) => {
  const { data } = await api.delete(`/dashboards/${id}`);
  return data;
};

export default api;
