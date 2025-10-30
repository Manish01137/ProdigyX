// Demo frontend-only implementation using localStorage.
// Handles: registration, pipeline simulation, auto-evaluation,
// report download (JSON file), company shortlist & notifications.

const STORAGE_KEY = 'placement_demo_v1';
const demoData = {
  students: [],
  companies: [{ id: 'c1', name: 'Acme Corp' }],
  shortlists: [],
  notifications: []
};

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData)); return JSON.parse(JSON.stringify(demoData)); }
  return JSON.parse(raw);
}
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
let state = loadState();

// Helpers
const $ = id => document.getElementById(id);
const toast = (msg, t=3000)=> {
  const el = $('toast'); el.textContent = msg; el.classList.remove('hidden');
  setTimeout(()=> el.classList.add('hidden'), t);
}

// Routing UI
const pages = {
  register: $('page-register'),
  student: $('page-student'),
  company: $('page-company'),
  admin: $('page-admin')
};
function showPage(name){
  Object.values(pages).forEach(p=>p.classList.add('hidden'));
  pages[name].classList.remove('hidden');
  if(name === 'student') renderStudentArea();
  if(name === 'company') renderCompanyTable();
  if(name === 'admin') renderAdmin();
}
$('nav-register').onclick = ()=>showPage('register');
$('nav-student').onclick = ()=>showPage('student');
$('nav-company').onclick = ()=>showPage('company');
$('nav-admin').onclick = ()=>showPage('admin');
showPage('register');

// Register form
$('register-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const f = new FormData(e.target);
  const student = {
    id: 's' + Date.now(),
    name: f.get('name'),
    email: f.get('email'),
    phone: f.get('phone') || '',
    college: f.get('college') || '',
    degree: f.get('degree') || '',
    gradYear: f.get('gradYear') || '',
    skills: (f.get('skills')||'').split(',').map(s=>s.trim()).filter(Boolean),
    certs: (f.get('certs')||'').split(',').map(s=>s.trim()).filter(Boolean),
    pipeline: { coding: null, aptitude: null, softskills: null, background: null },
    overall: 'pending',
    score: 0,
    createdAt: new Date().toISOString()
  };
  state.students.push(student); saveState(state);
  toast('Registered ' + student.name);
  e.target.reset();
});

// Demo seed
$('seed-demo').addEventListener('click', ()=>{
  if(state.students.length>0){ toast('Demo already seeded'); return; }
  state.students.push({
    id: 's_demo',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9999999999',
    college: 'Demo Institute',
    degree: 'B.Tech',
    gradYear: '2024',
    skills: ['JavaScript','Algorithms'],
    certs: ['JS Basics'],
    pipeline: { coding: null, aptitude: null, softskills: null, background: null },
    overall: 'pending',
    score: 0,
    createdAt: new Date().toISOString()
  });
  saveState(state);
  toast('Demo student created');
});

// Student area: select student & simulate pipeline
function renderStudentArea(){
  const area = $('student-area'); area.innerHTML = '';
  if(state.students.length === 0){
    area.innerHTML = '<p>No registered students yet. Use Register tab.</p>'; return;
  }
  const sel = document.createElement('select'); sel.style.width='100%';
  state.students.forEach(s=> {
    const o = document.createElement('option'); o.value=s.id; o.textContent = `${s.name} — ${s.college} (${s.overall})`;
    sel.appendChild(o);
  });
  sel.onchange = ()=> showStudentDetails(sel.value);
  area.appendChild(sel);
  showStudentDetails(state.students[0].id);
}

