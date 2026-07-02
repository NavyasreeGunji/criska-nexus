import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Team, Sprint, DeveloperProfile, Project,
  initialTeams, initialSprints, initialDeveloperProfiles, initialProjects,
} from '../data/mockData';
import {
  apiLogin, apiGetDevelopers, apiCreateDeveloper, apiUpdateDeveloper, apiDeleteDeveloper,
  apiGetTeams, apiCreateTeam, apiUpdateTeam,
  apiGetSprints, apiCreateSprint, apiUpdateSprint,
  apiGetProjects, apiCreateProject, apiUpdateProject, apiDeleteProject,
} from '../api/api';

const STORAGE_KEY = 'devtrack_user';
const WAKE_TIMEOUT_MS = 90_000; // give Render 90 s to cold-start
const RETRY_INTERVAL_MS = 5_000;

interface AppContextType {
  projects: Project[];
  teams: Team[];
  sprints: Sprint[];
  developerProfiles: DeveloperProfile[];
  currentUser: DeveloperProfile | null;
  backendOnline: boolean;
  backendChecked: boolean;
  backendWaking: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTeam: (team: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  addSprint: (sprint: Omit<Sprint, 'id'>) => Promise<void>;
  updateSprint: (sprint: Sprint) => Promise<void>;
  addDeveloper: (dev: DeveloperProfile) => Promise<void>;
  updateDeveloper: (dev: DeveloperProfile) => Promise<void>;
  deleteDeveloper: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

function loadUser(): DeveloperProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [developerProfiles, setDeveloperProfiles] = useState<DeveloperProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<DeveloperProfile | null>(loadUser);
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendChecked, setBackendChecked] = useState(false);
  const [backendWaking, setBackendWaking] = useState(true);

  // Probe backend with retries for Render cold-start (up to 90 s)
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      const deadline = Date.now() + WAKE_TIMEOUT_MS;

      while (Date.now() < deadline) {
        try {
          const [t, s, d, p] = await Promise.all([apiGetTeams(), apiGetSprints(), apiGetDevelopers(), apiGetProjects()]);
          if (cancelled) return;
          setTeams(t);
          setSprints(s);
          setDeveloperProfiles(d);
          setProjects(p.length > 0 ? p : initialProjects);
          setBackendOnline(true);
          setBackendChecked(true);
          setBackendWaking(false);
          return;
        } catch {
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
        }
      }

      // Timed out — fall back to mock data
      if (!cancelled) {
        setTeams(initialTeams);
        setSprints(initialSprints);
        setDeveloperProfiles(initialDeveloperProfiles);
        setProjects(initialProjects);
        setBackendOnline(false);
        setBackendChecked(true);
        setBackendWaking(false);
      }
    };

    probe();
    return () => { cancelled = true; };
  }, []);

  // Keep backend awake every 10 min — only while someone is logged in
  useEffect(() => {
    if (!backendOnline || !currentUser) return;
    const interval = setInterval(() => {
      apiGetTeams().catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [backendOnline, currentUser]);

  const login = async (username: string, password: string) => {
    if (backendOnline) {
      const dev = await apiLogin(username, password);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dev));
      setCurrentUser(dev);
    } else {
      // Fallback: validate against local mock data
      const match = developerProfiles.find(
        (d) => d.username === username.trim().toLowerCase() && d.password === password
      );
      if (!match) throw new Error('Invalid username or password');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
      setCurrentUser(match);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  };

  const addProject = async (project: Omit<Project, 'id'>) => {
    if (backendOnline) {
      const created = await apiCreateProject(project);
      setProjects((prev) => [...prev, created]);
    } else {
      const newId = `P-${String(projects.length + 1).padStart(3, '0')}`;
      setProjects((prev) => [...prev, { ...project, id: newId }]);
    }
  };

  const updateProject = async (project: Project) => {
    if (backendOnline) {
      const updated = await apiUpdateProject(project.id, project);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    } else {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    }
  };

  const deleteProject = async (id: string) => {
    if (backendOnline) {
      await apiDeleteProject(id);
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const addTeam = async (team: Omit<Team, 'id'>) => {
    if (backendOnline) {
      const created = await apiCreateTeam(team);
      setTeams((prev) => [...prev, created]);
    } else {
      const newId = `T-${String(teams.length + 1).padStart(3, '0')}`;
      setTeams((prev) => [...prev, { ...team, id: newId }]);
    }
  };

  const updateTeam = async (team: Team) => {
    if (backendOnline) {
      const updated = await apiUpdateTeam(team.id, team);
      setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)));
    } else {
      setTeams((prev) => prev.map((t) => (t.id === team.id ? team : t)));
    }
  };

  const addSprint = async (sprint: Omit<Sprint, 'id'>) => {
    if (backendOnline) {
      const created = await apiCreateSprint(sprint);
      setSprints((prev) => [...prev, created]);
    } else {
      const newId = `SP-${String(sprints.length + 1).padStart(3, '0')}`;
      setSprints((prev) => [...prev, { ...sprint, id: newId }]);
    }
  };

  const updateSprint = async (sprint: Sprint) => {
    if (backendOnline) {
      const updated = await apiUpdateSprint(sprint.id, sprint);
      setSprints((prev) => prev.map((s) => (s.id === sprint.id ? updated : s)));
    } else {
      setSprints((prev) => prev.map((s) => (s.id === sprint.id ? sprint : s)));
    }
  };

  const addDeveloper = async (dev: DeveloperProfile) => {
    if (backendOnline) {
      const created = await apiCreateDeveloper(dev);
      setDeveloperProfiles((prev) => [...prev, created]);
    } else {
      setDeveloperProfiles((prev) => [...prev, dev]);
    }
  };

  const updateDeveloper = async (dev: DeveloperProfile) => {
    if (backendOnline) {
      const updated = await apiUpdateDeveloper(dev.id, dev);
      setDeveloperProfiles((prev) => prev.map((d) => (d.id === dev.id ? updated : d)));
      if (currentUser && currentUser.id === dev.id) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setCurrentUser(updated);
      }
    } else {
      setDeveloperProfiles((prev) => prev.map((d) => (d.id === dev.id ? dev : d)));
      if (currentUser && currentUser.id === dev.id) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dev));
        setCurrentUser(dev);
      }
    }
  };

  const deleteDeveloper = async (id: string) => {
    const dev = developerProfiles.find((d) => d.id === id);
    if (backendOnline) {
      await apiDeleteDeveloper(id);
    }
    setDeveloperProfiles((prev) => prev.filter((d) => d.id !== id));
    if (dev) {
      const affected = teams.filter((t) => t.members.includes(dev.name));
      for (const team of affected) {
        await updateTeam({ ...team, members: team.members.filter((m) => m !== dev.name) });
      }
    }
  };

  return (
    <AppContext.Provider value={{
      projects, teams, sprints, developerProfiles, currentUser, backendOnline, backendChecked, backendWaking,
      login, logout,
      addProject, updateProject, deleteProject,
      addTeam, updateTeam, addSprint, updateSprint,
      addDeveloper, updateDeveloper, deleteDeveloper,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
