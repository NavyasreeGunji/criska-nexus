export type StoryStatus = 'backlog' | 'to_do' | 'in_progress' | 'in_review' | 'for_qe_testing' | 'done' | 'on_hold';
export type StoryPriority = 'critical' | 'high' | 'medium' | 'low';
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type DeploymentStatus = 'planned' | 'in_progress' | 'success' | 'failed' | 'rolled_back';
export type LogType = 'development' | 'review' | 'meeting' | 'bug_fix' | 'deployment';
export type SprintStatus = 'planned' | 'active' | 'completed';

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[];
}

export interface Sprint {
  id: string;
  teamId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  goal: string;
}

export interface Story {
  id: string;
  storyNumber: string;
  title: string;
  description: string;
  points: number;
  status: StoryStatus;
  priority?: StoryPriority;
  reporter: string;
  assignee: string;
  createdDate: string;
  dueDate: string;
  startedDate: string;
  completedDate: string;
  teamId: string;
  sprintId: string;
  spilledFromSprintId?: string | null;
  createdBy?: string;
}

export interface Comment {
  id: string;
  entityType: 'story' | 'bug';
  entityId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  environment: 'production' | 'stage/UAT';
  reporter: string;
  assignee: string;
  createdDate: string;
  resolvedDate: string;
  createdBy?: string;
}

export interface DailyLog {
  id: string;
  developer: string;
  date: string;
  title: string;
  description: string;
  hours: number;
}

export interface Deployment {
  id: string;
  environment: 'production';
  status: DeploymentStatus;
  deployedBy: string;
  date: string;
  time: string;
  crNumber: string;
  description: string;
  notes: string;
  hours?: number;
}

export type DeveloperRole = 'Developer' | 'Senior Developer' | 'Full Stack Engineer' | 'Senior Full Stack Engineer' | 'QA Engineer' | 'DevOps' | 'Tech Lead' | 'Manager' | 'HR' | 'Sprint Master' | 'Associate Manager' | 'Delivery Manager' | 'Technical Manager' | 'Security Consultant' | 'Senior Security Consultant' | 'Admin';
export type ProjectType = 'Client' | 'Internal';

export interface DeveloperProfile {
  id: string;
  name: string;
  role: DeveloperRole;
  email: string;
  teamIds: string[];
  projectTypes: ProjectType[];
  username: string;
  password: string;
}

export const initialDeveloperProfiles: DeveloperProfile[] = [
  { id: 'DEV-001', name: 'Praneeth', role: 'Manager', email: 'praneeth@criskasecurity.com', teamIds: ['T-001', 'T-002'], projectTypes: ['Client', 'Internal'], username: 'praneeth', password: 'criska@123' },
  { id: 'DEV-002', name: 'Anil Yerupala', role: 'Tech Lead', email: 'anil.y@criskasecurity.com', teamIds: ['T-001', 'T-002'], projectTypes: ['Client', 'Internal'], username: 'anil.yerupala', password: 'criska@123' },
  { id: 'DEV-003', name: 'Navya Sree Gunji', role: 'HR', email: 'navya.sree@criskasecurity.com', teamIds: ['T-001'], projectTypes: ['Client'], username: 'navya.gunji', password: 'criska@123' },
  { id: 'DEV-004', name: 'Nagaraju Gunji', role: 'Developer', email: 'nagaraju@criskasecurity.com', teamIds: ['T-001'], projectTypes: ['Client'], username: 'nagaraju.gunji', password: 'criska@123' },
  { id: 'DEV-005', name: 'Abdul Wahid Syed', role: 'Developer', email: 'wahid@criskasecurity.com', teamIds: ['T-001'], projectTypes: ['Client'], username: 'wahid.syed', password: 'criska@123' },
  { id: 'DEV-006', name: 'Adnan Yousof', role: 'Developer', email: 'adnan@criskasecurity.com', teamIds: ['T-001'], projectTypes: ['Client'], username: 'adnan.yousof', password: 'criska@123' },
  { id: 'DEV-007', name: 'Abdul Shahid Syed', role: 'Developer', email: 'shahid@criskasecurity.com', teamIds: ['T-001'], projectTypes: ['Client'], username: 'shahid.syed', password: 'criska@123' },
  { id: 'DEV-008', name: 'Navya Gujjeti', role: 'Developer', email: 'navya.g@criskasecurity.com', teamIds: ['T-002'], projectTypes: ['Client'], username: 'navya.gujjeti', password: 'criska@123' },
  { id: 'DEV-009', name: 'Raghavendra Aadesh', role: 'Developer', email: 'raghvendra@criskasecurity.com', teamIds: ['T-002'], projectTypes: ['Client'], username: 'raghavendra.aadesh', password: 'criska@123' },
  { id: 'DEV-010', name: 'Manideep Vennam', role: 'Developer', email: 'manideep@criskasecurity.com', teamIds: ['T-002'], projectTypes: ['Client'], username: 'manideep.vennam', password: 'criska@123' },
  { id: 'DEV-011', name: 'Aadil Shaik', role: 'Developer', email: 'aadil@criskasecurity.com', teamIds: ['T-001'], projectTypes: ['Internal'], username: 'aadil.shaik', password: 'criska@123' },
  { id: 'DEV-012', name: 'Aakhil Shaik', role: 'Developer', email: 'aakhil@criskasecurity.com', teamIds: ['T-002'], projectTypes: ['Internal'], username: 'aakhil.shaik', password: 'criska@123' },
  { id: 'DEV-013', name: 'Mohan Meesala', role: 'Developer', email: 'mohan@criskasecurity.com', teamIds: ['T-002'], projectTypes: ['Client'], username: 'mohan.meesala', password: 'criska@123' },
  { id: 'DEV-014', name: 'Nithin Pillalamari', role: 'Developer', email: 'nithin@criskasecurity.com', teamIds: ['T-002'], projectTypes: ['Client'], username: 'nithin.pillalamari', password: 'criska@123' },
  { id: 'DEV-015', name: 'Anil Meesala', role: 'Developer', email: 'anil.m@criskasecurity.com', teamIds: ['T-002'], projectTypes: ['Client'], username: 'anil.meesala', password: 'criska@123' },
];

