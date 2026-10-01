import React, { useEffect, useState } from 'react';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ffffff');

  useEffect(() => { fetchTags(); }, []);

  function fetchTags() {
    fetch('/api/pms.php?action=tags').then(r=>r.json()).then(j=>{ if(j.success) setTags(j.tags||[]); });
  }

  function createTag(e){ e.preventDefault(); fetch('/api/pms.php?action=tag_insert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,color})}).then(r=>r.json()).then(j=>{ if(j.success){ setName(''); fetchTags(); } else alert(j.message||'Error'); }); }

  function deleteTag(id){ if(!window.confirm('Xóa tag?')) return; fetch('/api/pms.php?action=tag_delete&id='+encodeURIComponent(id),{method:'POST'}).then(r=>r.json()).then(j=>{ if(j.success) fetchTags(); else alert(j.message||'Error'); }); }

  return (
    <div>
      <h3>Tags</h3>
      <form onSubmit={createTag} style={{marginBottom:12}}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{marginLeft:8}} />
        <button type="submit" style={{marginLeft:8}}>Add</button>
      </form>
      <ul>
        {tags.map(t=> (
          <li key={t.id}><span style={{display:'inline-block',width:10,height:10,background:t.color,marginRight:8}}></span>{t.name} <button onClick={()=>deleteTag(t.id)}>Delete</button></li>
        ))}
      </ul>
    </div>
  );
}
