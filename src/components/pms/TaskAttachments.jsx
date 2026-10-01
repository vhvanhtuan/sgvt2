import React, { useCallback, useEffect, useState } from 'react';

export default function TaskAttachments({ taskId }){
  const [list,setList]=useState([]);
  const [file,setFile]=useState(null);

  const fetchList = useCallback(() => {
    fetch('/api/pms.php?action=task_attachments&task_id='+encodeURIComponent(taskId))
      .then(r=>r.json())
      .then(j=>{ if(j.success) setList(j.attachments||[]); });
  }, [taskId]);

  useEffect(()=>{ if(taskId) fetchList(); },[taskId, fetchList]);

  function upload(e){ e.preventDefault(); if(!file){ alert('Choose file'); return; } const fd = new FormData(); fd.append('task_id', taskId); fd.append('file', file); fetch('/api/pms.php?action=task_attachment_upload',{method:'POST',body:fd}).then(r=>r.json()).then(j=>{ if(j.success){ setFile(null); fetchList(); } else alert(j.message||'Error'); }); }

  function del(id){ if(!window.confirm('Xóa file?')) return; fetch('/api/pms.php?action=task_attachment_delete&id='+encodeURIComponent(id),{method:'POST'}).then(r=>r.json()).then(j=>{ if(j.success) fetchList(); else alert(j.message||'Error'); }); }

  return (
    <div>
      <h4>Attachments</h4>
      <ul>
        {list.map(a=> <li key={a.id}><a href={a.file_path} target="_blank" rel="noreferrer">{a.file_name}</a> <small>{a.uploaded_at}</small> <button onClick={()=>del(a.id)}>Delete</button></li>)}
      </ul>
      <form onSubmit={upload}>
        <input type="file" onChange={e=>setFile(e.target.files[0])} />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}
