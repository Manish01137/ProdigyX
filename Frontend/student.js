// simple interactions: show forms, back, toggle password, basic UX validation
document.addEventListener('DOMContentLoaded', function () {
    const openStudent = document.getElementById('openStudent');
    const openAdmin = document.getElementById('openAdmin');
    const chooser = document.getElementById('chooser');
    const studentForm = document.getElementById('studentForm');
    const adminForm = document.getElementById('adminForm');
    const backButtons = document.querySelectorAll('[data-back]');
    const pwButtons = document.querySelectorAll('.pw');
    const yearEl = document.getElementById('year');
  
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
    function show(panel) {
      chooser.style.display = 'none';
      studentForm.classList.add('hidden');
      adminForm.classList.add('hidden');
      panel.classList.remove('hidden');
      const first = panel.querySelector('input');
      if (first) first.focus();
    }
  
    function back() {
      studentForm.classList.add('hidden');
      adminForm.classList.add('hidden');
      chooser.style.display = '';
      openStudent.focus();
    }
  
    openStudent.addEventListener('click', () => show(studentForm));
    openAdmin.addEventListener('click', () => show(adminForm));
    backButtons.forEach(b => b.addEventListener('click', back));
  
    // password toggles
    pwButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tgt = btn.getAttribute('data-target');
        const input = document.getElementById(tgt);
        if (!input) return;
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btn.textContent = isPwd ? 'Hide' : 'Show';
        btn.setAttribute('aria-pressed', isPwd ? 'true' : 'false');
      });
    });
  
    // basic UX validation
    [studentForm, adminForm].forEach(form => {
      form.addEventListener('submit', function (e) {
        const req = form.querySelectorAll('[required]');
        for (let el of req) {
          if (!el.value.trim()) {
            e.preventDefault();
            el.focus();
            alert('Please fill required fields.');
            return false;
          }
          if (el.minLength && el.value.length < el.minLength) {
            e.preventDefault();
            el.focus();
            alert(`Must be at least ${el.minLength} characters.`);
            return false;
          }
        }
        return true; // allow submit (server must validate)
      });
    });
  
    // keyboard: Enter/Space on chooser buttons
    [openStudent, openAdmin].forEach(b => {
      b.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); }
      });
    });
  });
  