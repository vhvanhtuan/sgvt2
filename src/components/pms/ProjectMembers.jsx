import React, { useCallback, useEffect, useState } from 'react';

export default function ProjectMembers({ projectId }){
  const [members,setMembers]=useState([]);
  const [userId,setUserId]=useState('');
  const [role,setRole]=useState('');

  const fetchMembers = useCallback(() => {
    fetch('/api/pms.php?action=project_members&project_id='+encodeURIComponent(projectId))
      .then(r=>r.json())
      .then(j=>{ if(j.success) setMembers(j.members||[]); });
  }, [projectId]);

  useEffect(()=>{ if(projectId) fetchMembers(); },[projectId, fetchMembers]);

  function add(e){ e.preventDefault(); fetch('/api/pms.php?action=project_member_add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:projectId,user_id:userId,role})}).then(r=>r.json()).then(j=>{ if(j.success){ setUserId(''); setRole(''); fetchMembers(); } else alert(j.message||'Error'); }); }

  function remove(id){ if(!window.confirm('Remove member?')) return; fetch('/api/pms.php?action=project_member_remove&id='+encodeURIComponent(id),{method:'POST'}).then(r=>r.json()).then(j=>{ if(j.success) fetchMembers(); else alert(j.message||'Error'); }); }

  return (
    <div>
      <h4>Project Members</h4>
      <ul>
        {members.map(m=> <li key={m.id}>{m.first_name || ''} {m.last_name || ''} ({m.e_mail || m.user_id}) - {m.role} <button onClick={()=>remove(m.id)}>Remove</button></li>)}
      </ul>
      <form onSubmit={add}>
        <input placeholder="user_id (numeric)" value={userId} onChange={e=>setUserId(e.target.value)} />
        <input placeholder="role" value={role} onChange={e=>setRole(e.target.value)} />
        <button type="submit">Add Member</button>
      </form>
    </div>
  );
}