// Derived string list — used by dropdowns across the app
export const developers = initialDeveloperProfiles.map((d) => d.name);

export const initialTeams: Team[] = [
  {
    id: 'T-001',
    name: 'Frontend Team',
    description: 'UI/UX and client-side development',
    members: ['Praneeth', 'Anil Yerupala', 'Navya Sree Gunji', 'Nagaraju Gunji', 'Abdul Wahid Syed', 'Adnan Yousof', 'Abdul Shahid Syed', 'Aadil Shaik'],
  },
  {
    id: 'T-002',
    name: 'Backend Team',
    description: 'API, database, and infrastructure',
    members: ['Praneeth', 'Anil Yerupala', 'Navya Gujjeti', 'Raghavendra Aadesh', 'Manideep Vennam', 'Aakhil Shaik', 'Mohan Meesala', 'Nithin Pillalamari', 'Anil Meesala'],
  },
];

export const initialSprints: Sprint[] = [
  {
    id: 'SP-001', teamId: 'T-001', name: 'Sprint 1',
    startDate: '2026-05-01', endDate: '2026-05-14',
    status: 'completed', goal: 'Auth module and core UI setup',
  },
  {
    id: 'SP-002', teamId: 'T-001', name: 'Sprint 2',
    startDate: '2026-05-15', endDate: '2026-05-28',
    status: 'completed', goal: 'Notification system and UI polish',
  },
  {
    id: 'SP-003', teamId: 'T-001', name: 'Sprint 3',
    startDate: '2026-06-01', endDate: '2026-06-14',
    status: 'active', goal: 'Dashboard analytics and mobile responsiveness',
  },
  {
    id: 'SP-004', teamId: 'T-002', name: 'Sprint 1',
    startDate: '2026-05-01', endDate: '2026-05-21',
    status: 'completed', goal: 'Performance optimization and DB tuning',
  },
  {
    id: 'SP-005', teamId: 'T-002', name: 'Sprint 2',
    startDate: '2026-06-01', endDate: '2026-06-21',
    status: 'active', goal: 'RBAC, CSV export, and security hardening',
  },
];

