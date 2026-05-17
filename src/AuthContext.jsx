import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export const ROLE_LEVEL = {
  'Medical Director':           5,
  'Quality Manager':            4,
  'Paediatric Sleep Physician': 3,
  'Reporting Physician':        3,
  'Senior Technologist':        2,
  'Scoring Technologist':       1,
  'Recording Tech':             1,
  'Reception / Bookings':       0,
  'External Auditor':           0,
  'External Assessor':          0,
};

export const ROLE_PERMISSIONS = {
  'Medical Director':           { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: true,  canSignStudy: true,  canManageUsers: true,  canInviteUsers: true  },
  'Quality Manager':            { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: true,  canSignStudy: false, canManageUsers: true,  canInviteUsers: true  },
  'Paediatric Sleep Physician': { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: false, canSignStudy: true,  canManageUsers: false, canInviteUsers: false },
  'Reporting Physician':        { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: false, canSignStudy: true,  canManageUsers: false, canInviteUsers: false },
  'Senior Technologist':        { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Scoring Technologist':       { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Recording Tech':             { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'Reception / Bookings':       { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'External Auditor':           { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
  'External Assessor':          { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canSignStudy: false, canManageUsers: false, canInviteUsers: false },
};

export function can(role, permission) {
  return !!(ROLE_PERMISSIONS[role]?.[permission]);
}

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
    localStorage.setItem('nexus_token', token);
    localStorage.setItem('nexus_user', JSON.stringify(u));
    setUser(u);
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
      const session = { id: updated.id, name: updated.name, role: updated.role, email: updated.email };
      setUser(session);
      localStorage.setItem('nexus_user', JSON.stringify(session));
    }
  }

  return (
    <AuthContext.Provider value={{ user, users, signIn, signOut, hasPerm, addUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
