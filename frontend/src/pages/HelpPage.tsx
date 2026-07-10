import { useState } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Chip, Stack, Divider, Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BugReportIcon from '@mui/icons-material/BugReport';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

interface Field {
  name: string;
  required?: boolean;
  description: string;
}

interface Section {
  title: string;
  icon: React.ReactNode;
  color: string;
  purpose: string;
  fields: Field[];
  tips?: string[];
}

const sections: Section[] = [
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
    color: '#2563EB',
    purpose: 'High-level overview of project health. Shows key metrics, active stories, open bugs, today\'s timesheet activity, recent deployments, and (for Admin/Manager/HR) who is active today.',
    fields: [],
    tips: [
      'No data entry needed — the dashboard auto-updates from other pages.',
      'Active Stories shows stories currently In Progress.',
      'Today\'s Activity shows all timesheet entries logged today — click any entry to jump to that developer\'s timesheet.',
      'Recent Deployments shows the 4 most recent production deployments.',
      'Active Today (visible to Admin, Manager, HR only) appears at the bottom and shows who has logged in today with their login time.',
    ],
  },
  {
    title: 'People',
    icon: <PeopleIcon />,
    color: '#7C3AED',
    purpose: 'Manage all team members. Add, edit, or remove developers and assign them to teams.',
    fields: [
      { name: 'Name', required: true, description: 'Full name of the team member (e.g. Anil Yerupala).' },
      { name: 'Email', required: true, description: 'Work email address. Must be a valid format.' },
      { name: 'Role', required: true, description: 'Job role — Developer, Senior Developer, Full Stack Engineer, QA Engineer, Tech Lead, Manager, etc.' },
      { name: 'Team(s)', description: 'Assign to one or more teams. A member can belong to multiple teams.' },
      { name: 'Project Type', description: 'Client (billable client work) or Internal (internal product/tooling).' },
    ],
    tips: [
      'Only Admin, Manager, HR and other privileged roles can add or edit other members.',
      'Any member can edit their own profile.',
      'Username is auto-generated as firstname.lastname when the account is created.',
      'New developers are given the default password criska@123 — they should change it immediately via the Change Password option in the sidebar.',
    ],
  },
  {
    title: 'Teams',
    icon: <GroupsIcon />,
    color: '#d97706',
    purpose: 'Create and manage teams and their sprints. Each team has its own sprint backlog.',
    fields: [
      { name: 'Team Name', required: true, description: 'A short, descriptive name (e.g. Frontend Team, Security Team).' },
      { name: 'Description', description: 'Brief description of what the team works on.' },
      { name: 'Sprint Name', required: true, description: 'Label for the sprint (e.g. Sprint 1, Sprint 4).' },
      { name: 'Start Date', required: true, description: 'Sprint start date. Past dates are allowed (for recording completed sprints).' },
      { name: 'End Date', required: true, description: 'Sprint end date. Must be after the start date.' },
      { name: 'Status', required: true, description: 'Planned → Active → Completed. Only one sprint should be Active at a time.' },
      { name: 'Goal', description: 'Short description of what this sprint aims to deliver (e.g. "Auth module and core UI setup").' },
    ],
    tips: [
      'Create the team first, then add sprints to it.',
      'Mark a sprint Completed once all stories are done before starting a new one.',
      'There is no limit on how many members can be added to a team.',
    ],
  },
  {
    title: 'Stories',
    icon: <AssignmentIcon />,
    color: '#059669',
    purpose: 'Track user stories / tasks for each sprint. Each story belongs to a team and sprint.',
    fields: [
      { name: 'Story Number', required: true, description: 'Unique identifier (e.g. US-001, US-045). Used for quick reference.' },
      { name: 'Title', required: true, description: 'One-line summary of what needs to be built (e.g. "User Authentication Module").' },
      { name: 'Description', description: 'Detailed requirements or acceptance criteria for the story.' },
      { name: 'Story Points', description: 'Effort estimate — typically 1, 2, 3, 5, 8, or 13 (Fibonacci). 1 = trivial, 13 = very large.' },
      { name: 'Status', required: true, description: 'Backlog → To Do → In Progress → In Review → Review/Testing → Done (or On Hold).' },
      { name: 'Reporter', description: 'Person who raised or owns this story.' },
      { name: 'Assignee', description: 'Developer responsible for completing the story.' },
      { name: 'Due Date', description: 'Target completion date within the sprint.' },
      { name: 'Started Date', description: 'Auto-filled when status moves to In Progress.' },
      { name: 'Completed Date', description: 'Auto-filled when status moves to Done.' },
    ],
    tips: [
      'Select a Team first, then pick a Sprint to see its stories.',
      'Switch to Month view to see all stories logged in a given calendar month.',
      'Stories with a past due date and no completion date are highlighted as overdue.',
    ],
  },
  {
    title: 'Timesheet',
    icon: <EventNoteIcon />,
    color: '#0891b2',
    purpose: 'Log daily work entries — what each team member worked on, for how long, and which story/task it relates to. Max 8 hours per developer per day.',
    fields: [
      { name: 'Developer', required: true, description: 'Team member who did the work.' },
      { name: 'Date', required: true, description: 'The date the work was done.' },
      { name: 'Story / Task', required: true, description: 'The story or task this work relates to. Type to search existing stories.' },
      { name: 'Description', required: true, description: 'Brief summary of what was actually done (e.g. "Implemented JWT token refresh flow").' },
      { name: 'Hours', required: true, description: 'Number of hours spent (0.5 increments). The remaining available hours for that day are shown automatically.' },
    ],
    tips: [
      'Log entries daily — don\'t batch multiple days into one entry.',
      'Maximum 8 hours per developer per day across all entries.',
      'Developers can only edit their own entries. Admin, Manager, and HR can edit any entry.',
      'The weekly calendar view (Timesheet tab) highlights JH Client US holidays so the team is aware of upcoming off days.',
      'The holiday schedule table at the bottom of the Timesheet page lists all upcoming and past JH Client holidays.',
    ],
  },
  {
    title: 'Bugs & Issues',
    icon: <BugReportIcon />,
    color: '#dc2626',
    purpose: 'Track bugs, defects, and issues found in production or during testing.',
    fields: [
      { name: 'Title', required: true, description: 'Short description of the bug (e.g. "Login fails on Safari mobile").' },
      { name: 'Description', description: 'Steps to reproduce, expected vs actual behaviour, screenshots/logs if available.' },
      { name: 'Severity', required: true, description: 'Critical (app unusable), High (major feature broken), Medium (partial impact), Low (cosmetic/minor).' },
      { name: 'Status', required: true, description: 'Open → In Progress → Resolved → Closed.' },
      { name: 'Environment', required: true, description: 'Production (live system) or Stage/UAT (testing environment).' },
      { name: 'Reporter', description: 'Person who found and reported the bug.' },
      { name: 'Assignee', description: 'Developer responsible for fixing it.' },
      { name: 'Created Date', description: 'Date the bug was discovered.' },
      { name: 'Resolved Date', description: 'Date the fix was confirmed. Fill this when marking as Resolved or Closed.' },
    ],
    tips: [
      'Always set severity accurately — Critical bugs should be escalated immediately.',
      'Move status to Closed only after the fix has been verified in the same environment.',
    ],
  },
  {
    title: 'Deployments',
    icon: <RocketLaunchIcon />,
    color: '#be185d',
    purpose: 'Record every production deployment — planned, in-progress, or completed. All deployments are to Production only.',
    fields: [
      { name: 'CR Number', required: true, description: 'Change Request number for this deployment (e.g. CR-2026-045). Mandatory for all deployments.' },
      { name: 'Date', required: true, description: 'Date of the deployment.' },
      { name: 'Time', description: 'Time of the deployment (24-hour format).' },
      { name: 'Deployed By', required: true, description: 'Team member who performed or triggered the deployment.' },
      { name: 'Status', required: true, description: 'Planned → In Progress → Success / Failed / Rolled Back.' },
      { name: 'Description', required: true, description: 'What was deployed — feature names, sprint number, release notes.' },
      { name: 'Notes', description: 'Short internal notes — e.g. "Requires DB migration before deploy" or "Hotfix for issue #42".' },
      { name: 'Effort (hours)', description: 'Time spent on the deployment activity.' },
    ],
    tips: [
      'All deployments are Production only — Stage/UAT deployments are not tracked here.',
      'CR Number is mandatory — obtain it before creating the deployment record.',
      'Create a Planned entry before deploying so the team is aware.',
      'Update status to Success or Failed immediately after the deployment completes.',
      'Use Rolled Back if a deployment had to be reverted.',
    ],
  },
  {
    title: 'Login Activity',
    icon: <PersonSearchIcon />,
    color: '#0f766e',
    purpose: 'View who has logged into the portal on any given date, with all session times recorded. Visible to Admin, Manager, and HR only.',
    fields: [
      { name: 'Date', required: true, description: 'Select any past or present date to see login activity for that day.' },
    ],
    tips: [
      'Only Admin, Manager, and HR can access this page.',
      'Each login is recorded separately — if someone logs in multiple times in a day, all sessions appear.',
      'Login times are shown in IST (Asia/Kolkata).',
      'Use the Login Activity page for attendance verification or security audits.',
    ],
  },
  {
    title: 'Reports',
    icon: <BarChartIcon />,
    color: '#9333ea',
    purpose: 'View aggregated data across teams, sprints, and time periods — story point velocity, bug trends, deployment frequency, and daily log summaries.',
    fields: [],
    tips: [
      'No data entry — reports are generated from existing Stories, Bugs, Deployments, and Timesheets.',
      'Use the team and sprint filters to narrow down the report.',
      'Export to CSV where available to share data outside the app.',
    ],
  },
];

