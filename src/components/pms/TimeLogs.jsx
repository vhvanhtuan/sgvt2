import React, { useCallback, useEffect, useState } from 'react';

export default function TimeLogs({ taskId }){
  const [logs,setLogs]=useState([]);
  const [started,setStarted]=useState('');
  const [ended,setEnded]=useState('');
  const [note,setNote]=useState('');

  const fetchLogs = useCallback(() => {
    fetch('/api/pms.php?action=time_logs&task_id='+encodeURIComponent(taskId))
      .then(r=>r.json())
      .then(j=>{ if(j.success) setLogs(j.time_logs||[]); });
  }, [taskId]);

  useEffect(()=>{ if(taskId) fetchLogs(); },[taskId, fetchLogs]);

  function create(e){ e.preventDefault(); const payload = { task_id: taskId, started_at: started, ended_at: ended, note }; fetch('/api/pms.php?action=time_log_create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json()).then(j=>{ if(j.success){ setStarted(''); setEnded(''); setNote(''); fetchLogs(); } else alert(j.message||'Error'); }); }

  return (
    <div>
      <h4>Time Logs</h4>
      <ul>
        {logs.map(l=> <li key={l.id}>{l.started_at} - {l.ended_at || '-'} ({l.duration_minutes || '-' } min) <small>by {l.first_name||'User'}</small><div>{l.note}</div></li>)}
      </ul>
      <form onSubmit={create}>
        <div><label>Start: <input value={started} onChange={e=>setStarted(e.target.value)} placeholder="YYYY-MM-DD HH:MM:SS" /></label></div>
        <div><label>End: <input value={ended} onChange={e=>setEnded(e.target.value)} placeholder="YYYY-MM-DD HH:MM:SS" /></label></div>
        <div><textarea value={note} onChange={e=>setNote(e.target.value)} /></div>
        <button type="submit">Add Time Log</button>
      </form>
    </div>
  );
}
