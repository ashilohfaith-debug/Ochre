const API_BASE = window.location.port === '5173' ? 'http://localhost:5000/api' : '/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('ochre_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  message: string;
  token: string;
  user: { id: string; username: string; email: string; color: string };
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  join_code: string;
  created_at: string;
  updated_at: string;
}

export async function verifyTokenApi(): Promise<{ id: string; username: string; email: string; color: string }> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  return handleResponse<{ id: string; username: string; email: string; color: string }>(res);
}

export async function signUpApi(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return handleResponse<AuthResponse>(res);
}

export async function signInApi(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return handleResponse<AuthResponse>(res);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function fetchProjectsApi(): Promise<ProjectRecord[]> {
  const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
  return handleResponse<ProjectRecord[]>(res);
}

export async function createProjectApi(name: string, description = ''): Promise<ProjectRecord> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, description })
  });
  return handleResponse<ProjectRecord>(res);
}

export async function joinProjectApi(joinCode: string): Promise<{ message: string; project: ProjectRecord }> {
  const res = await fetch(`${API_BASE}/projects/join`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ joinCode })
  });
  return handleResponse<{ message: string; project: ProjectRecord }>(res);
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export interface BranchRecord {
  id: string;
  project_id: string;
  name: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

export async function fetchBranchesApi(projectId: string): Promise<BranchRecord[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/branches`, { headers: authHeaders() });
  return handleResponse<BranchRecord[]>(res);
}

export async function createBranchApi(projectId: string, name: string): Promise<BranchRecord> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/branches`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name })
  });
  return handleResponse<BranchRecord>(res);
}

export async function renameBranchApi(branchId: string, name: string): Promise<BranchRecord> {
  const res = await fetch(`${API_BASE}/branches/${branchId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ name })
  });
  return handleResponse<BranchRecord>(res);
}

export async function deleteBranchApi(branchId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/branches/${branchId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return handleResponse(res);
}