function showStudentDetails(id){
  const s = state.students.find(x=>x.id===id);
  const area = $('student-area');
  // details card
  const detailsCard = document.createElement('div'); detailsCard.className='card';
  detailsCard.innerHTML = `
    <h3>${s.name} <small class="small-muted">${s.email}</small></h3>
    <p><strong>College:</strong> ${s.college} — <strong>Degree:</strong> ${s.degree} (${s.gradYear})</p>
    <p><strong>Skills:</strong> ${s.skills.join(', ') || '-'}</p>
    <p><strong>Overall status:</strong> <em>${s.overall}</em> — <strong>Score:</strong> ${s.score}</p>
  `;
  // pipeline controls
  const pipelineCard = document.createElement('div'); pipelineCard.className='card';
  pipelineCard.innerHTML = `<h4>Verification Pipeline</h4>`;
  const rounds = ['coding','aptitude','softskills','background'];
  rounds.forEach(r=>{
    const status = s.pipeline[r] === null ? 'pending' : s.pipeline[r].status;
    const div = document.createElement('div'); div.style.marginBottom='10px';
    const label = document.createElement('div'); label.innerHTML = `<strong>${toLabel(r)}</strong> — <span class="small-muted">${status}</span>`;
    const btn = document.createElement('button'); btn.className='btn'; btn.textContent = s.pipeline[r] ? 'Retake/Update' : 'Take';
    btn.onclick = ()=> simulateRound(s.id, r);
    div.appendChild(label); div.appendChild(btn);
    pipelineCard.appendChild(div);
  });

  // report & actions
  const actionCard = document.createElement('div'); actionCard.className='card';
  const generateBtn = document.createElement('button'); generateBtn.className='btn teal';
  generateBtn.textContent = 'Generate Report (if passed)';
  generateBtn.onclick = ()=> {
    if(s.overall !== 'passed'){ toast('Student has not passed all rounds'); return; }
    downloadReport(s);
  };
  const evaluateBtn = document.createElement('button'); evaluateBtn.className='btn';
  evaluateBtn.textContent = 'Evaluate Pipeline';
  evaluateBtn.onclick = ()=> { evaluateStudent(s.id); renderStudentArea(); renderCompanyTable(); renderAdmin(); };
  actionCard.appendChild(generateBtn); actionCard.appendChild(evaluateBtn);

  // replace existing details area
  area.innerHTML = '';
  area.appendChild(detailsCard);
  area.appendChild(pipelineCard);
  area.appendChild(actionCard);
}

// Simulate a round
function simulateRound(studentId, round){
  const s = state.students.find(x=>x.id===studentId);
  // For demo: prompt for pass/fail or randomize; also accept a numeric score
  const pass = confirm(`Simulate ${toLabel(round)}: click OK to mark PASS, Cancel to mark FAIL.`);
  const score = pass ? Math.floor(75 + Math.random()*25) : Math.floor(30 + Math.random()*30);
  s.pipeline[round] = { status: pass ? 'passed' : 'failed', score };
  saveState(state);
  toast(`${toLabel(round)} marked ${s.pipeline[round].status} (${score})`);
  // auto-evaluate after background check completes (or always attempt)
  evaluateStudent(s.id);
  renderStudentArea();
  renderCompanyTable();
  renderAdmin();
}

// Evaluation logic: passed only if all rounds passed
function evaluateStudent(studentId){
  const s = state.students.find(x=>x.id===studentId);
  const rounds = Object.keys(s.pipeline);
  let allCompleted = true;
  let allPassed = true;
  let totalScore = 0;
  let filledCount = 0;
  rounds.forEach(r=>{
    const pr = s.pipeline[r];
    if(!pr) { allCompleted = false; allPassed = false; return; }
    filledCount++;
    totalScore += pr.score || 0;
    if(pr.status !== 'passed') allPassed = false;
  });
  s.score = filledCount ? Math.round(totalScore / filledCount) : 0;
  if(allPassed && allCompleted){
    if(s.overall !== 'passed'){
      s.overall = 'passed';
      // push to company pool (simulated): in demo, it's just flagged as verified
      toast(`${s.name} verified and marked as PASSED`);
    }
  } else if(!allCompleted){
    s.overall = 'in_progress';
  } else {
    s.overall = 'failed';
    // add feedback entry (simple)
    state.notifications.push({ id:'fb'+Date.now(), studentId: s.id, message: `Automated feedback: improve rounds where failed.`, time: new Date().toISOString() });
  }
  saveState(state);
}

