import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export const ROLE_LEVEL = {
  // ASA / NATA roles
  'Medical Director':                         5,
  'Quality Manager':                          4,
  'Paediatric Sleep Physician':               3,
  'Reporting Physician':                      3,
  'Senior Technologist':                      2,
  'Scoring Technologist':                     1,
  'Recording Tech':                           1,
  'Reception / Bookings':                     0,
  'External Auditor':                         0,
  'External Assessor':                        0,
  // AASM roles
  'Network Director':                         5,
  'Site Director':                            4,
  'Lead Technologist (RPSGT)':                2,
  'Registered Polysomnographic Technologist': 1,
  'Sleep Technician':                         1,
  'Scheduling / Receptionist':                0,
  'External Reviewer':                        0,
  'AASM Accreditation Reviewer':              0,
};

// Role lists per standard — used to filter dropdowns in user management
export const ASA_ROLES = [
  'Medical Director', 'Quality Manager', 'Paediatric Sleep Physician',
  'Reporting Physician', 'Senior Technologist', 'Scoring Technologist',
  'Recording Tech', 'Reception / Bookings', 'External Auditor', 'External Assessor',
];

export const AASM_ROLES = [
  'Network Director', 'Site Director', 'Quality Manager',
  'Lead Technologist (RPSGT)', 'Registered Polysomnographic Technologist',
  'Sleep Technician', 'Scheduling / Receptionist',
  'External Reviewer', 'AASM Accreditation Reviewer',
];

export const ROLE_PERMISSIONS = {
  // ASA / NATA roles
  'Medical Director':                         { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: true,  canSignStudy: true,  canManageUsers: true,  canInviteUsers: true  },
  'Quality Manager':                          { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: true,  canSignStudy: false, canManageUsers: true,  canInviteUsers: true  },
  'Paediatric Sleep Physician':               { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: false, canSignStudy: true,  canManageUsers: false, canInviteUsers: false },
  'Reporting Physician':                      { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: false, canSignStudy: true,  canManageUsers: false, canInviteUsers: false },
  'Senior Technologist':                      { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Scoring Technologist':                     { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Recording Tech':                           { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Reception / Bookings':                     { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'External Auditor':                         { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'External Assessor':                        { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  // AASM roles
  'Network Director':                         { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: true,  canSignStudy: true,  canManageUsers: true,  canInviteUsers: true  },
  'Site Director':                            { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: true,  canSignStudy: true,  canManageUsers: true,  canInviteUsers: true  },
  'Lead Technologist (RPSGT)':                { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Registered Polysomnographic Technologist': { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Sleep Technician':                         { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Scheduling / Receptionist':                { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'External Reviewer':                        { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'AASM Accreditation Reviewer':              { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
};

export function can(role, permission) {
  return !!(ROLE_PERMISSIONS[role]?.[permission]);
}

// Canonical site list used across the app
export const ALL_SITES = [
  { code: 'RML', name: 'Riverside Main Lab',      abbr: 'Riverside Main'  },
  { code: 'EPL', name: 'Eastside Paediatric Lab', abbr: 'Eastside Paed.'  },
  { code: 'HSN', name: 'Home Service – North',    abbr: 'Home Service N.' },
];

const BASE = import.meta.env.VITE_API_URL ?? '';

function getToken() {
  return localStorage.getItem('nexus_token');
}

function isTokenValid() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 > Date.now() : false;
  } catch {
    return false;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!isTokenValid()) {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      return null;
    }
    try {
      const stored = localStorage.getItem('nexus_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState([]);
  const usersRef = useRef([]);

  const syncUsers = (next) => {
    usersRef.current = next;
    setUsers(next);
  };

  // Load user list from API once logged in
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    fetch(`${BASE}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(list => syncUsers(list.map(u => ({ ...u, password: undefined }))))
      .catch(() => {});
  }, [user]);

  async function signIn(email, password) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const { token, user: u } = await res.json();
    // Ensure sites is always an array on the stored session object
    const session = { ...u, sites: Array.isArray(u.sites) ? u.sites : [] };
    localStorage.setItem('nexus_token', token);
    localStorage.setItem('nexus_user', JSON.stringify(session));
    setUser(session);
    window.dispatchEvent(new CustomEvent('nexus:signIn'));
    return true;
  }

  function signOut() {
    setUser(null);
    syncUsers([]);
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
  }

  function hasPerm(permission) {
    return can(user?.role, permission);
  }

  // Local-only user management (UI state only — persisted server-side via API in a future iteration)
  function addUser(data) {
    const next = [...usersRef.current, { id: Date.now(), mfa: data.mfa ?? false, auth: data.auth || 'Local', lastSeen: '—', ...data }];
    syncUsers(next);
  }

  function updateUser(id, changes) {
    const next = usersRef.current.map(u => u.id === id ? { ...u, ...changes } : u);
    syncUsers(next);
    if (user?.id === id) {
      const updated = next.find(u => u.id === id);
      const session = { id: updated.id, name: updated.name, role: updated.role, email: updated.email, sites: updated.sites ?? [] };
      setUser(session);
      localStorage.setItem('nexus_user', JSON.stringify(session));
    }
  }

  // Convenience: sites the logged-in user is allowed to see.
  // Empty array = unrestricted (sees all sites).
  const userSites = user?.sites ?? [];

  return (
    <AuthContext.Provider value={{ user, users, userSites, signIn, signOut, hasPerm, addUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
