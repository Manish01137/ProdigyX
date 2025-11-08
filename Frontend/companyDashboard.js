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
/* ---------- FETCH LIVE DASHBOARD DATA FROM BACKEND ---------- */
async function fetchDashboardData() {
  try {
    const res = await fetch("http://localhost:5000/api/dashboard");
    const data = await res.json();
    console.log("✅ Live dashboard data loaded:", data);
    return data;
  } catch (err) {
    console.error("❌ Error fetching live data, using MOCK instead:", err);
    return MOCK; // fallback to mock data
  }
}

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

//* ---------------- FINAL DASHBOARD INIT ---------------- */
console.log("🚀 Dashboard initialized successfully");

/* ✅ Initialize only the backend-connected dashboard */
document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardWithBackend();

  // confirm Post Job button exists
  const postJobButton = document.getElementById("post-job-btn");
  if (!postJobButton) {
    console.error("❌ post-job-btn not found in DOM!");
    return;
  }

  console.log("✅ Backend Dashboard Ready — Buttons attached properly");
});


/* ---------- AUTO-LOAD LIVE BACKEND DATA INTO FRONTEND ---------- */
async function initDashboardWithBackend() {
  initTheme();

  const cname = getCompanyName();
  const elem = document.getElementById('company-name');
  elem.textContent = cname;
  elem.title = cname;

  // 🔥 Fetch from backend instead of MOCK
  const data = await fetchDashboardData();

  populateCounts(data.counts);
  renderWeek(data.events, weekRef);
  renderUpcoming(data.events);
  renderActivity(data.activity);

  // ✅ SHORTLIST CANDIDATE
document.getElementById('quick-shortlist').addEventListener('click', async () => {
  try {
    const res = await fetch("http://localhost:5000/api/dashboard/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: "690ee19e7994cd079cdee05f" }) // demo student
    });

    const data = await res.json();
    toast(data.message || "✅ Candidate shortlisted");

    await loadDashboard(); // 🔁 Refresh dashboard numbers
  } catch (err) {
    toast("❌ Error shortlisting candidate");
  }
});