export default function HelpPage() {
  const [expanded, setExpanded] = useState<string | false>('Stories');

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Help & Guide</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        How to use each section of Criska Nexus &amp; Solutions.
      </Typography>

      {sections.map((s) => (
        <Accordion
          key={s.title}
          expanded={expanded === s.title}
          onChange={(_, isExp) => setExpanded(isExp ? s.title : false)}
          elevation={0}
          sx={{
            mb: 1.5,
            border: '1px solid #E2E8F0',
            borderRadius: '10px !important',
            '&:before': { display: 'none' },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 2.5, py: 0.5, bgcolor: expanded === s.title ? '#F8FAFC' : 'white' }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ color: s.color, display: 'flex', alignItems: 'center' }}>{s.icon}</Box>
              <Typography fontWeight={600} fontSize={15}>{s.title}</Typography>
            </Stack>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: s.fields.length ? 2 : 0 }}>
              {s.purpose}
            </Typography>

            {s.fields.length > 0 && (
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: s.tips?.length ? 2 : 0 }}>
                <Box sx={{ px: 2, py: 1, bgcolor: '#F1F5F9' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.8}>
                    FIELDS
                  </Typography>
                </Box>
                {s.fields.map((f, i) => (
                  <Box
                    key={f.name}
                    sx={{
                      px: 2, py: 1.25,
                      borderTop: i === 0 ? 'none' : '1px solid #F1F5F9',
                      display: 'flex',
                      gap: 2,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ minWidth: 170, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="body2" fontWeight={600} fontSize={13}>{f.name}</Typography>
                      {f.required && (
                        <Chip label="required" size="small" sx={{ height: 16, fontSize: 10, bgcolor: '#fee2e2', color: '#dc2626' }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontSize={13}>{f.description}</Typography>
                  </Box>
                ))}
              </Paper>
            )}

            {s.tips && s.tips.length > 0 && (
              <Box sx={{ bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2, px: 2, py: 1.5 }}>
                <Typography variant="caption" fontWeight={700} color="#15803d" letterSpacing={0.8} display="block" sx={{ mb: 0.75 }}>
                  TIPS
                </Typography>
                {s.tips.map((tip, i) => (
                  <Typography key={i} variant="body2" color="#166534" fontSize={13} sx={{ mb: i < s.tips!.length - 1 ? 0.5 : 0 }}>
                    • {tip}
                  </Typography>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
