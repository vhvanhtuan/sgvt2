import React, { useCallback, useEffect, useState } from 'react';

export default function TaskComments({ taskId }){
  const [comments,setComments]=useState([]);
  const [text,setText]=useState('');

  const fetchComments = useCallback(() => {
    fetch('/api/pms.php?action=task_comments&task_id='+encodeURIComponent(taskId))
      .then(r=>r.json())
      .then(j=>{ if(j.success) setComments(j.comments||[]); });
  }, [taskId]);

  useEffect(()=>{ if(taskId) fetchComments(); },[taskId, fetchComments]);

  function post(e){ e.preventDefault(); fetch('/api/pms.php?action=task_comment_create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task_id:taskId,comment:text})}).then(r=>r.json()).then(j=>{ if(j.success){ setText(''); fetchComments(); } else alert(j.message||'Error'); }); }

  return (
    <div>
      <h4>Comments</h4>
      <ul>
        {comments.map(c=> <li key={c.id}><strong>{c.first_name || 'User'}</strong>: {c.comment} <small style={{color:'#666'}}>{c.created_at}</small></li>)}
      </ul>
      <form onSubmit={post}>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} style={{width:'100%'}} />
        <button type="submit">Add Comment</button>
      </form>
    </div>
  );
}
