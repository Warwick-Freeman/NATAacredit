import React, { useState, useMemo } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs, Drawer } from '../components';
import { useAuth } from '../AuthContext';
import { useTaskContext, sortTasks } from '../TaskContext';
import TaskFormDrawer from '../task-form-drawer';

const PRIO_KIND = { critical: 'bad', high: 'warn', medium: 'info', low: 'outline' };
const SOURCE_ICON = { nc: 'alert', equipment: 'cube', document: 'file', staff: 'users', audit: 'audit', manual: 'clipboard' };

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
};

function dueBadge(dueDate, status) {
  if (status === 'done') return null;
  const diff = Math.round((new Date(dueDate) - new Date()) / 86400000);
  if (diff < 0)  return { text: `Overdue ${Math.abs(diff)}d`, color: 'var(--bad)' };
  if (diff === 0) return { text: 'Due today', color: 'var(--bad)' };
  if (diff <= 3)  return { text: `Due in ${diff}d`, color: 'var(--warn)' };
  if (diff <= 7)  return { text: `Due in ${diff}d`, color: 'var(--ink-3)' };
  return null;
}

const TaskRow = ({ task, onComplete, onEdit, showAssignee }) => {
  const badge = dueBadge(task.dueDate, task.status);
  const isDone = task.status === 'done';

  return (
    <div style={{
      padding: '12px 18px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      opacity: isDone ? 0.55 : 1,
      background: isDone ? 'var(--surface-2)' : undefined,
    }}>
      {/* Checkbox */}
      <button
        style={{
          marginTop: 2, flexShrink: 0,
          width: 18, height: 18, borderRadius: 4,
          border: `2px solid ${isDone ? 'var(--good)' : 'var(--border-strong)'}`,
          background: isDone ? 'var(--good)' : 'transparent',
          cursor: 'pointer', display: 'grid', placeItems: 'center',
        }}
        onClick={() => onComplete(task.id)}
        title={isDone ? 'Mark incomplete' : 'Mark complete'}
      >
        {isDone && <Icon name="check" size={10} style={{ color: 'white' }} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <Pill kind={PRIO_KIND[task.priority]}>{task.priority}</Pill>
          {task.source && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name={SOURCE_ICON[task.sourceType] || 'clipboard'} size={11} style={{ color: 'var(--ink-4)' }} />
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{task.source}</span>
            </span>
          )}
          {task.clause && (
            <span className="mono" style={{ fontSize: 10, color: 'var(--accent-ink)', background: 'var(--accent-soft)', padding: '1px 5px', borderRadius: 3 }}>
              cl. {task.clause}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 500,
          textDecoration: isDone ? 'line-through' : 'none',
          color: isDone ? 'var(--ink-3)' : 'var(--ink)',
        }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{task.description}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {task.dueDate && (
            <span style={{ fontSize: 11, color: badge?.color || 'var(--ink-3)' }}>
              {badge ? badge.text : fmtDate(task.dueDate)}
            </span>
          )}
          {task.completedDate && (
            <span style={{ fontSize: 11, color: 'var(--good)' }}>
              ✓ Completed {fmtDate(task.completedDate)}
            </span>
          )}
          {showAssignee && task.assignedTo && (
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>→ {task.assignedTo}</span>
          )}
        </div>
      </div>

      {/* Status pill */}
      {task.status === 'in-progress' && (
        <Pill kind="accent" dot>In progress</Pill>
      )}

      {/* Edit button */}
      {!isDone && (
        <button className="icon-btn" style={{ flexShrink: 0 }} onClick={() => onEdit(task)} title="Edit task">
          <Icon name="edit" size={13} />
        </button>
      )}
    </div>
  );
};

const TasksPage = () => {
  const { user } = useAuth();
  const { tasks, addTask, updateTask, completeTask, deleteTask, openCreateTask } = useTaskContext();

  const [tab,    setTab]    = useState('mine');
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');
  const [editTask, setEditTask] = useState(null);  // null | task object

  // Derived lists
  const myTasks   = useMemo(() => tasks.filter(t => t.assignedTo === user?.name), [tasks, user]);
  const viewTasks = tab === 'mine' ? myTasks : tasks;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sortTasks(viewTasks.filter(t => {
      if (filter === 'open')       return t.status === 'open';
      if (filter === 'inprogress') return t.status === 'in-progress';
      if (filter === 'done')       return t.status === 'done';
      return true;
    }).filter(t =>
      !q || t.title.toLowerCase().includes(q) ||
      (t.source || '').toLowerCase().includes(q) ||
      (t.clause || '').toLowerCase().includes(q)
    ));
  }, [viewTasks, filter, search]);

  // Stats
  const openCount     = tasks.filter(t => t.status !== 'done').length;
  const overdueCount  = tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date()).length;
  const criticalCount = tasks.filter(t => t.status !== 'done' && t.priority === 'critical').length;
  const myOpenCount   = myTasks.filter(t => t.status !== 'done').length;

  const handleSaveEdit = (saved) => {
    updateTask(saved.id, saved);
    setEditTask(null);
  };

  const groupByPriority = filter === 'done';

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Workspace"
        title="My tasks"
        subtitle="Compliance actions · corrective actions · follow-ups · scheduled work"
        actions={
          <button className="btn btn-primary" onClick={() => openCreateTask({ sourceType: 'manual', assignedTo: user?.name })}>
            <Icon name="plus" size={14} />Create task
          </button>
        }
      />

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="clipboard" size={13} />Open tasks</div>
          <div className="stat-value">{openCount}</div>
          <div className="stat-meta">{myOpenCount} assigned to me</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Overdue</div>
          <div className="stat-value" style={{ color: overdueCount ? 'var(--bad)' : 'var(--good)' }}>{overdueCount}</div>
          <div className="stat-meta">{overdueCount ? 'requires attention' : 'all on track'}</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="pulse" size={13} />Critical</div>
          <div className="stat-value" style={{ color: criticalCount ? 'var(--bad)' : 'inherit' }}>{criticalCount}</div>
          <div className="stat-meta">highest priority</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="check" size={13} />Completed</div>
          <div className="stat-value">{tasks.filter(t => t.status === 'done').length}</div>
          <div className="stat-meta">this period</div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'mine', label: 'My tasks',   count: myOpenCount  || undefined },
        { id: 'all',  label: 'All tasks',  count: openCount    || undefined },
      ]} />

      {/* Filter + search */}
      <div className="filter-bar">
        {[
          { key: 'open',       label: 'Open' },
          { key: 'inprogress', label: 'In progress' },
          { key: 'done',       label: 'Done' },
          { key: 'all',        label: 'All' },
        ].map(f => (
          <button key={f.key} className={`chip-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="search" style={{ width: 220 }}
          onClick={e => e.currentTarget.querySelector('input')?.focus()}>
          <Icon name="search" size={12} />
          <input
            style={{ border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontSize: 12, color: 'var(--ink)', width: '100%' }}
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Priority-grouped header */}
      {filtered.length === 0 ? (
        <div className="card"><div className="empty">No tasks match your filter.</div></div>
      ) : (
        <div className="card">
          {/* Priority group headers for open/in-progress */}
          {filter !== 'done' ? (
            <>
              {['critical', 'high', 'medium', 'low'].map(p => {
                const group = filtered.filter(t => t.priority === p);
                if (!group.length) return null;
                return (
                  <React.Fragment key={p}>
                    <div style={{
                      padding: '8px 18px',
                      background: 'var(--surface-2)',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 11, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: 'var(--ink-3)',
                    }}>
                      <Pill kind={PRIO_KIND[p]}>{p}</Pill>
                      <span>{group.length} task{group.length !== 1 ? 's' : ''}</span>
                    </div>
                    {group.map(t => (
                      <TaskRow key={t.id} task={t}
                        onComplete={completeTask}
                        onEdit={setEditTask}
                        showAssignee={tab === 'all'}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </>
          ) : (
            filtered.map(t => (
              <TaskRow key={t.id} task={t}
                onComplete={completeTask}
                onEdit={setEditTask}
                showAssignee={tab === 'all'}
              />
            ))
          )}
        </div>
      )}

      {/* Edit task drawer */}
      <Drawer open={!!editTask} onClose={() => setEditTask(null)}>
        {editTask && (
          <TaskFormDrawer
            key={editTask.id}
            prefill={editTask}
            isEdit
            onSave={handleSaveEdit}
            onDelete={deleteTask}
            onClose={() => setEditTask(null)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default TasksPage;