// Company portal rendering
function renderCompanyTable(){
  const tbody = $('company-table').querySelector('tbody'); tbody.innerHTML = '';
  const filter = $('company-filter').value.toLowerCase();
  state.students.filter(s => s.overall === 'passed')
    .filter(s => {
      if(!filter) return true;
      return s.name.toLowerCase().includes(filter) || s.skills.join(' ').toLowerCase().includes(filter) || s.college.toLowerCase().includes(filter);
    })
    .forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${s.name}</td><td>${s.college}</td><td>${s.skills.join(', ')}</td><td>${s.score}</td>
        <td><button class="btn" data-id="${s.id}" data-action="report">Download</button></td>
        <td><button class="btn teal" data-id="${s.id}" data-action="shortlist">Shortlist</button></td>`;
      tbody.appendChild(tr);
    });
  // button events
  tbody.querySelectorAll('button').forEach(btn=>{
    btn.onclick = ()=> {
      const id = btn.dataset.id; const action = btn.dataset.action;
      if(action === 'report') downloadReportById(id);
      if(action === 'shortlist') shortlistCandidate(id);
    };
  });
}
$('company-filter').addEventListener('input', renderCompanyTable);

// Shortlist: create notification for placement cell and student
function shortlistCandidate(studentId){
  const s = state.students.find(x=>x.id===studentId);
  const entry = { id: 'sl' + Date.now(), studentId, companyId: 'c1', time: new Date().toISOString() };
  state.shortlists.push(entry);
  // notifications
  state.notifications.push({ id:'n'+Date.now(), to:'placement', studentId, message: `${s.name} shortlisted by ${state.companies[0].name}` , time:new Date().toISOString() });
  state.notifications.push({ id:'n'+(Date.now()+1), to:studentId, studentId, message: `You were shortlisted by ${state.companies[0].name}. Check placement cell.`, time:new Date().toISOString() });
  saveState(state);
  toast(`${s.name} shortlisted — placement cell notified`);
  renderAdmin();
}

// Admin rendering
function renderAdmin(){
  const notifs = state.notifications.slice().reverse();
  const ul = $('placement-notifs'); ul.innerHTML = '';
  notifs.forEach(n => {
    const li = document.createElement('li'); li.textContent = `[${n.time.split('T')[0]}] ${n.message}`;
    ul.appendChild(li);
  });
  const tbody = $('admin-table').querySelector('tbody'); tbody.innerHTML = '';
  state.students.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.overall}</td><td>${pipelineSummary(s)}</td>
      <td><button class="btn" data-id="${s.id}" data-act="view">View</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button').forEach(b=> b.onclick = ()=> {
    const id = b.dataset.id; showPage('student'); setTimeout(()=> {
      // select that student
      const sel = $('student-area').querySelector('select');
      if(sel){ sel.value = id; sel.onchange(); showStudentDetails(id); }
    }, 100);
  });
}

// Report export (simple JSON as a file)
function downloadReport(student){
  const payload = {
    reportGeneratedAt: new Date().toISOString(),
    student: {
      id: student.id, name: student.name, email: student.email,
      college: student.college, degree: student.degree, gradYear: student.gradYear
    },
    skills: student.skills,
    certifications: student.certs,
    pipeline: student.pipeline,
    overall: student.overall,
    score: student.score
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${student.name.replace(/\s+/g,'_')}_verified_report.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function downloadReportById(id){ const s = state.students.find(x=>x.id===id); if(s) downloadReport(s); }

// Simple utilities
function toLabel(r){
  if(r==='softskills') return 'Soft Skills Assessment';
  if(r==='background') return 'Background Check';
  if(r==='aptitude') return 'Aptitude Test';
  return r.charAt(0).toUpperCase() + r.slice(1);
}
function pipelineSummary(s){
  return Object.entries(s.pipeline).map(([k,v])=> `${toLabel(k)}:${v?v.status:'pending'}`).join(' | ');
}

// Initial render
renderStudentArea();
renderCompanyTable();
renderAdmin();
