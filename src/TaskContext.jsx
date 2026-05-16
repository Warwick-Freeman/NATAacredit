import React, { createContext, useContext, useState } from 'react';

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

const SEED_TASKS = [
  { id: 'TASK-001', title: 'Re-verify HSAT-NOX-014 before returning to service',          description: '', priority: 'critical', status: 'open',        assignedTo: 'M. Chen',       dueDate: '2026-05-14', clause: '5.3.4', source: 'NC-2026-0111', sourceType: 'nc',        completedDate: null },
  { id: 'TASK-002', title: 'Book BLS recertification — T. Brooks (lapsed 21 d)',          description: '', priority: 'critical', status: 'open',        assignedTo: 'M. Chen',       dueDate: '2026-05-08', clause: '5.1.4', source: 'NC-2026-0109', sourceType: 'nc',        completedDate: null },
  { id: 'TASK-003', title: 'Book BLS recertification — R. Patel (lapsed 7 d)',            description: '', priority: 'critical', status: 'open',        assignedTo: 'M. Chen',       dueDate: '2026-05-08', clause: '5.1.4', source: 'NC-2026-0109', sourceType: 'nc',        completedDate: null },
  { id: 'TASK-004', title: 'Investigate EQA result < 80% — J. Owusu',                    description: '', priority: 'high',     status: 'open',        assignedTo: 'Dr. R. Okafor', dueDate: '2026-05-15', clause: '5.6.8', source: 'NC-2026-0110', sourceType: 'nc',        completedDate: null },
  { id: 'TASK-005', title: 'Review subcontractor credentialing file — J. Owusu',          description: '', priority: 'high',     status: 'open',        assignedTo: 'K. Patel',      dueDate: '2026-05-10', clause: '4.5.2', source: 'NC-2026-0112', sourceType: 'nc',        completedDate: null },
  { id: 'TASK-006', title: 'Update SOP-EQP-009 to cover mobile equipment fleet',          description: '', priority: 'high',     status: 'in-progress', assignedTo: 'K. Patel',      dueDate: '2026-05-28', clause: '5.3.4', source: 'NC-2026-0111', sourceType: 'nc',        completedDate: null },
  { id: 'TASK-007', title: 'Verify effectiveness of rostering policy update (NC-0108)',   description: '', priority: 'medium',   status: 'open',        assignedTo: 'K. Patel',      dueDate: '2026-05-31', clause: '5.8.1', source: 'NC-2026-0108', sourceType: 'nc',        completedDate: null },
  { id: 'TASK-008', title: 'Update SOP-IT-002 — add A/V storage path verification step', description: '', priority: 'medium',   status: 'in-progress', assignedTo: 'K. Patel',      dueDate: '2026-04-30', clause: '5.3',   source: 'NC-2026-0107', sourceType: 'nc',        completedDate: null },
  { id: 'TASK-009', title: 'Record quarterly verification — HSAT-NOX-008 (due in 8 d)',  description: '', priority: 'high',     status: 'open',        assignedTo: 'M. Chen',       dueDate: '2026-05-20', clause: '5.3.4', source: 'HSAT-NOX-008', sourceType: 'equipment', completedDate: null },
  { id: 'TASK-010', title: 'Q2 internal audit preparation — equipment section cl. 5.3',  description: '', priority: 'medium',   status: 'open',        assignedTo: 'K. Patel',      dueDate: '2026-06-01', clause: '5.3',   source: 'Audit',        sourceType: 'audit',     completedDate: null },
  { id: 'TASK-011', title: 'Review overdue SOP-EQP-012 decontamination procedure',       description: '', priority: 'medium',   status: 'open',        assignedTo: 'M. Chen',       dueDate: '2026-05-25', clause: '5.3.5', source: 'SOP-EQP-012',  sourceType: 'document',  completedDate: null },
  { id: 'TASK-012', title: 'Update quality manual — staff competency section (cl. 5.1)', description: '', priority: 'low',      status: 'open',        assignedTo: 'K. Patel',      dueDate: '2026-06-30', clause: '5.1',   source: 'MAN-QMS-001',  sourceType: 'document',  completedDate: null },
  { id: 'TASK-013', title: 'Book BLS recertification — S. Nakamura',                     description: '', priority: 'high',     status: 'done',        assignedTo: 'M. Chen',       dueDate: '2026-04-10', clause: '5.1.4', source: 'NC-2026-0109', sourceType: 'nc',        completedDate: '2026-04-12' },
  { id: 'TASK-014', title: 'Recover A/V recordings — 3 affected paediatric studies',     description: '', priority: 'high',     status: 'done',        assignedTo: 'M. Chen',       dueDate: '2026-04-10', clause: '5.3',   source: 'NC-2026-0107', sourceType: 'nc',        completedDate: '2026-04-09' },
];

function nextId(tasks) {
  const nums = tasks.map(t => parseInt(t.id.replace('TASK-', ''))).filter(n => !isNaN(n));
  return `TASK-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
}

export function sortTasks(tasks) {
  const today = new Date();
  return [...tasks].sort((a, b) => {
    const aOverdue = new Date(a.dueDate) < today ? 1 : 0;
    const bOverdue = new Date(b.dueDate) < today ? 1 : 0;
    if (bOverdue !== aOverdue) return bOverdue - aOverdue;
    const pa = PRIORITY_RANK[a.priority] ?? 9;
    const pb = PRIORITY_RANK[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalPrefill, setModalPrefill] = useState({});

  const openCreateTask = (prefill = {}) => { setModalPrefill(prefill); setModalOpen(true); };
  const closeTaskModal = () => { setModalOpen(false); setModalPrefill({}); };

  const addTask = (task) => {
    const withId = { ...task, id: nextId(tasks), status: task.status || 'open', completedDate: null };
    setTasks(prev => [withId, ...prev]);
  };

  const updateTask = (id, changes) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));

  const completeTask = (id) => {
    const today = new Date().toISOString().slice(0, 10);
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'done' ? 'open' : 'done', completedDate: t.status !== 'done' ? today : null } : t
    ));
  };

  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, completeTask, deleteTask, openCreateTask, closeTaskModal, modalOpen, modalPrefill }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  return useContext(TaskContext);
}