export const initialStories: Story[] = [
  {
    id: 'S-001', storyNumber: 'US-001', title: 'User Authentication Module',
    description: 'Implement OAuth2 login flow with SSO support',
    points: 8, status: 'done', reporter: 'Navya Sree Gunji', assignee: 'Abdul Wahid Syed',
    createdDate: '2026-05-01', dueDate: '2026-05-12', startedDate: '2026-05-03', completedDate: '2026-05-10',
    teamId: 'T-001', sprintId: 'SP-001',
  },
  {
    id: 'S-002', storyNumber: 'US-002', title: 'Dashboard Analytics',
    description: 'Build real-time metrics dashboard with chart components',
    points: 13, status: 'in_progress', reporter: 'Nagaraju Gunji', assignee: 'Adnan Yousof',
    createdDate: '2026-06-01', dueDate: '2026-06-10', startedDate: '2026-06-05', completedDate: '',
    teamId: 'T-001', sprintId: 'SP-003',
  },
  {
    id: 'S-003', storyNumber: 'US-003', title: 'Export to CSV Feature',
    description: 'Allow data export in CSV and Excel formats',
    points: 5, status: 'backlog', reporter: 'Raghavendra Aadesh', assignee: 'Manideep Vennam',
    createdDate: '2026-06-01', dueDate: '', startedDate: '', completedDate: '',
    teamId: 'T-002', sprintId: 'SP-005',
  },
  {
    id: 'S-004', storyNumber: 'US-004', title: 'Notification System',
    description: 'Email and in-app push notifications',
    points: 8, status: 'done', reporter: 'Abdul Shahid Syed', assignee: 'Navya Gujjeti',
    createdDate: '2026-05-15', dueDate: '2026-05-28', startedDate: '2026-05-16', completedDate: '2026-05-26',
    teamId: 'T-001', sprintId: 'SP-002',
  },
  {
    id: 'S-005', storyNumber: 'US-005', title: 'Performance Optimization',
    description: 'Database query tuning and caching layer',
    points: 5, status: 'done', reporter: 'Aakhil Shaik', assignee: 'Nithin Pillalamari',
    createdDate: '2026-05-01', dueDate: '2026-05-12', startedDate: '2026-05-04', completedDate: '2026-05-10',
    teamId: 'T-002', sprintId: 'SP-004',
  },
  {
    id: 'S-006', storyNumber: 'US-006', title: 'Mobile Responsive Layout',
    description: 'Responsive UI redesign for mobile devices',
    points: 13, status: 'backlog', reporter: 'Navya Sree Gunji', assignee: 'Abdul Shahid Syed',
    createdDate: '2026-06-02', dueDate: '', startedDate: '', completedDate: '',
    teamId: 'T-001', sprintId: 'SP-003',
  },
  {
    id: 'S-007', storyNumber: 'US-007', title: 'Role-Based Access Control',
    description: 'Admin, manager, and developer permission levels',
    points: 8, status: 'in_progress', reporter: 'Nagaraju Gunji', assignee: 'Mohan Meesala',
    createdDate: '2026-06-01', dueDate: '2026-06-08', startedDate: '2026-06-05', completedDate: '',
    teamId: 'T-002', sprintId: 'SP-005',
  },
];

export const bugs: Bug[] = [
  {
    id: 'B-001', title: 'Login page crashes on Safari',
    description: 'Safari 17 users get a blank screen after OAuth redirect',
    severity: 'critical', status: 'in_progress', environment: 'production',
    reporter: 'Navya Sree Gunji', assignee: 'Abdul Wahid Syed',
    createdDate: '2026-06-01', resolvedDate: '',
  },
  {
    id: 'B-002', title: 'Dashboard data not refreshing',
    description: 'Dashboard shows data that is 1 hour old; auto-refresh not working',
    severity: 'high', status: 'open', environment: 'production',
    reporter: 'Nagaraju Gunji', assignee: 'Aadil Shaik',
    createdDate: '2026-06-03', resolvedDate: '',
  },
  {
    id: 'B-003', title: 'Export CSV missing columns',
    description: 'Date and assignee columns are missing from CSV export',
    severity: 'medium', status: 'resolved', environment: 'stage/UAT',
    reporter: 'Raghavendra Aadesh', assignee: 'Adnan Yousof',
    createdDate: '2026-05-28', resolvedDate: '2026-05-30',
  },
  {
    id: 'B-004', title: 'Notification email delay',
    description: 'Email notifications arrive 30+ minutes late',
    severity: 'low', status: 'closed', environment: 'production',
    reporter: 'Abdul Shahid Syed', assignee: 'Navya Gujjeti',
    createdDate: '2026-05-25', resolvedDate: '2026-05-27',
  },
  {
    id: 'B-005', title: 'Search results pagination broken',
    description: 'Page 2+ returns empty results despite data existing',
    severity: 'high', status: 'open', environment: 'production',
    reporter: 'Aakhil Shaik', assignee: 'Nithin Pillalamari',
    createdDate: '2026-06-10', resolvedDate: '',
  },
];

