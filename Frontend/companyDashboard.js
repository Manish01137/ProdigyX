/* dashboard.js
   Plain JS that:
   - loads mock data
   - populates cards, sparklines, calendar
   - implements theme toggle + persistence (localStorage)
   - small keyboard navigation for sidebar menu
   - modal for interview details
*/

/* ---------- MOCK DATA (replace with your API calls) ---------- */
const MOCK = {
  company: { id: 'comp_123', name: 'Acme Tech Solutions Pvt Ltd' },
  counts: {
    yourHirings: 24,
    newVerifiedCandidates: 12,
    positionsListed: 8,
    shortlistedCandidates: 5,
    changes: { hirings: 8 } // percent
  },
  // events across this week (ISO strings)
  events: [
    {
      id: 'evt_1',
      title: 'Interview: Frontend Engineer — John Doe',
      candidateName: 'John Doe',
      position: 'Frontend Engineer',
      start: offsetISO(0, 10, 0), // today 10:00
      end: offsetISO(0, 10, 30),
      meetingLink: 'https://meet.example/abc123',
      status: 'scheduled'
    },
    {
      id: 'evt_2',
      title: 'Interview: Backend Engineer — Priya Patel',
      candidateName: 'Priya Patel',
      position: 'Backend Engineer',
      start: offsetISO(2, 14, 0), // +2 days 14:00
      end: offsetISO(2, 14, 30),
      meetingLink: 'https://meet.example/def456',
      status: 'scheduled'
    },
    {
      id: 'evt_3',
      title: 'Interview: Data Analyst — Ramesh Kumar',
      candidateName: 'Ramesh Kumar',
      position: 'Data Analyst',
      start: offsetISO(4, 11, 0),
      end: offsetISO(4, 11, 30),
      meetingLink: 'https://meet.example/ghi789',
      status: 'scheduled'
    }
  ],
  activity: [
    'Priya Patel verified (2h ago)',
    'New application: John Doe (Frontend)',
    'Position posted: Backend Engineer',
    'Ramesh moved to shortlisted'
  ]
};

