import React, { useCallback, useEffect, useState } from 'react';

export default function TaskTags({ taskId }){
  const [taskTags,setTaskTags]=useState([]);
  const [allTags,setAllTags]=useState([]);

  const fetchTags = useCallback(() => {
    fetch('/api/pms.php?action=task_tags&task_id='+encodeURIComponent(taskId))
      .then(r=>r.json())
      .then(j=>{ if(j.success) setTaskTags(j.task_tags||[]); });
  }, [taskId]);

  useEffect(()=>{ if(taskId){ fetchTags(); fetchAll(); } },[taskId, fetchTags]);

  function fetchAll(){ fetch('/api/pms.php?action=tags').then(r=>r.json()).then(j=>{ if(j.success) setAllTags(j.tags||[]); }); }

  function addTag(tagId){ fetch('/api/pms.php?action=task_tag_add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task_id:taskId,tag_id:tagId})}).then(r=>r.json()).then(j=>{ if(j.success) fetchTags(); else alert(j.message||'Error'); }); }

  function removeLink(linkId, tagId){ if(linkId){ fetch('/api/pms.php?action=task_tag_remove',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:linkId})}).then(r=>r.json()).then(j=>{ if(j.success) fetchTags(); else alert(j.message||'Error'); }); }
    else { fetch('/api/pms.php?action=task_tag_remove',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task_id:taskId,tag_id:tagId})}).then(r=>r.json()).then(j=>{ if(j.success) fetchTags(); else alert(j.message||'Error'); }); }
  }

  return (
    <div>
      <h4>Task Tags</h4>
      <div>
        {taskTags.map(t=> <span key={t.link_id} style={{display:'inline-block',padding:'4px 8px',margin:4,background:t.color||'#eee',borderRadius:4}}>{t.name} <button onClick={()=>removeLink(t.link_id,t.tag_id)}>x</button></span>)}
      </div>
      <div style={{marginTop:8}}>
        {allTags.map(t=> <button key={t.id} onClick={()=>addTag(t.id)} style={{margin:4}}>{t.name}</button>)}
      </div>
    </div>
  );
}
