import {
  DeveloperProfile, Team, Sprint, Story, Bug, DailyLog, Deployment,
  DeveloperRole, ProjectType, StoryStatus, BugSeverity, BugStatus, DeploymentStatus, SprintStatus,
} from '../data/mockData';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.message ?? err.error ?? res.statusText);
  }
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Backend may return LocalDate as [2026,6,14] array (Jackson default) or "2026-06-14" string.
// This normalises both to "YYYY-MM-DD" strings.
function toDateStr(d: any): string {
  if (!d) return '';
  if (Array.isArray(d)) {
    const [y, m, day] = d;
    return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return String(d);
}

// Backend may return LocalDateTime as [2026,7,8,14,30,0] array or ISO string.
function toDateTimeStr(d: any): string {
  if (!d) return '';
  if (Array.isArray(d)) {
    const [y, mo, day, h = 0, min = 0] = d;
    return `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  return String(d);
}

export interface ActiveUser {
  id: string;
  name: string;
  role: string;
  lastLoginAt: string;
}

// ─── Mappers: backend → frontend ────────────────────────────────────────────

function mapDeveloper(d: any): DeveloperProfile {
  const raw: string = d.projectTypes ?? d.projectIds ?? '';
  return {
    id: String(d.id),
    name: d.name ?? '',
    email: d.email ?? '',
    role: (d.role ?? 'Developer') as DeveloperRole,
    teamIds: d.teamIds ? d.teamIds.split(',').filter(Boolean) : [],
    projectTypes: raw.split(',').filter(Boolean) as ProjectType[],
    username: d.username ?? '',
    password: d.password ?? '',
  };
}

function mapTeam(t: any): Team {
  return {
    id: String(t.id),
    name: t.name ?? '',
    description: t.description ?? '',
    members: t.memberIds ? t.memberIds.split(',').filter(Boolean) : [],
  };
}

function mapSprint(s: any): Sprint {
  return {
    id: String(s.id),
    teamId: String(s.teamId),
    name: s.name ?? '',
    startDate: toDateStr(s.startDate),
    endDate: toDateStr(s.endDate),
    status: (s.status ?? 'planned') as SprintStatus,
    goal: s.goal ?? '',
  };
}

function mapStory(s: any): Story {
  return {
    id: String(s.id),
    storyNumber: s.storyNumber ?? '',
    title: s.title ?? '',
    description: s.description ?? '',
    points: s.points ?? 0,
    status: (s.status ?? 'backlog') as StoryStatus,
    reporter: s.reporter ?? '',
    assignee: s.assignee ?? '',
    teamId: String(s.teamId ?? ''),
    sprintId: String(s.sprintId ?? ''),
    createdDate: toDateStr(s.createdDate),
    dueDate: toDateStr(s.dueDate),
    startedDate: toDateStr(s.startedDate),
    completedDate: toDateStr(s.completedDate),
    spilledFromSprintId: s.spilledFromSprintId ? String(s.spilledFromSprintId) : null,
    createdBy: s.createdBy ?? '',
  };
}

function mapBug(b: any): Bug {
  return {
    id: String(b.id),
    title: b.title ?? '',
    description: b.description ?? '',
    severity: (b.severity ?? 'low') as BugSeverity,
    status: (b.status ?? 'open') as BugStatus,
    environment: b.environment ?? 'production',
    reporter: b.reporter ?? '',
    assignee: b.assignee ?? '',
    createdDate: toDateStr(b.createdDate),
    resolvedDate: toDateStr(b.resolvedDate),
    createdBy: b.createdBy ?? '',
  };
}

function mapLog(l: any): DailyLog {
  return {
    id: String(l.id),
    developer: l.developer ?? '',
    date: toDateStr(l.date),
    title: l.taskName ?? '',
    description: l.workDescription ?? l.description ?? '',
    hours: l.hoursSpent ?? l.hours ?? 0,
  };
}

function mapDeployment(d: any): Deployment {
  return {
    id: String(d.id),
    environment: 'production',
    status: (d.status ?? 'planned') as DeploymentStatus,
    deployedBy: d.deployedBy ?? '',
    date: toDateStr(d.date ?? d.deployDate),
    time: d.time ?? d.deployTime ?? '',
    crNumber: d.crNumber ?? '',
    description: d.description ?? '',
    notes: d.notes ?? '',
    hours: d.hours != null ? Number(d.hours) : undefined,
  };
}

// ─── Unmap: frontend → backend ───────────────────────────────────────────────

function unmapDeveloper(d: Omit<DeveloperProfile, 'id'>) {
  return {
    name: d.name, email: d.email, role: d.role,
    teamIds: d.teamIds.join(','),
    projectTypes: (d.projectTypes ?? []).join(','),
    username: d.username, password: d.password,
  };
}

function unmapTeam(t: Omit<Team, 'id'>) {
  return { name: t.name, description: t.description, memberIds: t.members.join(',') };
}

function unmapSprint(s: Omit<Sprint, 'id'>) {
  return {
    teamId: Number(s.teamId), name: s.name,
    startDate: s.startDate, endDate: s.endDate,
    status: s.status, goal: s.goal,
  };
}

function unmapStory(s: Omit<Story, 'id'>) {
  return {
    storyNumber: s.storyNumber,
    title: s.title, description: s.description, points: s.points,
    status: s.status, reporter: s.reporter, assignee: s.assignee,
    teamId: Number(s.teamId), sprintId: Number(s.sprintId),
    createdDate: s.createdDate || null,
    dueDate: s.dueDate || null,
    startedDate: s.startedDate || null,
    completedDate: s.completedDate || null,
    spilledFromSprintId: s.spilledFromSprintId ? Number(s.spilledFromSprintId) : null,
    createdBy: s.createdBy ?? '',
  };
}

function unmapBug(b: Omit<Bug, 'id'>) {
  return {
    title: b.title, description: b.description,
    severity: b.severity, status: b.status,
    environment: b.environment, reporter: b.reporter, assignee: b.assignee,
    createdDate: b.createdDate || null,
    resolvedDate: b.resolvedDate || null,
    createdBy: b.createdBy ?? '',
  };
}

function unmapLog(l: Omit<DailyLog, 'id'>) {
  return {
    developer: l.developer, date: l.date,
    taskName: l.title, workDescription: l.description,
    hoursSpent: l.hours,
    status: 'completed',
  };
}

function unmapDeployment(d: Omit<Deployment, 'id'>) {
  return {
    environment: d.environment, status: d.status,
    deployedBy: d.deployedBy,
    date: d.date, time: d.time,
    crNumber: d.crNumber,
    description: d.description, notes: d.notes,
    hours: d.hours ?? null,
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function apiLogin(username: string, password: string): Promise<DeveloperProfile> {
  const data = await req<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return mapDeveloper(data);
}

export async function apiChangePassword(username: string, currentPassword: string, newPassword: string): Promise<void> {
  await req<any>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ username, currentPassword, newPassword }),
  });
}

export async function apiSendOtp(username: string): Promise<{ maskedEmail: string }> {
  return req<{ maskedEmail: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function apiResetPassword(username: string, otp: string, newPassword: string): Promise<void> {
  await req<any>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ username, otp, newPassword }),
  });
}

// ─── Developers ──────────────────────────────────────────────────────────────

export const apiGetDevelopers = () => req<any[]>('/developers').then(list => list.map(mapDeveloper));
export const apiGetActiveToday = () =>
  req<any[]>('/developers/active-today').then(list =>
    list.map((d): ActiveUser => ({
      id: String(d.id),
      name: d.name ?? '',
      role: d.role ?? '',
      lastLoginAt: toDateTimeStr(d.lastLoginAt),
    }))
  );

export const apiGetActiveOn = (date: string) =>
  req<any[]>(`/developers/active-on?date=${date}`).then(list =>
    list.map((d): ActiveUser => ({
      id: String(d.id),
      name: d.name ?? '',
      role: d.role ?? '',
      lastLoginAt: toDateTimeStr(d.lastLoginAt),
    }))
  );

export interface LoginEvent {
  id: string;
  developerName: string;
  role: string;
  loginAt: string;
}

export const apiGetLoginEvents = (date: string) =>
  req<any[]>(`/login-events?date=${date}`).then(list =>
    list.map((e): LoginEvent => ({
      id: String(e.id),
      developerName: e.developerName ?? '',
      role: e.role ?? '',
      loginAt: toDateTimeStr(e.loginAt),
    }))
  );

export const apiGetStatusByDate = (date: string) =>
  req<any[]>(`/status/date/${date}`).then(list => list.map(mapLog));

export const apiGetStatusSubmittedOn = (date: string) =>
  req<any[]>(`/status/submitted/${date}`).then(list => list.map(mapLog));
export const apiCreateDeveloper = (d: Omit<DeveloperProfile, 'id'>) =>
  req<any>('/developers', { method: 'POST', body: JSON.stringify(unmapDeveloper(d)) }).then(mapDeveloper);
export const apiUpdateDeveloper = (id: string, d: Omit<DeveloperProfile, 'id'>) =>
  req<any>(`/developers/${id}`, { method: 'PUT', body: JSON.stringify(unmapDeveloper(d)) }).then(mapDeveloper);
export const apiDeleteDeveloper = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE}/developers/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.message ?? err.error ?? res.statusText);
  }
};

// ─── Teams ───────────────────────────────────────────────────────────────────

export const apiGetTeams = () => req<any[]>('/teams').then(list => list.map(mapTeam));
export const apiCreateTeam = (t: Omit<Team, 'id'>) =>
  req<any>('/teams', { method: 'POST', body: JSON.stringify(unmapTeam(t)) }).then(mapTeam);
export const apiUpdateTeam = (id: string, t: Omit<Team, 'id'>) =>
  req<any>(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(unmapTeam(t)) }).then(mapTeam);

// ─── Sprints ─────────────────────────────────────────────────────────────────

export const apiGetSprints = () => req<any[]>('/sprints').then(list => list.map(mapSprint));
export const apiGetSprintsByTeam = (teamId: string) =>
  req<any[]>(`/sprints/team/${teamId}`).then(list => list.map(mapSprint));
export const apiCreateSprint = (s: Omit<Sprint, 'id'>) =>
  req<any>('/sprints', { method: 'POST', body: JSON.stringify(unmapSprint(s)) }).then(mapSprint);
export const apiUpdateSprint = (id: string, s: Omit<Sprint, 'id'>) =>
  req<any>(`/sprints/${id}`, { method: 'PUT', body: JSON.stringify(unmapSprint(s)) }).then(mapSprint);

// ─── Stories ─────────────────────────────────────────────────────────────────

export const apiGetStories = () => req<any[]>('/stories').then(list => list.map(mapStory));
export const apiCreateStory = (s: Omit<Story, 'id'>) =>
  req<any>('/stories', { method: 'POST', body: JSON.stringify(unmapStory(s)) }).then(mapStory);
export const apiUpdateStory = (id: string, s: Omit<Story, 'id'>) =>
  req<any>(`/stories/${id}`, { method: 'PUT', body: JSON.stringify(unmapStory(s)) }).then(mapStory);

// ─── Bugs ─────────────────────────────────────────────────────────────────────

export const apiGetBugs = () => req<any[]>('/bugs').then(list => list.map(mapBug));
export const apiCreateBug = (b: Omit<Bug, 'id'>) =>
  req<any>('/bugs', { method: 'POST', body: JSON.stringify(unmapBug(b)) }).then(mapBug);
export const apiUpdateBug = (id: string, b: Omit<Bug, 'id'>) =>
  req<any>(`/bugs/${id}`, { method: 'PUT', body: JSON.stringify(unmapBug(b)) }).then(mapBug);

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export const apiGetLogs = () => req<any[]>('/status').then(list => list.map(mapLog));
export const apiGetLogsByDeveloper = (name: string) =>
  req<any[]>(`/status/developer/${encodeURIComponent(name)}`).then(list => list.map(mapLog));
export const apiCreateLog = (l: Omit<DailyLog, 'id'>) =>
  req<any>('/status', { method: 'POST', body: JSON.stringify(unmapLog(l)) }).then(mapLog);
export const apiUpdateLog = (id: string, l: Omit<DailyLog, 'id'>) =>
  req<any>(`/status/${id}`, { method: 'PUT', body: JSON.stringify(unmapLog(l)) }).then(mapLog);

// ─── Deployments ──────────────────────────────────────────────────────────────

export const apiGetDeployments = () => req<any[]>('/deployments').then(list => list.map(mapDeployment));
export const apiCreateDeployment = (d: Omit<Deployment, 'id'>) =>
  req<any>('/deployments', { method: 'POST', body: JSON.stringify(unmapDeployment(d)) }).then(mapDeployment);
export const apiUpdateDeployment = (id: string, d: Omit<Deployment, 'id'>) =>
  req<any>(`/deployments/${id}`, { method: 'PUT', body: JSON.stringify(unmapDeployment(d)) }).then(mapDeployment);