// ✅ INVITE TO INTERVIEW
// ✅ Modern Invite Modal with Date Picker & Dropdowns
document.getElementById("quick-invite").addEventListener("click", async () => {
  try {
    // Fetch students and jobs dynamically
    const [studentsRes, jobsRes] = await Promise.all([
      fetch("http://localhost:5000/api/dashboard/students"),
      fetch("http://localhost:5000/api/dashboard/jobs"),
    ]);
    const students = await studentsRes.json();
    const jobs = await jobsRes.json();

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";

    // Create modal box
    const modal = document.createElement("div");
    modal.style.background = "white";
    modal.style.padding = "24px";
    modal.style.borderRadius = "16px";
    modal.style.width = "400px";
    modal.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";
    modal.innerHTML = `
      <h2 style="margin-bottom:16px;text-align:center;">Schedule Interview</h2>
      <label>Student:</label>
      <select id="studentSelect" style="width:100%;margin-bottom:10px;padding:6px;">
        ${students.map(s => `<option value="${s._id}">${s.name} (${s._id})</option>`).join("")}
      </select>
      <label>Job:</label>
      <select id="jobSelect" style="width:100%;margin-bottom:10px;padding:6px;">
        ${jobs.map(j => `<option value="${j._id}">${j.title} (${j._id})</option>`).join("")}
      </select>
      <label>Date & Time:</label>
      <input type="datetime-local" id="interviewDate" style="width:100%;margin-bottom:16px;padding:6px;">
      <div style="text-align:center;">
        <button id="scheduleBtn" style="background:#0066ff;color:white;padding:8px 16px;border:none;border-radius:8px;cursor:pointer;">Schedule</button>
        <button id="cancelBtn" style="background:#ccc;color:black;padding:8px 16px;border:none;border-radius:8px;margin-left:8px;cursor:pointer;">Cancel</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Cancel button closes modal
    document.getElementById("cancelBtn").addEventListener("click", () => overlay.remove());

    // Schedule button
    document.getElementById("scheduleBtn").addEventListener("click", async () => {
      const studentId = document.getElementById("studentSelect").value;
      const jobId = document.getElementById("jobSelect").value;
      const time = document.getElementById("interviewDate").value;

      if (!studentId || !jobId || !time) {
        toast("⚠️ Please fill all fields");
        return;
      }

     const res = await fetch("http://localhost:5000/api/dashboard/invite", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ studentId, jobId, time }),
});

const data = await res.json();
toast(data.message || "✅ Interview scheduled");
overlay.remove();
incrementCard("positions-listed");
await loadDashboard(); // 🔁 update calendar & interviews list

    });
  } catch (err) {
    console.error("❌ Error opening schedule modal:", err);
    toast("❌ Could not load data for scheduling");
  }
});

// ✅ EXPORT DASHBOARD DATA
document.getElementById('quick-export').addEventListener('click', () => {
  window.open("http://localhost:5000/api/dashboard/export", "_blank");
  toast("📂 Exporting CSV...");
});

function incrementCard(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const val = parseInt(el.textContent) || 0;
  el.textContent = val + 1;
  pulseCounts();
}


// ✅ POST JOB
// ✅ Modern "Post Job" modal form
document.getElementById("post-job-btn").addEventListener("click", () => {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";

  // Modal
  const modal = document.createElement("div");
  modal.style.background = "white";
  modal.style.padding = "24px";
  modal.style.borderRadius = "16px";
  modal.style.width = "400px";
  modal.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";
  modal.innerHTML = `
    <h2 style="margin-bottom:16px;text-align:center;">Post New Job</h2>
    <label>Job Title:</label>
    <input id="jobTitle" style="width:100%;margin-bottom:10px;padding:6px;border:1px solid #ddd;border-radius:6px;">
    <label>Description:</label>
    <textarea id="jobDesc" rows="3" style="width:100%;margin-bottom:10px;padding:6px;border:1px solid #ddd;border-radius:6px;"></textarea>
    <label>Location:</label>
    <input id="jobLoc" style="width:100%;margin-bottom:10px;padding:6px;border:1px solid #ddd;border-radius:6px;">
    <label>Status:</label>
    <select id="jobStatus" style="width:100%;margin-bottom:16px;padding:6px;border:1px solid #ddd;border-radius:6px;">
      <option value="Active">Active</option>
      <option value="Closed">Closed</option>
    </select>
    <div style="text-align:center;">
      <button id="postBtn" style="background:#0066ff;color:white;padding:8px 16px;border:none;border-radius:8px;cursor:pointer;">Post</button>
      <button id="cancelJob" style="background:#ccc;color:black;padding:8px 16px;border:none;border-radius:8px;margin-left:8px;cursor:pointer;">Cancel</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Cancel
  document.getElementById("cancelJob").addEventListener("click", () => overlay.remove());

  // Post
  document.getElementById("postBtn").addEventListener("click", async () => {
    const title = document.getElementById("jobTitle").value.trim();
    const description = document.getElementById("jobDesc").value.trim();
    const location = document.getElementById("jobLoc").value.trim();
    const status = document.getElementById("jobStatus").value;

    if (!title || !description || !location) {
      toast("⚠️ Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/dashboard/postjob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          status,
          company: "Acme Tech Solutions"
        })
      });

      const data = await res.json();
toast(data.message || "✅ Job posted successfully");
overlay.remove();
await loadDashboard(); // 🔁 Refresh data
    } catch (err) {
      toast("❌ Failed to post job");
    }
  });
});


/* ✅ Call new version instead of old one */
// document.addEventListener('DOMContentLoaded', initDashboard);
document.addEventListener('DOMContentLoaded', initDashboardWithBackend);



//* ---------- UNIVERSAL DASHBOARD REFRESH ---------- */
async function loadDashboard() {
  try {
    const res = await fetch("http://localhost:5000/api/dashboard");
    const data = await res.json();

    if (!data.counts) {
      console.error("⚠️ Invalid backend data:", data);
      return;
    }

    console.log("🔁 Dashboard refreshed:", data.counts);

    // Update the numbers
    document.getElementById("your-hirings").textContent = data.counts.yourHirings;
    document.getElementById("new-verified").textContent = data.counts.newVerifiedCandidates;
    document.getElementById("positions-listed").textContent = data.counts.positionsListed;
    document.getElementById("shortlisted-count").textContent = data.counts.shortlistedCandidates;

    // Redraw visuals
    drawSparkline(document.getElementById("spark-hirings"), [2,3,4,6,7,5,8]);
    renderWeek(data.events || [], new Date());
    renderUpcoming(data.events || []);
    renderActivity(data.activity || []);

    pulseCounts(); // animate number updates
  } catch (err) {
    console.error("❌ Error refreshing dashboard:", err);
  }
}

/* Small visual pop when numbers update */
function pulseCounts() {
  ["your-hirings", "new-verified", "positions-listed", "shortlisted-count"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transition = "transform 0.25s ease, color 0.25s ease";
    el.style.transform = "scale(1.25)";
    el.style.color = "var(--accent)";
    setTimeout(() => {
      el.style.transform = "scale(1)";
      el.style.color = "";
    }, 300);
  });
}

}