/* utility to create ISO for day offset and hour:minute */
function offsetISO(dayOffset = 0, hour = 10, minute = 0) {
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/* ---------- THEME HANDLING ---------- */
const root = document.documentElement;
const THEME_KEY = 'prodigyx_theme';
function applyTheme(theme){
  if(theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  const btn = document.getElementById('theme-toggle');
  if(btn) btn.setAttribute('aria-pressed', theme === 'dark');
}
const initTheme = () => {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
};
function toggleTheme(){
  const isDark = root.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

/* ---------- COMPANY NAME (from query or localStorage) ---------- */
function getCompanyName(){
  const url = new URL(location.href);
  const q = url.searchParams.get('company');
  if(q) {
    localStorage.setItem('companyName', q);
    return q;
  }
  return localStorage.getItem('companyName') || MOCK.company.name;
}

/* ---------- SPARKLINE (simple) ---------- */
function drawSparkline(container, points = [3,5,4,6,7,6,8]){
  container.innerHTML = '';
  const w = 80, h = 36, padding = 4;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const step = (w - padding*2) / (points.length - 1);
  const coords = points.map((p,i)=>{
    const x = padding + i*step;
    const y = padding + ((max - p) / (max - min || 1)) * (h - padding*2);
    return `${x},${y}`;
  });
  const poly = document.createElementNS(svgNS, 'polyline');
  poly.setAttribute('points', coords.join(' '));
  poly.setAttribute('fill','none');
  poly.setAttribute('stroke','var(--accent)');
  poly.setAttribute('stroke-width','2');
  poly.setAttribute('stroke-linecap','round');
  poly.setAttribute('stroke-linejoin','round');
  svg.appendChild(poly);
  container.appendChild(svg);
}

/* ---------- POPULATE CARDS ---------- */
function populateCounts(data){
  document.getElementById('your-hirings').textContent = data.yourHirings;
  document.getElementById('new-verified').textContent = data.newVerifiedCandidates;
  document.getElementById('positions-listed').textContent = data.positionsListed;
  document.getElementById('shortlisted-count').textContent = data.shortlistedCandidates;
  const change = data.changes.hirings;
  const ch = document.getElementById('hirings-change');
  ch.textContent = (change >=0 ? '+' : '') + change + '%';
  ch.style.color = change >= 0 ? 'var(--accent-2)' : '#c0392b';
  // example sparklines
  drawSparkline(document.getElementById('spark-hirings'), [2,3,4,6,7,5,8]);
  drawSparkline(document.getElementById('spark-verified'), [1,2,2,3,4,3,4]);
  drawSparkline(document.getElementById('spark-positions'), [1,1,2,2,3,2,2]);
  drawSparkline(document.getElementById('spark-shortlisted'), [0,1,1,2,2,1,3]);
}

/* ---------- CALENDAR: week view ---------- */
function startOfWeek(date){
  const d = new Date(date);
  const day = d.getDay(); // 0 sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
}

function renderWeek(events, refDate = new Date()){
  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';
  const start = startOfWeek(refDate);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  days.forEach((d, idx) => {
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    dayEl.setAttribute('role','gridcell');
    dayEl.innerHTML = `<div class="label">${d.toLocaleDateString(undefined,{weekday:'short', day:'numeric'})}</div>`;
    // add events falling on this day
    const dayEvents = events.filter(ev => {
      const s = new Date(ev.start);
      return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth() && s.getDate() === d.getDate();
    });
    dayEvents.forEach(ev=>{
      const btn = document.createElement('button');
      btn.className = 'event';
      btn.setAttribute('data-evt', ev.id);
      const time = new Date(ev.start).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      btn.innerHTML = `<strong>${time}</strong><div style="font-size:.78rem;margin-top:4px">${ev.position}</div>`;
      btn.addEventListener('click', ()=> openModal(ev));
      dayEl.appendChild(btn);
    });
    grid.appendChild(dayEl);
  });
}

/* ---------- UPCOMING LIST & ACTIVITY ---------- */
function renderUpcoming(events){
  const list = document.getElementById('upcoming-list');
  list.innerHTML = '';
  const sorted = events.slice().sort((a,b) => new Date(a.start) - new Date(b.start));
  sorted.forEach(ev=>{
    const li = document.createElement('li');
    li.className = 'upcoming-item';
    const left = document.createElement('div');
    left.innerHTML = `<div style="font-weight:700">${ev.position}</div><div style="font-size:.85rem;color:var(--muted)">${ev.candidateName}</div>`;
    const right = document.createElement('div');
    right.innerHTML = `<div style="font-weight:700">${new Date(ev.start).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div><div style="font-size:.8rem;color:var(--muted)">${ev.status}</div>`;
    li.appendChild(left);
    li.appendChild(right);
    li.addEventListener('click', ()=> openModal(ev));
    list.appendChild(li);
  });
}

function renderActivity(feed){
  const cont = document.getElementById('activity-feed');
  cont.innerHTML = '';
  feed.forEach(s => {
    const p = document.createElement('div');
    p.textContent = s;
    p.style.padding = '8px';
    p.style.borderRadius = '8px';
    p.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.02), transparent)';
    cont.appendChild(p);
  });
}

/* ---------- MODAL ---------- */
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
function openModal(ev){
  modal.classList.remove('hidden');
  document.getElementById('modal-title').textContent = ev.title;
  modalBody.innerHTML = `
    <p><strong>Candidate:</strong> ${ev.candidateName}</p>
    <p><strong>Position:</strong> ${ev.position}</p>
    <p><strong>Time:</strong> ${new Date(ev.start).toLocaleString()}</p>
    <p><strong>Status:</strong> ${ev.status}</p>
  `;
  document.getElementById('modal-join').href = ev.meetingLink || '#';
  // simple ICS generator link:
  document.getElementById('modal-add-ics').onclick = () => {
    const ics = generateICS(ev);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ev.position.replace(/\s+/g,'_')}_${ev.id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
}

function closeModal(){
  modal.classList.add('hidden');
}

/* simple ICS generator */
function generateICS(ev){
  const start = new Date(ev.start).toISOString().replace(/[-:]|(\.\d{3}Z)/g,'');
  const end = new Date(ev.end).toISOString().replace(/[-:]|(\.\d{3}Z)/g,'');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ProdigyX//EN',
    'BEGIN:VEVENT',
    `UID:${ev.id}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|(\.\d{3}Z)/g,'')}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:Candidate ${ev.candidateName} - ${ev.position}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/* ---------- SIDEBAR TOGGLE + KEYBOARD NAV ---------- */
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

sidebarToggle.addEventListener('click', (e) => {
  const isOpen = sidebar.classList.toggle('open');
  sidebarToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.menu-item').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    document.querySelectorAll('.menu-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    // simple behavior: switch page title
    const k = btn.dataset.key;
    document.getElementById('page-title').textContent = k === 'talent' ? 'Talent Pool' : (k === 'interview' ? 'Interviews' : 'Post Job');
  });
  btn.addEventListener('keyup', (e)=>{
    if(e.key === 'Enter' || e.key === ' ') btn.click();
  });
});

/* modal close */
document.getElementById('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (ev) => { if(ev.target === modal) closeModal(); });

/* theme toggle */
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

/* prev/next week (re-render) */
let weekRef = new Date();
document.getElementById('prev-week').addEventListener('click', ()=> { weekRef.setDate(weekRef.getDate() - 7); renderWeek(MOCK.events, weekRef); });
document.getElementById('next-week').addEventListener('click', ()=> { weekRef.setDate(weekRef.getDate() + 7); renderWeek(MOCK.events, weekRef); });

/* footer year */
document.getElementById('year').textContent = new Date().getFullYear();

/* initial boot */
function initDashboard(){
  initTheme();

  // company name
  const cname = getCompanyName();
  const elem = document.getElementById('company-name');
  elem.textContent = cname;
  elem.title = cname;

  // populate counts (replace this with fetch('/api/company/.../dashboard'))
  populateCounts(MOCK.counts);

  // render week + upcoming + activity (replace with API calendar endpoint)
  renderWeek(MOCK.events, weekRef);
  renderUpcoming(MOCK.events);
  renderActivity(MOCK.activity);

  // small handlers for quick actions
  document.getElementById('quick-shortlist').addEventListener('click', ()=> toast('Shortlist action triggered'));
  document.getElementById('quick-invite').addEventListener('click', ()=> toast('Invite sent (demo)'));
  document.getElementById('quick-export').addEventListener('click', ()=> toast('CSV exported (demo)'));
  document.getElementById('post-job-btn').addEventListener('click', ()=> toast('Open post job modal (demo)'));
}

/* toast (simple) */
function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.right = '18px';
  t.style.bottom = '18px';
  t.style.background = 'var(--accent)';
  t.style.color = 'white';
  t.style.padding = '10px 14px';
  t.style.borderRadius = '10px';
  document.body.appendChild(t);
  setTimeout(()=> { t.style.transition='opacity .4s'; t.style.opacity = '0'; setTimeout(()=>t.remove(),400); }, 1800);
}

/* open modal when event click handled earlier */

/* init on DOM ready */
document.addEventListener('DOMContentLoaded', initDashboard);
