import React, { useState } from 'react';
import Tags from '../components/pms/Tags';
import ProjectMembers from '../components/pms/ProjectMembers';
import TaskTags from '../components/pms/TaskTags';
import TaskComments from '../components/pms/TaskComments';
import TaskAttachments from '../components/pms/TaskAttachments';
import TimeLogs from '../components/pms/TimeLogs';

export default function PmsDemo(){
  const [projectId,setProjectId]=useState('1');
  const [taskId,setTaskId]=useState('1');

  return (
    <div style={{padding:16}}>
      <h2>PMS Demo</h2>
      <div style={{marginBottom:12}}>
        <label>Project ID: <input value={projectId} onChange={e=>setProjectId(e.target.value)} /></label>
        <label style={{marginLeft:8}}>Task ID: <input value={taskId} onChange={e=>setTaskId(e.target.value)} /></label>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <Tags />
          <ProjectMembers projectId={projectId} />
        </div>
        <div>
          <TaskTags taskId={taskId} />
          <TaskComments taskId={taskId} />
          <TaskAttachments taskId={taskId} />
          <TimeLogs taskId={taskId} />
        </div>
      </div>
    </div>
  );
}
