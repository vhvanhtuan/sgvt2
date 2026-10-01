(function(){
  // Simple hash-based SPA for PMS (frontend-only demo)
  const root = document.getElementById('pms-root');
  let store = { projects: [], tasks: [], milestones: [], tags: [], members: [] };

  function nav(){
    return `
      <header class="pms-header">
        <h1>PMS — Projects</h1>
        <nav>
          <a href="#/dashboard">Dashboard</a>
          <a href="#/plans">Plans</a>
          <a href="#/projects">Projects</a>
          <a href="#/tasks">Tasks</a>
        </nav>
      </header>
    `;
  }

  function dashboardView(){
    const pCount = (store.dashboard && typeof store.dashboard.total_projects !== 'undefined') ? store.dashboard.total_projects : store.projects.length;
    const tCount = (store.dashboard && typeof store.dashboard.total_tasks !== 'undefined') ? store.dashboard.total_tasks : store.tasks.length;
    const mCount = store.milestones.length;
    const dueSoon = store.dashboard && store.dashboard.tasks_due_soon ? store.dashboard.tasks_due_soon : 0;
    const byStatus = store.dashboard && store.dashboard.tasks_by_status ? store.dashboard.tasks_by_status : {};
    return `
      <section class="pms-dashboard">
        <div class="dashboard-grid">
          <div class="left-col">
            <div class="top-cards">
              <div class="top-card">
                <div class="title">Kế Hoạch Đang Thực Hiện</div>
                <div class="value">5</div>
              </div>
              <div class="top-card">
                <div class="title">Dự Án Đang Triển Khai</div>
                <div class="value">8</div>
              </div>
              <div class="top-card">
                <div class="title">Nhiệm Vụ Đang Xử Lý</div>
                <div class="value">${tCount}</div>
                <div class="muted" style="font-size:12px">Due soon: ${dueSoon}</div>
              </div>
              <div class="top-card">
                <div class="title">Ngân Sách Đã Sử Dụng</div>
                <div class="value">500,000,000 đ</div>
              </div>
            </div>

            <div class="progress-gantt">
              <div class="donut">
                <div style="font-size:12px;color:var(--muted)">Tiến Độ Kế Hoạch</div>
                <div style="font-size:22px;font-weight:700;margin-top:8px">45%</div>
                <div class="muted" style="font-size:12px;margin-top:6px">Hoàn Thành</div>
              </div>
              <div class="gantt">
                <div style="font-weight:700;margin-bottom:8px">Tiến Độ Dự Án</div>
                <div style="height:120px;background:linear-gradient(90deg,#eef2ff 0 30%, #fff 30%);border-radius:6px"></div>
              </div>
            </div>

            <div class="kanban">
              <div class="kanban-column">
                <div class="column-title">To-Do</div>
                <div class="card-item">Thiết kế slide</div>
                <div class="card-item">Viết báo cáo</div>
              </div>
              <div class="kanban-column">
                <div class="column-title">In Progress</div>
                <div class="card-item">Phát triển tính năng</div>
                <div class="card-item">Kiểm tra phần mềm</div>
              </div>
              <div class="kanban-column">
                <div class="column-title">Done</div>
                <div class="card-item">Họp team</div>
              </div>
            </div>

            <div class="charts">
              <div class="chart-card">
                <div class="title">Hiệu Suất Công Việc</div>
                <canvas id="chart-tasks" height="120" style="margin-top:8px"></canvas>
                <div style="margin-top:8px;font-size:13px;color:var(--muted)">Status breakdown: ${Object.keys(byStatus).map(k=>k+': '+byStatus[k]).join(' • ')}</div>
              </div>
              <div class="chart-card">
                <div class="title">Chi Phí Dự Án</div>
                <canvas id="chart-costs" height="120" style="margin-top:8px"></canvas>
              </div>
            </div>
          </div>

          <aside class="right-col">
            <div class="side-card">
              <div class="label">Tài Nguyên & Ngân Sách</div>
              <div class="big">Nhân Sự: 24 / 30</div>
              <div class="muted" style="margin-top:8px">Ngân Sách: 350,000,000 / 500,000,000 đ</div>
            </div>

            <div class="side-card">
              <div class="label">Thông Báo Mới</div>
              <ul class="muted" style="margin:8px 0 0 0;padding-left:18px">
                <li>Task "Hoàn thiện báo cáo" sắp đến hạn</li>
                <li>Dự án B có nguy cơ trễ tiến độ</li>
                <li>Cuộc họp phòng Marketing 10:00 sáng</li>
              </ul>
            </div>

            <div class="side-card">
              <div class="label">Báo Cáo Hiệu Suất</div>
              <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
                <div style="width:110px;height:110px;border-radius:60px;background:conic-gradient(#34d399 0 45%, #fde68a 45% 75%, #f87171 75% 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">80%</div>
                <div>
                  <div class="muted">Mục Tiêu</div>
                  <div class="big">80% Hoàn Thành</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function projectsView(){
    const planOptions = (store.plans||[]).map(pl=>`<option value="${pl.id}">${pl.title}</option>`).join('');
    const createForm = `
      <form id="project-create-form" class="mb-3 row g-2">
        <div class="col-md-4"><input name="title" class="form-control" placeholder="Project title" required /></div>
        <div class="col-md-4"><select name="plan_id" class="form-select">${planOptions}</select></div>
        <div class="col-md-4"><button class="btn btn-primary">Create Project</button></div>
        <div class="col-12"><textarea name="description" class="form-control mt-2" placeholder="Description"></textarea></div>
      </form>
    `;

    const list = store.projects && store.projects.length ? `<div class="projects-list">${store.projects.map(p=>`
      <div class="project-card card" data-id="${p.id}">
        <div class="card-body">
          <h5 class="card-title">${p.title}</h5>
          <h6 class="card-subtitle mb-2 text-muted">Plan: ${ (store.plans.find(x=>x.id==p.plan_id)||{}).title || '—' }</h6>
          <p class="card-text">${p.description||''}</p>
          <div class="d-flex justify-content-end gap-2">
            <a href="#/tasks?project=${p.id}" class="btn btn-sm btn-outline-primary"><i class="fa fa-list"></i> Tasks</a>
            <button class="btn btn-sm btn-outline-secondary project-edit" data-id="${p.id}"><i class="fa fa-pen"></i> Edit</button>
            <button class="btn btn-sm btn-outline-danger project-delete" data-id="${p.id}"><i class="fa fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `).join('')}</div>` : '<p class="mt-3">No projects found.</p>';

    return `<section class="pms-projects">${createForm}${list}</section>`;
  }

  function bindProjectsHandlers(){
    const form = document.getElementById('project-create-form');
    if(form){
      form.addEventListener('submit', e=>{
        e.preventDefault();
        const fd = new FormData(form);
        const payload = { title: fd.get('title'), description: fd.get('description') || null, plan_id: fd.get('plan_id') || null };
        fetch('/api/pms.php?action=project_insert', { method: 'POST', headers: apiHeaders(), body: JSON.stringify(payload) })
          .then(r=>r.json()).then(res=>{ if(res && res.success){ loadData(); } else alert('Create project failed'); }).catch(err=>alert('Create error: '+err.message));
      });
    }

    document.querySelectorAll('.project-edit').forEach(btn=>{
      btn.addEventListener('click', ev=>{
        const id = btn.dataset.id; showProjectModal(id);
      });
    });

    document.querySelectorAll('.project-delete').forEach(btn=>{
      btn.addEventListener('click', ev=>{
        const id = btn.dataset.id; if(!confirm('Delete project '+id+'?')) return;
        fetch('/api/pms.php?action=project_delete&id='+encodeURIComponent(id), { method:'POST', headers: apiHeaders() })
          .then(r=>r.json()).then(res=>{ if(res && res.success) loadData(); else alert('Delete failed'); }).catch(err=>alert('Delete error: '+err.message));
      });
    });
  }

  function bindTasksHandlers(){
    // Create form handler
    const form = document.getElementById('task-create-form');
    if(form){
      form.addEventListener('submit', e=>{
        e.preventDefault();
        const fd = new FormData(form);
        const payload = { project_id: fd.get('project_id'), title: fd.get('title'), description: fd.get('description') || null, assignee_id: fd.get('assignee_id') || null };
        fetch('/api/pms.php?action=task_insert', { method:'POST', headers: apiHeaders(), body: JSON.stringify(payload) })
          .then(r=>r.json()).then(res=>{ if(res && res.success){ loadData(); } else alert('Create task failed'); }).catch(err=>alert('Create error: '+err.message));
      });
    }

    // Filter form handler (apply/reset)
    const filterForm = document.getElementById('tasks-filter-form');
    if (filterForm) {
      filterForm.addEventListener('submit', e=>{
        e.preventDefault();
        const fd = new FormData(filterForm);
        const params = {};
        if (fd.get('project_id')) params.project_id = fd.get('project_id');
        if (fd.get('assignee_id')) params.assignee_id = fd.get('assignee_id');
        if (fd.get('status')) params.status = fd.get('status');
        if (fd.get('q')) params.q = fd.get('q');
        fetchTasks(params).then(()=>{ route(); });
      });
      const resetBtn = document.getElementById('tasks-reset-filters');
      if (resetBtn) resetBtn.addEventListener('click', ()=>{ filterForm.reset(); fetchTasks({}).then(()=>route()); });
    }

    // Row action handlers: open modal for edit, confirm for delete
    document.querySelectorAll('.task-edit').forEach(btn=>{
      btn.addEventListener('click', ()=>{ const id = btn.dataset.id; showTaskModal(id); });
    });

    document.querySelectorAll('.task-delete').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id; if(!confirm('Delete task '+id+'?')) return;
        fetch('/api/pms.php?action=task_delete&id='+encodeURIComponent(id), { method:'POST', headers: apiHeaders() })
          .then(r=>r.json()).then(res=>{ if(res && res.success) loadData(); else alert('Delete failed'); }).catch(err=>alert('Delete error: '+err.message));
      });
    });
  }

  // Fetch tasks from API with optional filters and update store.tasks
  function fetchTasks(filters){
    const token = localStorage.getItem('cms_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const qs = new URLSearchParams(Object.assign({ limit: 200, page: 1 }, filters)).toString();
    return fetch('/api/pms.php?action=tasks&' + qs, { headers }).then(r=>r.json()).then(res=>{
      if (res && res.success && Array.isArray(res.tasks)) store.tasks = res.tasks;
      return res;
    }).catch(err=>{ console.warn('fetchTasks error', err); return Promise.resolve(null); });
  }

  function tasksView(){
    // allow optional project filter via hash: #/tasks?project=ID
    const hash = location.hash || '';
    let projectFilter = null;
    try{ const q = hash.split('?')[1]; if(q){ const params = new URLSearchParams(q); if(params.get('project')) projectFilter = params.get('project'); } }catch(e){}
    const tasks = projectFilter ? store.tasks.filter(t=>String(t.project_id)===String(projectFilter)) : store.tasks;
    const projectOptions = (store.projects||[]).map(p=>`<option value="${p.id}" ${projectFilter && String(p.id)===String(projectFilter)?'selected':''}>${p.title}</option>`).join('');

    const assigneeOptions = (store.assignees||[]).map(u=>`<option value="${u.user_id}">${u.first_name || u.e_mail || u.user_id}${u.name? ' — '+u.name : ''}</option>`).join('');
    const filterForm = `
      <form id="tasks-filter-form" class="row g-2 mb-3">
        <div class="col-md-3"><select name="project_id" class="form-select"><option value="">All projects</option>${projectOptions}</select></div>
        <div class="col-md-3"><select name="assignee_id" class="form-select"><option value="">All assignees</option>${assigneeOptions}</select></div>
        <div class="col-md-2"><select name="status" class="form-select"><option value="">Any status</option><option value="open">open</option><option value="in_progress">in_progress</option><option value="todo">todo</option><option value="done">done</option></select></div>
        <div class="col-md-2"><input name="q" class="form-control" placeholder="Search..." /></div>
        <div class="col-md-2 text-end"><button class="btn btn-outline-primary">Apply</button> <button id="tasks-reset-filters" type="button" class="btn btn-secondary">Reset</button></div>
      </form>
    `;

    const createForm = `
      <form id="task-create-form" class="row g-2 mb-3">
        <div class="col-md-4"><select name="project_id" class="form-select" required><option value="">Select project</option>${projectOptions}</select></div>
        <div class="col-md-4"><input name="title" class="form-control" placeholder="Task title" required/></div>
        <div class="col-md-2"><select name="assignee_id" class="form-select"><option value="">Assignee</option>${assigneeOptions}</select></div>
        <div class="col-md-2 text-end"><button class="btn btn-primary">Create Task</button></div>
        <div class="col-12"><textarea name="description" class="form-control" placeholder="Description"></textarea></div>
      </form>
    `;

    const rows = tasks.length ? tasks.map(t=>`
      <tr data-id="${t.id}">
        <td>${t.id}</td>
        <td>${t.title}</td>
        <td>${projTitle(t.project_id)}</td>
        <td>${assigneeName(t.assignee_id)||''}</td>
        <td>${t.status}</td>
        <td class="task-actions text-end"><button class="btn btn-sm btn-outline-secondary task-edit" data-id="${t.id}"><i class="fa fa-pen"></i></button> <button class="btn btn-sm btn-outline-danger task-delete" data-id="${t.id}"><i class="fa fa-trash"></i></button></td>
      </tr>
    `).join('') : '<tr><td colspan="6">No tasks found.</td></tr>';

    return `
      <section class="pms-tasks">
        ${filterForm}
        ${createForm}
        <div class="tasks-list">
          <table class="table table-striped table-hover">
            <thead><tr><th>ID</th><th>Title</th><th>Project</th><th>Assignee</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  // Modal helpers
  function populateModalSelect(selectEl, items, valueField='id', labelField='title', includeEmpty=true){
    if(!selectEl) return;
    let html = includeEmpty ? '<option value="">Select</option>' : '';
    items.forEach(it=>{ html += `<option value="${it[valueField]}">${it[labelField]||it.title||it.name}</option>`; });
    selectEl.innerHTML = html;
  }

  function showTaskModal(id){
    const t = store.tasks.find(x=>String(x.id)===String(id));
    if(!t) return alert('Task not found in loaded data');
    const form = document.getElementById('task-modal-form');
    form.id.value = t.id; form.title.value = t.title || ''; form.description.value = t.description || '';
    // populate projects select
    const projSel = form.querySelector('select[name="project_id"]');
    populateModalSelect(projSel, store.projects||[], 'id', 'title', false);
    if(t.project_id) projSel.value = t.project_id;
    // populate assignee select and set value
    const assSel = form.querySelector('select[name="assignee_id"]');
    populateModalSelect(assSel, store.assignees||[], 'user_id', 'first_name', true);
    if(t.assignee_id) assSel.value = t.assignee_id;
    form.status.value = t.status || 'todo';
    const modalEl = document.getElementById('taskModal');
    const bs = new bootstrap.Modal(modalEl); bs.show();
  }

  function showProjectModal(id){
    const p = store.projects.find(x=>String(x.id)===String(id));
    if(!p) return alert('Project not found in loaded data');
    const form = document.getElementById('project-modal-form');
    form.id.value = p.id; form.title.value = p.title || ''; form.description.value = p.description || '';
    const planSel = form.querySelector('select[name="plan_id"]');
    populateModalSelect(planSel, store.plans||[], 'id', 'title', false);
    if(p.plan_id) planSel.value = p.plan_id;
    const modalEl = document.getElementById('projectModal');
    const bs = new bootstrap.Modal(modalEl); bs.show();
  }

  function showPlanModal(id){
    const form = document.getElementById('plan-modal-form');
    if(!id){
      form.id.value = '';
      form.title.value = '';
      form.start_date.value = '';
      form.end_date.value = '';
      form.summary.value = '';
    } else {
      const pl = store.plans.find(x=>String(x.id)===String(id));
      if(!pl) return alert('Plan not found in loaded data');
      form.id.value = pl.id; form.title.value = pl.title || ''; form.start_date.value = pl.start_date || ''; form.end_date.value = pl.end_date || ''; form.summary.value = pl.summary || '';
    }
    const modalEl = document.getElementById('planModal');
    const bs = new bootstrap.Modal(modalEl); bs.show();
  }

  // Init modal save handlers once
  function initModals(){
    const taskSave = document.getElementById('task-modal-save');
    if(taskSave){
      taskSave.addEventListener('click', ()=>{
        const form = document.getElementById('task-modal-form');
        const id = form.id.value; if(!id) return alert('Missing id');
        const payload = { title: form.title.value, description: form.description.value || null, project_id: form.project_id.value || null, assignee_id: form.assignee_id.value || null, status: form.status.value || null };
        fetch('/api/pms.php?action=task_edit&id='+encodeURIComponent(id), { method:'POST', headers: apiHeaders(), body: JSON.stringify(payload) })
          .then(r=>r.json()).then(res=>{ if(res && res.success){ loadData(); const modalEl=document.getElementById('taskModal'); bootstrap.Modal.getInstance(modalEl).hide(); } else alert('Save failed'); }).catch(err=>alert('Save error: '+err.message));
      });
    }

    const projSave = document.getElementById('project-modal-save');
    if(projSave){
      projSave.addEventListener('click', ()=>{
        const form = document.getElementById('project-modal-form');
        const id = form.id.value; if(!id) return alert('Missing id');
        const payload = { title: form.title.value, description: form.description.value || null, plan_id: form.plan_id.value || null };
        fetch('/api/pms.php?action=project_edit&id='+encodeURIComponent(id), { method:'POST', headers: apiHeaders(), body: JSON.stringify(payload) })
          .then(r=>r.json()).then(res=>{ if(res && res.success){ loadData(); const modalEl=document.getElementById('projectModal'); bootstrap.Modal.getInstance(modalEl).hide(); } else alert('Save failed'); }).catch(err=>alert('Save error: '+err.message));
      });
    }
    const planSave = document.getElementById('plan-modal-save');
    if(planSave){
      planSave.addEventListener('click', ()=>{
        const form = document.getElementById('plan-modal-form');
        const id = form.id.value;
        const payload = { title: form.title.value, summary: form.summary.value || null, start_date: form.start_date.value || null, end_date: form.end_date.value || null };
        const action = id ? ('plan_edit&id='+encodeURIComponent(id)) : 'plan_insert';
        fetch('/api/pms.php?action='+action, { method:'POST', headers: apiHeaders(), body: JSON.stringify(payload) })
          .then(r=>r.json()).then(res=>{ if(res && res.success){ loadData(); const modalEl=document.getElementById('planModal'); bootstrap.Modal.getInstance(modalEl).hide(); } else alert('Save failed'); }).catch(err=>alert('Save error: '+err.message));
      });
    }
  }

  function plansView(){
    // Create button -> open modal
    const createForm = `
      <div class="d-flex justify-content-between align-items-end mb-3">
        <div></div>
        <div><button id="btn-new-plan" class="btn btn-primary">Create Plan</button></div>
      </div>
    `;

    const list = store.plans && store.plans.length ? store.plans.map(pl=>{
      const projects = store.projects.filter(pr => (pr.plan_id == pl.id));
          return `
        <article class="plan card" data-id="${pl.id}">
          <div class="card-body">
            <h5 class="card-title">${pl.title}</h5>
            <h6 class="card-subtitle mb-2 text-muted">Status: ${pl.status} • Owner: ${pl.owner_id||'N/A'}</h6>
            <p class="card-text">${pl.summary||''}</p>
            <div class="mb-2"><strong>Projects:</strong> ${projects.length ? '<ul class="mb-0 ps-3">' + projects.map(pp=>`<li>${pp.title} (${pp.status})</li>`).join('') + '</ul>' : '<span> — no projects</span>'}</div>
            <div class="d-flex justify-content-end gap-2">
              <a href="#/projects" class="btn btn-sm btn-outline-secondary">Projects</a>
              <button class="btn btn-sm btn-outline-secondary plan-edit" data-id="${pl.id}"><i class="fa fa-pen"></i> Edit</button>
              <button class="btn btn-sm btn-outline-danger plan-delete" data-id="${pl.id}"><i class="fa fa-trash"></i> Delete</button>
            </div>
          </div>
        </article>
      `;
    }).join('') : '<p>No plans found.</p>';

    return `<section class="pms-plans">${createForm}<div class="plans-list">${list}</div></section>`;
  }

  function projTitle(id){
    const p = store.projects.find(x=>x.id===id);
    return p ? p.title : '';
  }

  function assigneeName(id){
    if(!id) return '';
    const u = (store.assignees||[]).find(x=>String(x.user_id)===String(id));
    if(!u) return id;
    return u.first_name || u.e_mail || u.user_id;
  }

  function route(){
    const hash = location.hash.replace('#/','') || 'dashboard';
    let content = '';
    if(hash.startsWith('projects')) content = projectsView();
    else if(hash.startsWith('tasks')) content = tasksView();
    else if(hash.startsWith('plans')) content = plansView();
    else content = dashboardView();

    root.innerHTML = nav() + '<main class="pms-main">' + content + '</main>';
    if (hash.startsWith('plans')) bindPlansHandlers();
    if (hash.startsWith('projects')) bindProjectsHandlers();
    if (hash.startsWith('tasks')) bindTasksHandlers();
    // render charts when dashboard or views with charts are shown
    try{ renderCharts(); }catch(e){}
  }

  function apiHeaders(){
    const token = localStorage.getItem('cms_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
  }

  function bindPlansHandlers(){
    const btn = document.getElementById('btn-new-plan');
    if(btn){ btn.addEventListener('click', ()=>{ showPlanModal(); }); }

    // modal edit handlers
    document.querySelectorAll('.plan-edit').forEach(btn=>{ btn.addEventListener('click', ev=>{ const id = btn.dataset.id; showPlanModal(id); }); });

    document.querySelectorAll('.plan-delete').forEach(btn=>{
      btn.addEventListener('click', ev=>{
        const id = btn.dataset.id;
        if(!confirm('Delete plan id '+id+'? This will not delete projects automatically.')) return;
        fetch('/api/pms.php?action=plan_delete&id='+encodeURIComponent(id), { method: 'POST', headers: apiHeaders() })
          .then(r=>r.json()).then(res=>{ if(res && res.success){ loadData(); } else alert('Delete failed'); }).catch(err=>alert('Delete error: '+err.message));
      });
    });
  }

  function startInlineEdit(id){
    const pl = store.plans.find(x=>String(x.id)===String(id));
    if(!pl) return alert('Plan not found');
    const article = document.querySelector(`article.plan[data-id="${id}"]`);
    if(!article) return;
    article._orig = article.innerHTML;
    article.innerHTML = `
      <form class="plan-form-inline">
        <input name="title" value="${escapeHtml(pl.title||'')}" />
        <input name="start_date" value="${pl.start_date||''}" placeholder="YYYY-MM-DD" />
        <input name="end_date" value="${pl.end_date||''}" placeholder="YYYY-MM-DD" />
        <textarea name="summary">${escapeHtml(pl.summary||'')}</textarea>
        <div class="form-actions">
          <button type="button" class="btn btn-save">Save</button>
          <button type="button" class="btn-secondary btn-cancel">Cancel</button>
        </div>
      </form>
    `;
    const form = article.querySelector('form');
    form.querySelector('.btn-cancel').addEventListener('click', ()=>{ article.innerHTML = article._orig; bindPlansHandlers(); });
    form.querySelector('.btn-save').addEventListener('click', ()=>{
      const payload = {
        title: form.title.value,
        summary: form.summary.value,
        start_date: form.start_date.value || null,
        end_date: form.end_date.value || null
      };
      fetch('/api/pms.php?action=plan_edit&id='+encodeURIComponent(id), { method: 'POST', headers: apiHeaders(), body: JSON.stringify(payload) })
        .then(r=>r.json()).then(res=>{ if(res && res.success){ loadData(); } else alert('Edit failed'); }).catch(err=>alert('Edit error: '+err.message));
    });
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"]+/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

  function loadData(){
    // Load data from API
    const token = localStorage.getItem('cms_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    Promise.all([
      fetch('/api/pms.php?action=dashboard', { headers }).then(r=>r.json()),
      fetch('/api/pms.php?action=plans', { headers }).then(r=>r.json()),
      fetch('/api/pms.php?action=projects', { headers }).then(r=>r.json()),
      fetch('/api/pms.php?action=tasks&limit=200&page=1', { headers }).then(r=>r.json()),
      fetch('/api/pms.php?action=tags', { headers }).then(r=>r.json()),
      fetch('/api/pms.php?action=assignees', { headers }).then(r=>r.json())
    ]).then(([dbsum, pl, pj, tk, tg, as]) => {
      if (dbsum && dbsum.success) store.dashboard = dbsum;
      if (pl && pl.success && Array.isArray(pl.plans)) store.plans = pl.plans;
      if (pj && pj.success && Array.isArray(pj.projects)) store.projects = pj.projects;
      if (tk && tk.success && Array.isArray(tk.tasks)) store.tasks = tk.tasks;
      if (tg && tg.success && Array.isArray(tg.tags)) store.tags = tg.tags;
      if (as && as.success && Array.isArray(as.assignees)) store.assignees = as.assignees;
      route();
      // charts: initialize or update after data loaded
      setTimeout(()=>{ try{ renderCharts(); }catch(e){ console.warn('Chart render error',e); } },50);
    }).catch(err=>{
      root.innerHTML = '<p style="color:crimson">Failed to load data from API: '+err.message+'</p>' + nav();
    });
  }

  // Chart instances
  let charts = {};
  function renderCharts(){
    if(typeof Chart === 'undefined') return;
    // tasks chart (bar)
    const ctx1 = document.getElementById('chart-tasks');
    if(ctx1){
      // ensure canvas has an explicit display height to avoid repeated growth
      try{ ctx1.style.width = '100%'; ctx1.style.height = '220px'; }catch(e){}
      const labels = ['T1','T2','T3','T4'];
      const data = store.tasks.length ? [store.tasks.length, Math.max(1,Math.floor(store.tasks.length/2)), Math.max(1,Math.floor(store.tasks.length/3)), Math.max(1,Math.floor(store.tasks.length/4))] : [5,7,3,9];
      if(charts.tasks) { charts.tasks.data.labels = labels; charts.tasks.data.datasets[0].data = data; charts.tasks.update(); }
      else { charts.tasks = new Chart(ctx1.getContext('2d'),{ type:'bar', data:{ labels: labels, datasets:[{ label:'Tasks', data:data, backgroundColor:'#60a5fa' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } } }); }
    }
    // costs chart (line)
    const ctx2 = document.getElementById('chart-costs');
    if(ctx2){
      try{ ctx2.style.width = '100%'; ctx2.style.height = '220px'; }catch(e){}
      const labels = ['Jan','Feb','Mar','Apr'];
      const data = [120,150,170,200];
      if(charts.costs){ charts.costs.data.labels = labels; charts.costs.data.datasets[0].data = data; charts.costs.update(); }
      else { charts.costs = new Chart(ctx2.getContext('2d'),{ type:'line', data:{ labels:labels, datasets:[{ label:'Cost', data:data, borderColor:'#34d399', backgroundColor:'rgba(52,211,153,0.08)', fill:true }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } } }); }
    }
  }

  window.addEventListener('hashchange', route);
  initModals();
  loadData();
})();
