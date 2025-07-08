import { app, auth } from "../Java/firebase-config.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore(app);

document.body.style.display = "none"; // Hide content by default

let isSigningOut = false; // Flag to suppress alert on sign out

// Admin-only access check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (!isSigningOut) {
      alert("Access Denied");
    }
    window.location.href = "../index.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    alert("Access Denied");
    window.location.href = "../index.html";
    return;
  }
  // If admin, show content and run main admin logic
  document.body.style.display = "block";
  initAdminDashboard();
});

// Hamburger menu logic for sidebar (mobile)
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarToggle && adminSidebar && sidebarOverlay) {
        sidebarToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('active');
        });
        sidebarOverlay.addEventListener('click', () => {
            adminSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }
});

function initAdminDashboard() {
  // Tab elements
  const dashboardTab = document.getElementById("dashboardTab");
  const manageUsersTab = document.getElementById("manageUsersTab");
  const viewReportsTab = document.getElementById("viewReportsTab");
  const dashboardSection = document.getElementById("dashboard-section");
  const manageUsersSection = document.getElementById("manage-users-section");
  const viewReportsSection = document.getElementById("view-reports-section");

  // Helper to show only the selected section
  function showSection(section) {
    dashboardSection.style.display = "none";
    manageUsersSection.style.display = "none";
    viewReportsSection.style.display = "none";
    section.style.display = "block";
  }

  // Helper to highlight only the selected tab
  function setActiveTab(tab) {
    [dashboardTab, manageUsersTab, viewReportsTab].forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
  }

  // Dashboard tab
  dashboardTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(dashboardSection);
    setActiveTab(dashboardTab);
  });

  // Manage Users tab
  manageUsersTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(manageUsersSection);
    setActiveTab(manageUsersTab);
    fetchAndRenderAllUsers();
  });

  // View Reports tab
  viewReportsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(viewReportsSection);
    setActiveTab(viewReportsTab);
  });

  // Show dashboard by default
  showSection(dashboardSection);
  setActiveTab(dashboardTab);

  // Listen for real-time updates for pending users
  onSnapshot(collection(db, "users"), renderPendingUsers);

  // Signout Logic
  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      isSigningOut = true;
      await signOut(auth);
      window.location.href = "../index.html";
    });
  }
}

// Fetch and render all users for management
async function fetchAndRenderAllUsers() {
  const usersCol = collection(db, "users");
  const usersSnapshot = await onSnapshot(usersCol, (snapshot) => {
    renderAllUsers(snapshot);
  });
}

function renderAllUsers(usersSnapshot) {
  const tbody = document.getElementById("all-users-table").querySelector("tbody");
  tbody.innerHTML = "";
  usersSnapshot.forEach((userDoc) => {
    const user = userDoc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.email}</td>
      <td>${user.role || "-"}</td>
      <td>${user.otherAttributes ? JSON.stringify(user.otherAttributes) : "-"}</td>
      <td>
        <div class="user-actions">
          <button class="dots-btn" aria-label="User actions" onclick="toggleDropdown(event, '${userDoc.id}')">&#8942;</button>
          <div class="dropdown" id="dropdown-${userDoc.id}">
            <button onclick="changeUserRole('${userDoc.id}', 'admin')">Make Admin</button>
            <button onclick="changeUserRole('${userDoc.id}', 'user')">Make User</button>
            <button onclick="changeUserRole('${userDoc.id}', 'pending')">Set Pending</button>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Dropdown logic for user actions
window.toggleDropdown = function(event, userId) {
  event.stopPropagation();
  // Close any open dropdowns first
  document.querySelectorAll('.user-actions .dropdown').forEach(drop => drop.classList.remove('show'));
  const dropdown = document.getElementById(`dropdown-${userId}`);
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
};

document.addEventListener('click', function() {
  document.querySelectorAll('.user-actions .dropdown').forEach(drop => drop.classList.remove('show'));
});

// Change user role
window.changeUserRole = async function(userId, newRole) {
  await updateDoc(doc(db, "users", userId), { role: newRole });
};

function renderPendingUsers(usersSnapshot) {
  const tbody = document.getElementById("pending-users-table").querySelector("tbody");
  tbody.innerHTML = ""; // Clear previous

  usersSnapshot.forEach((userDoc) => {
    const user = userDoc.data();
    if (user.role === "pending") {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.email}</td>
        <td>${user.createdAt || ""}</td>
        <td>
          <button class="approvalBtn" onclick="approveUser('${userDoc.id}')">Approve</button>
          <button class="rejectBtn" onclick="rejectUser('${userDoc.id}')">Reject</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });
}