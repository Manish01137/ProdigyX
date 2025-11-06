// student_dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    // Demo student data
    const student = {
      firstName: 'Ananya',
      fullName: 'Ananya Mehta',
      college: 'VIT Pune',
      course: 'B.Tech — Computer Science',
      readiness: 78,
      badges: [
        { level: 'Gold', label: 'Algorithms' },
        { level: 'Silver', label: 'Aptitude' }
      ],
      upcoming: [
        { id: 1, title: 'Aptitude Round', date: '2025-11-12 10:00', duration: '45m' },
        { id: 2, title: 'Coding — Data Structures', date: '2025-11-18 14:00', duration: '90m' }
      ],
      activities: [
        { text: 'Completed: Aptitude Test', date: '2025-10-30', note: 'Score: 82%' },
        { text: 'Resume updated', date: '2025-10-27', note: '' }
      ]
    };
  
    const companies = [
      { id:1, name:"ByteWave Labs", skills:["javascript","react","node"], minScore:60, logo:"../images/company.jpg", desc:"Front-end & Fullstack roles" },
      { id:2, name:"DataForge", skills:["python","ml","sql"], minScore:75, logo:"../images/company.jpg", desc:"Data Science roles" },
      { id:3, name:"CoreTech Solutions", skills:["c++","algorithms"], minScore:70, logo:"../images/company.jpg", desc:"Systems & Algorithms" },
      { id:4, name:"Finlytics", skills:["sql","python"], minScore:65, logo:"../images/company.jpg", desc:"Fintech data roles" }
    ];
  
    // Basic DOM refs
    document.getElementById('studentFirst').textContent = student.firstName;
    document.getElementById('profileName').textContent = student.fullName;
    document.getElementById('scoreValue').textContent = student.readiness;
    // compute ring offset: circumference = 2πr; r=44 => c ≈ 276.46
    const ring = document.querySelector('.ring-fg');
    const circumference = 2 * Math.PI * 44;
    const offset = circumference * (1 - student.readiness / 100);
    if (ring) ring.style.strokeDashoffset = offset.toFixed(2);
  
    // upcoming tests
    const upcomingList = document.getElementById('upcomingList');
    student.upcoming.forEach(u => {
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${u.title}</strong><div class="muted">${u.date}</div></div><div><small class="muted">${u.duration}</small></div>`;
      upcomingList.appendChild(li);
    });
  
    // Activities
    const activityList = document.getElementById('activityList');
    student.activities.forEach(a=>{
      const li = document.createElement('li');
      li.className = 'activity-item';
      li.innerHTML = `<div>${a.text}<div class="muted">${a.note}</div></div><div class="muted">${a.date}</div>`;
      activityList.appendChild(li);
    });
  
    // badges
    const badgesWrap = document.getElementById('badgesWrap');
    student.badges.forEach(b=>{
      const el = document.createElement('div'); el.className = 'badge-item';
      el.innerHTML = `<div class="badge-icon">${b.level[0]}</div><div><strong>${b.label}</strong><div class="muted">${b.level} level</div></div><div style="margin-left:auto"><button class="btn" onclick="generateBadge('${student.fullName}','${b.level}')">Download</button></div>`;
      badgesWrap.appendChild(el);
    });
  
    // company list
    const compList = document.getElementById('companyList');
    function renderCompanies(list){
      compList.innerHTML = '';
      list.forEach(c=>{
        const div = document.createElement('div'); div.className = 'company-tile';
        div.innerHTML = `<div class="company-meta"><img class="company-logo" src="${c.logo}" alt="${c.name}"><div><strong>${c.name}</strong><div class="muted">${c.desc}</div><div class="muted">Skills: ${c.skills.join(', ')}</div></div></div><div><div class="muted">Min ${c.minScore}%</div><div style="margin-top:8px"><button class="btn btn-primary" onclick="applyCompany(${c.id})">Apply</button></div></div>`;
        compList.appendChild(div);
      });
    }
    renderCompanies(companies);
  
    // company filter
    document.getElementById('companyFilter').addEventListener('input', (e)=>{
      const q = e.target.value.trim().toLowerCase();
      const filtered = companies.filter(c=> c.name.toLowerCase().includes(q) || c.skills.join(' ').toLowerCase().includes(q) );
      renderCompanies(filtered);
    });
  
    // nav switching (sidebar)
    const navItems = document.querySelectorAll('.sd-nav-item');
    const subviews = document.querySelectorAll('.subview');
    navItems.forEach(n=>{
      n.addEventListener('click', (ev)=>{
        ev.preventDefault();
        navItems.forEach(x=>x.classList.remove('active'));
        n.classList.add('active');
        const target = n.dataset.target;
        // close top-level main view if dashboard
        if (!target || target === 'dashboard') {
          subviews.forEach(s=>s.classList.remove('active'));
          return;
        }
        subviews.forEach(s=>{
          s.classList.toggle('active', s.id === `${target}View`);
        });
        // scroll to subviews
        document.getElementById('sdSubviews').scrollIntoView({behavior:'smooth'});
      });
    });
  
    // toggle sidebar collapse
    const sidebar = document.getElementById('sdSidebar');
    document.getElementById('sdCollapse').addEventListener('click', ()=>{
      sidebar.classList.toggle('collapsed');
      const expanded = sidebar.classList.contains('collapsed') ? false : true;
      document.getElementById('sdCollapse').setAttribute('aria-expanded', expanded);
    });
  
    // Take next test simulation
    document.getElementById('takeNext').addEventListener('click', ()=>{
      if (student.upcoming.length === 0) return alert('No upcoming assessments.');
      const next = student.upcoming.shift();
      // push activity
      student.activities.unshift({ text: `Started: ${next.title}`, date: new Date().toLocaleDateString(), note: '' });
      alert(`(Demo) Starting "${next.title}". In production this would launch the assessment engine.`);
      // re-render lists
      upcomingList.removeChild(upcomingList.firstElementChild);
      activityList.innerHTML = '';
      student.activities.forEach(a=>{
        const li = document.createElement('li'); li.className='activity-item';
        li.innerHTML = `<div>${a.text}<div class="muted">${a.note}</div></div><div class="muted">${a.date}</div>`;
        activityList.appendChild(li);
      });
    });
  
    // export transcript CSV
    document.getElementById('exportTrans').addEventListener('click', ()=>{
      const rows = [['Activity','Note','Date'], ...student.activities.map(a=>[a.text,a.note,a.date])];
      const csv = rows.map(r=>r.map(c=>`"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `transcript_${student.fullName.replace(/\s+/g,'_')}.csv`; a.click();
      URL.revokeObjectURL(url);
    });
  
    // profile edit - fill form
    document.getElementById('profileFull').value = student.fullName;
    document.getElementById('profileCollege').value = student.college;
    document.getElementById('profileCourse').value = student.course;
  
    document.getElementById('saveProfile').addEventListener('click', ()=>{
      const name = document.getElementById('profileFull').value.trim();
      student.fullName = name || student.fullName;
      document.getElementById('profileName').textContent = student.fullName;
      alert('(Demo) Profile saved locally.');
    });
  
    // settings save
    document.getElementById('saveSettings').addEventListener('click', ()=>{
      alert('(Demo) Settings saved.');
    });
  
    // Logout
    document.getElementById('sdLogout').addEventListener('click', (e)=>{
      e.preventDefault();
      alert('Logged out (demo). In production, clear session and redirect to login.');
    });
  
    // Download resume (demo)
    document.getElementById('downloadResume').addEventListener('click', ()=>{
      const resumeTxt = `Resume\nName: ${student.fullName}\nCollege: ${student.college}\nCourse: ${student.course}\nReadiness: ${student.readiness}%`;
      const blob = new Blob([resumeTxt], {type:'text/plain'}); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${student.fullName.replace(/\s+/g,'_')}_resume.txt`; a.click();
      URL.revokeObjectURL(url);
    });
  
    // Apply to company (demo)
    window.applyCompany = function(id){
      const c = companies.find(x=>x.id===id);
      alert(`Applied to ${c.name} (demo). In production this creates an application and notifies the company.`);
    };
  
    // Generate & download badge & certificate helpers (use canvas)
    window.generateBadge = function(name, level) {
      const canvas = document.createElement('canvas'); const size = 640; canvas.width=size; canvas.height=size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,size,size);
      ctx.beginPath(); ctx.arc(size/2, size/2 - 40, 180, 0, Math.PI*2); ctx.fillStyle = 'rgba(6,40,61,0.06)'; ctx.fill();
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#06283D';
      ctx.fillRect(140, size/2 + 70, 360, 36);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 36px Poppins, system-ui'; ctx.textAlign='center'; ctx.fillText(level, size/2, size/2 + 98);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dark') || '#06283D';
      ctx.font = '700 34px Poppins, system-ui'; ctx.fillText(name || 'Student Name', size/2, size/2 - 190);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = `badge_${name.replace(/\s+/g,'_')}_${level}.png`; a.click();
    };
  
    window.generateCertificate = function(name, level) {
      const w = 1200, h = 840; const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
      const ctx = canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#06283D'; ctx.lineWidth=8; ctx.strokeRect(28,28,w-56,h-56);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#06283D'; ctx.font='800 40px Poppins, system-ui'; ctx.textAlign='center';
      ctx.fillText('Certificate of Skill Verification', w/2, 160);
      ctx.fillStyle='#000'; ctx.font='700 36px Poppins, system-ui'; ctx.fillText(name || 'Student Name', w/2, 300);
      ctx.font='18px Poppins, system-ui'; ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#5f6b75';
      ctx.fillText(`has demonstrated the "${level}" level of competency on the ProdigyX assessment`, w/2, 360);
      const url = canvas.toDataURL('image/png'); const a = document.createElement('a'); a.href=url; a.download = `certificate_${name.replace(/\s+/g,'_')}_${level}.png`; a.click();
    };
  
    // hook profile quick button
    document.getElementById('sdProfileBtn').addEventListener('click', ()=> {
      document.querySelector('[data-target=profile]').click();
    });
  
    // set year in footer
    document.getElementById('sdYear').textContent = new Date().getFullYear();
  
    // initial render certification list (simple)
    const certWrap = document.getElementById('certWrap');
    certWrap.innerHTML = `<p class="muted">No certificates yet. Complete assessments to receive certificates.</p>`;
  
    // Fill assessments table
    const assessTable = document.querySelector('#assessTable tbody');
    const assessments = [
      { title:'Aptitude Round', date:'2025-10-30', duration:'45m', score:82 },
      { title:'DSA — Coding Test', date:'2025-10-15', duration:'90m', score:78 }
    ];
    assessments.forEach(a=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${a.title}</td><td>${a.date}</td><td>${a.duration}</td><td>${a.score}%</td><td><button class="btn" onclick="alert('View result (demo)')">View</button></td>`;
      assessTable.appendChild(tr);
    });
  
  });
  