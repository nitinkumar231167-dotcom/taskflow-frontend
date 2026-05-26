import React, { useState, useEffect } from 'react';

const API = 'https://taskflow-backend-rust-tau.vercel.app';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [minImportance, setMinImportance] = useState('');
  const [form, setForm] = useState({ title: '', description: '', importance: 3, dueDate: '' });
  const [formError, setFormError] = useState('');
  const [stats, setStats] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `${API}/bfhl/tasks?`;
      if (status) url += `status=${status}&`;
      if (minImportance) url += `minImportance=${minImportance}`;
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
      setError('');
    } catch (e) { setError('Failed to fetch tasks'); }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/bfhl/tasks/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {}
  };

  useEffect(() => { fetchTasks(); fetchStats(); }, [status, minImportance]);

  const handleCreate = async () => {
    setFormError('');
    if (!form.title || !form.dueDate) return setFormError('Title and due date required');
    if (form.title.length < 3) return setFormError('Title min 3 chars');
    try {
      const res = await fetch(`${API}/bfhl/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, importance: parseInt(form.importance) })
      });
      const data = await res.json();
      if (!res.ok) return setFormError(data.error);
      setForm({ title: '', description: '', importance: 3, dueDate: '' });
      fetchTasks(); fetchStats();
    } catch (e) { setFormError('Failed to create task'); }
  };

  const handleComplete = async (id) => {
    await fetch(`${API}/bfhl/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    fetchTasks(); fetchStats();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await fetch(`${API}/bfhl/tasks/${id}`, { method: 'DELETE' });
    fetchTasks(); fetchStats();
  };

  const formatDate = (d) => {
    const days = Math.floor((new Date(d) - new Date()) / 86400000);
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    return `in ${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>TaskFlow</h1>

      {stats && (
        <div style={{ background: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 20, display: 'flex', gap: 20 }}>
          <span>Total: <b>{stats.totalTasks}</b></span>
          <span>Pending: <b>{stats.pendingTasks}</b></span>
          <span>Completed: <b>{stats.completedTasks}</b></span>
          <span>Overdue: <b style={{color:'red'}}>{stats.overdueTasks}</b></span>
          <span>Avg Importance: <b>{stats.averageImportance}</b></span>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #ddd', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h3>Create Task</h3>
        <input placeholder="Title (min 3 chars)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{width:'100%', marginBottom:8, padding:8}} />
        <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{width:'100%', marginBottom:8, padding:8}} />
        <select value={form.importance} onChange={e => setForm({...form, importance: e.target.value})} style={{marginBottom:8, padding:8, marginRight:8}}>
          {[1,2,3,4,5].map(i => <option key={i} value={i}>Importance: {i}</option>)}
        </select>
        <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} style={{marginBottom:8, padding:8}} />
        {formError && <p style={{color:'red'}}>{formError}</p>}
        <button onClick={handleCreate} style={{background:'#1a73e8', color:'white', padding:'8px 16px', border:'none', cursor:'pointer'}}>Create Task</button>
      </div>

      <div style={{marginBottom:16, display:'flex', gap:12}}>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{padding:8}}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <input type="number" placeholder="Min Importance" min="1" max="5" value={minImportance} onChange={e => setMinImportance(e.target.value)} style={{padding:8, width:140}} />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && tasks.length === 0 && <p>No tasks found!</p>}

      {tasks.map(task => (
        <div key={task._id} style={{border: task.priorityScore >= 50 ? '2px solid red' : '1px solid #ddd', padding:16, marginBottom:12, borderRadius:8}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <h3 style={{margin:0}}>{task.title} {task.priorityScore >= 50 && <span style={{background:'red', color:'white', padding:'2px 6px', borderRadius:4, fontSize:12}}>HIGH PRIORITY</span>}</h3>
            <span style={{background: task.status === 'completed' ? 'green' : 'orange', color:'white', padding:'2px 8px', borderRadius:4}}>{task.status}</span>
          </div>
          <p style={{color:'#666'}}>{task.description}</p>
          <div style={{display:'flex', gap:16}}>
            <span>⭐ {task.importance}/5</span>
            <span>📅 {formatDate(task.dueDate)}</span>
            <span>Score: <b>{task.priorityScore}</b></span>
          </div>
          <div style={{marginTop:8}}>
            {task.status === 'pending' && <button onClick={() => handleComplete(task._id)} style={{marginRight:8, padding:'4px 12px', background:'green', color:'white', border:'none', cursor:'pointer'}}>✓ Complete</button>}
            <button onClick={() => handleDelete(task._id)} style={{padding:'4px 12px', background:'red', color:'white', border:'none', cursor:'pointer'}}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;