export const dailyLogs: DailyLog[] = [
  { id: 'L-001', developer: 'Adnan Yousof',       date: '2026-06-14', title: 'Dashboard Analytics',         description: 'Implemented chart components and data hooks', hours: 6 },
  { id: 'L-002', developer: 'Abdul Wahid Syed',  date: '2026-06-14', title: 'Safari Login Bug',             description: 'Reproducing and debugging Safari login issue', hours: 4 },
  { id: 'L-003', developer: 'Navya Sree Gunji',  date: '2026-06-14', title: 'Notification System Review',   description: 'Code review for notification system PR', hours: 3 },
  { id: 'L-004', developer: 'Raghavendra Aadesh',date: '2026-06-13', title: 'Sprint 2 Planning',            description: 'Sprint 2 planning session', hours: 2 },
  { id: 'L-005', developer: 'Mohan Meesala',     date: '2026-06-13', title: 'Role-Based Access Control',    description: 'Implemented role permission middleware', hours: 7 },
  { id: 'L-006', developer: 'Adnan Yousof',       date: '2026-06-13', title: 'Dashboard Analytics',         description: 'API integration for metrics endpoint', hours: 5 },
  { id: 'L-007', developer: 'Abdul Wahid Syed',  date: '2026-06-13', title: 'OAuth Token Investigation',    description: 'OAuth token refresh investigation', hours: 3 },
  { id: 'L-008', developer: 'Navya Gujjeti',     date: '2026-06-12', title: 'Notification System',          description: 'Email template design and implementation', hours: 4 },
  { id: 'L-009', developer: 'Manideep Vennam',   date: '2026-06-12', title: 'Export to CSV Feature',        description: 'CSV parser library evaluation', hours: 3 },
  { id: 'L-010', developer: 'Mohan Meesala',     date: '2026-06-12', title: 'RBAC Unit Tests',              description: 'Unit tests for RBAC module', hours: 5 },
  { id: 'L-011', developer: 'Nithin Pillalamari',date: '2026-06-12', title: 'Performance Optimization',     description: 'Performance query tuning', hours: 4 },
  { id: 'L-012', developer: 'Abdul Shahid Syed', date: '2026-06-11', title: 'User Authentication Module',   description: 'Auth module documentation', hours: 2 },
  { id: 'L-013', developer: 'Navya Gujjeti',     date: '2026-06-11', title: 'Notification System',          description: 'In-app notification push setup', hours: 6 },
  { id: 'L-014', developer: 'Anil Meesala',      date: '2026-06-11', title: 'Performance Optimization',     description: 'DB index tuning and query profiling', hours: 5 },
  { id: 'L-015', developer: 'Mohan Meesala',     date: '2026-06-11', title: 'Role-Based Access Control',    description: 'RBAC middleware integration', hours: 6 },
  { id: 'L-016', developer: 'Adnan Yousof',       date: '2026-06-10', title: 'Dashboard Analytics',         description: 'Dashboard layout and component scaffolding', hours: 7 },
  { id: 'L-017', developer: 'Aadil Shaik',       date: '2026-06-10', title: 'Safari Login Bug',             description: 'Safari bug reproduction setup and test cases', hours: 4 },
];

export const deployments: Deployment[] = [
  {
    id: 'D-001', environment: 'production', status: 'success',
    deployedBy: 'Anil Yerupala', date: '2026-06-10', time: '22:30', crNumber: 'CR-1001',
    description: 'Deployed auth module with OAuth2 SSO support and DB performance fixes. Ran smoke tests post-deploy, all checks passed.',
    notes: 'Auth module + performance fixes',
  },
  {
    id: 'D-003', environment: 'production', status: 'rolled_back',
    deployedBy: 'Nagaraju Gunji', date: '2026-06-05', time: '23:15', crNumber: 'CR-1002',
    description: 'Deploy caused Safari users to get blank screen after OAuth redirect. Rolled back within 20 minutes of detection.',
    notes: 'Rolled back due to Safari auth issue',
  },
  {
    id: 'D-004', environment: 'production', status: 'success',
    deployedBy: 'Anil Yerupala', date: '2026-06-07', time: '18:45', crNumber: 'CR-1003',
    description: 'Emergency hotfix for Safari login redirect bug. Patched OAuth callback handler. Deployed off-hours with minimal user impact.',
    notes: 'Hotfix: Safari login redirect',
  },
  {
    id: 'D-006', environment: 'production', status: 'planned',
    deployedBy: 'Anil Yerupala', date: '2026-06-18', time: '21:00', crNumber: 'CR-1004',
    description: 'Planned production release for dashboard analytics and notification system after QA sign-off.',
    notes: 'Sprint 3 production release',
  },
];
