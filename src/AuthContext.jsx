import React, { createContext, useContext, useState, useRef } from 'react';

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
  'Medical Director':           { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: true,  canManageUsers: true,  canInviteUsers: true  },
  'Quality Manager':            { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: true,  canManageUsers: true,  canInviteUsers: true  },
  'Paediatric Sleep Physician': { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: false, canManageUsers: false, canInviteUsers: false },
  'Reporting Physician':        { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: true,  canIssueDoc: false, canManageUsers: false, canInviteUsers: false },
  'Senior Technologist':        { canCreateDoc: true,  canUploadDoc: true,  canPeerReviewDoc: true,  canApproveDoc: false, canIssueDoc: false, canManageUsers: false, canInviteUsers: false },
  'Scoring Technologist':       { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canManageUsers: false, canInviteUsers: false },
  'Recording Tech':             { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canManageUsers: false, canInviteUsers: false },
  'Reception / Bookings':       { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canManageUsers: false, canInviteUsers: false },
  'External Auditor':           { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canManageUsers: false, canInviteUsers: false },
  'External Assessor':          { canCreateDoc: false, canUploadDoc: false, canPeerReviewDoc: false, canApproveDoc: false, canIssueDoc: false, canManageUsers: false, canInviteUsers: false },
};

export function can(role, permission) {
  return !!(ROLE_PERMISSIONS[role]?.[permission]);
}

function initials(name) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const SEED_USERS = [
  { id: 1, email: 'kavya.patel@nexus360.com',   password: 'demo', name: 'K. Patel',                     role: 'Quality Manager',            mfa: true,  auth: 'Okta',       lastSeen: 'now'        },
  { id: 2, email: 'rafael.okafor@nexus360.com',  password: 'demo', name: 'Dr. R. Okafor',                role: 'Medical Director',            mfa: true,  auth: 'Okta',       lastSeen: '1 h ago'    },
  { id: 3, email: 'lily.hartono@nexus360.com',   password: 'demo', name: 'Dr. L. Hartono',               role: 'Paediatric Sleep Physician',  mfa: true,  auth: 'Okta',       lastSeen: '3 h ago'    },
  { id: 4, email: 'meilin.chen@nexus360.com',    password: 'demo', name: 'M. Chen',                      role: 'Senior Technologist',         mfa: true,  auth: 'Okta',       lastSeen: '5 h ago'    },
  { id: 5, email: 'arjun.singh@nexus360.com',    password: 'demo', name: 'A. Singh',                     role: 'Scoring Technologist',        mfa: true,  auth: 'Okta',       lastSeen: '2 d ago'    },
  { id: 6, email: 'j.roy@nexus360.com',          password: 'demo', name: 'J. Roy',                       role: 'External Auditor',            mfa: true,  auth: 'Local',      lastSeen: '16 Mar 2026'},
  { id: 7, email: 'assessor@nata.gov.au',        password: 'demo', name: 'NATA Assessor (time-boxed)',   role: 'External Assessor',           mfa: true,  auth: 'Magic link',  lastSeen: '—'          },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(SEED_USERS);
  const usersRef = useRef(SEED_USERS);

  // Keep ref in sync so signIn closure is never stale
  const syncUsers = (next) => {
    usersRef.current = next;
    setUsers(next);
  };

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('nexus_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function signIn(email, password) {
    const match = usersRef.current.find(u => u.email === email && u.password === password);
    if (!match) return false;
    const session = {
      id:       match.id,
      name:     match.name,
      role:     match.role,
      initials: initials(match.name),
      email:    match.email,
    };
    setUser(session);
    localStorage.setItem('nexus_user', JSON.stringify(session));
    return true;
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('nexus_user');
  }

  function hasPerm(permission) {
    return can(user?.role, permission);
  }

  function addUser(data) {
    const next = [...usersRef.current, {
      id:       Date.now(),
      password: 'demo',
      mfa:      data.mfa ?? false,
      auth:     data.auth || 'Local',
      lastSeen: '—',
      ...data,
    }];
    syncUsers(next);
  }

  function updateUser(id, changes) {
    const next = usersRef.current.map(u => u.id === id ? { ...u, ...changes } : u);
    syncUsers(next);
    // If editing the logged-in user, refresh session
    if (user?.id === id) {
      const updated = next.find(u => u.id === id);
      const session = { id: updated.id, name: updated.name, role: updated.role, initials: initials(updated.name), email: updated.email };
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
