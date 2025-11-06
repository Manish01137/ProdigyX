// admin_portal.js
document.addEventListener("DOMContentLoaded", () => {
    const students = [
      { name: "Rohit Singh", roll: "CS2025-014", course: "B.Tech — CSE", batch: "2025", readiness: 82, status: "Eligible" },
      { name: "Sara Fernandes", roll: "EC2025-022", course: "B.Tech — ECE", batch: "2025", readiness: 74, status: "Pending" },
      { name: "Ankit Verma", roll: "IT2024-010", course: "B.Tech — IT", batch: "2024", readiness: 68, status: "Eligible" }
    ];
  
    const drives = [
      { title: "ByteWave — Frontend Hiring", date: "2025-11-20", slots: 40 },
      { title: "DataForge — Data Science Internship", date: "2025-12-10", slots: 25 }
    ];
  
    const tbody = document.querySelector("#studentTable tbody");
    const search = document.getElementById("studentSearch");
    const batchFilter = document.getElementById("batchFilter");
    const exportBtn = document.getElementById("exportStudents");
    const driveList = document.getElementById("driveList");
    const scheduleForm = document.getElementById("scheduleForm");
    const scheduleBtn = document.getElementById("scheduleTest");
    const logoutBtn = document.getElementById("apLogout");
  
    // Render student table
    function renderTable(list) {
      tbody.innerHTML = "";
      list.forEach((s) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${s.name}</td>
          <td>${s.roll}</td>
          <td>${s.course}</td>
          <td>${s.batch}</td>
          <td>${s.readiness}%</td>
          <td>${s.status}</td>
          <td><button class="btn">View</button> <button class="btn btn-outline">Edit</button></td>`;
        tbody.appendChild(tr);
      });
    }
    renderTable(students);
  
    // Search and filter
    function filterStudents() {
      const q = search.value.toLowerCase();
      const batch = batchFilter.value;
      const filtered = students.filter(
        (s) =>
          (s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q) || s.course.toLowerCase().includes(q)) &&
          (!batch || s.batch === batch)
      );
      renderTable(filtered);
    }
  
    search.addEventListener("input", filterStudents);
    batchFilter.addEventListener("change", filterStudents);
  
    // Export to CSV
    exportBtn.addEventListener("click", () => {
      const rows = [["Name", "Roll No", "Course", "Batch", "Readiness", "Status"]];
      document.querySelectorAll("#studentTable tbody tr").forEach((row) => {
        const cols = Array.from(row.querySelectorAll("td")).map((td) => td.textContent);
        rows.push(cols);
      });
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "students_export.csv";
      a.click();
    });
  
    // Render drives
    function renderDrives() {
      driveList.innerHTML = "";
      drives.forEach((d) => {
        const div = document.createElement("div");
        div.className = "drive-item";
        div.innerHTML = `
          <div>
            <strong>${d.title}</strong><br>
            <span class="muted">Date: ${d.date} • Slots: ${d.slots}</span>
          </div>
          <div>
            <button class="btn btn-primary">View</button>
            <button class="btn">Invite</button>
          </div>`;
        driveList.appendChild(div);
      });
    }
    renderDrives();
  
    // Create new drive
    document.getElementById("createDrive").addEventListener("click", () => {
      const title = prompt("Enter drive title:");
      if (title) {
        drives.push({ title, date: new Date().toISOString().split("T")[0], slots: 20 });
        renderDrives();
        alert("New drive created (demo).");
      }
    });
  
    // Schedule test
    scheduleBtn.addEventListener("click", () => {
      const title = document.getElementById("testTitle").value;
      const batch = document.getElementById("testBatch").value;
      const date = document.getElementById("testDate").value;
      const duration = document.getElementById("testDuration").value;
      if (!title || !date) return alert("Please fill all fields");
      alert(`(Demo) Test "${title}" scheduled for ${batch} on ${new Date(date).toLocaleString()} (${duration} mins).`);
      scheduleForm.reset();
    });
  
    // Logout
    logoutBtn.addEventListener("click", () => {
      alert("Logged out (demo). In production, clear session and redirect.");
      window.location.href = "../index.html";
    });
  
    // Footer year
    document.getElementById("year").textContent = new Date().getFullYear();
  });
  