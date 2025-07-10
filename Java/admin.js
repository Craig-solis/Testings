// admin.js - Admin dashboard logic
import { app, auth } from "../Java/firebase-config.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore(app);

document.body.style.display = "none"; // Hide content by default

let isSigningOut = false; // Flag to suppress alert on sign out

// Admin-only access check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (!isSigningOut) alert("Access Denied");
    window.location.href = "../index.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    alert("Access Denied");
    window.location.href = "../index.html";
    return;
  }
  document.body.style.display = "block";
  initAdminDashboard();
});

// Sidebar hamburger menu (mobile)
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
  const adminSidebar = document.getElementById('adminSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  // Helper to close sidebar (hamburger menu)
  function closeSidebarMenu() {
    if (adminSidebar && sidebarOverlay && adminSidebar.classList.contains('open')) {
      adminSidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    }
  }

  // Show only the selected section
  function showSection(section) {
    dashboardSection.style.display = "none";
    manageUsersSection.style.display = "none";
    viewReportsSection.style.display = "none";
    section.style.display = "block";
  }

  // Highlight only the selected tab
  function setActiveTab(tab) {
    [dashboardTab, manageUsersTab, viewReportsTab].forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
  }

  dashboardTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(dashboardSection);
    setActiveTab(dashboardTab);
    closeSidebarMenu();
  });
  manageUsersTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(manageUsersSection);
    setActiveTab(manageUsersTab);
    fetchAndRenderAllUsers();
    closeSidebarMenu();
  });
  viewReportsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(viewReportsSection);
    setActiveTab(viewReportsTab);
    closeSidebarMenu();
  });

  // Show dashboard by default
  showSection(dashboardSection);
  setActiveTab(dashboardTab);

  // Listen for real-time updates for pending users
  onSnapshot(collection(db, "users"), renderPendingUsers);

  // Signout
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
function fetchAndRenderAllUsers() {
  const usersCol = collection(db, "users");
  onSnapshot(usersCol, renderAllUsers);
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
      <td>${user.createdDate ? user.createdDate : "-"}</td>
      <td>
        <div class="user-actions">
          <button class="dots-btn" aria-label="User actions" onclick="toggleDropdown(event, '${userDoc.id}')">&#8942;</button>
          <div class="dropdown" id="dropdown-${userDoc.id}">
            <button onclick="changeUserRole('${userDoc.id}', 'admin')">Make Admin</button>
            <button onclick="changeUserRole('${userDoc.id}', 'user')">Make User</button>
            <button onclick="changeUserRole('${userDoc.id}', 'pending')">Set Pending</button>
            <button onclick="deleteUserAndData('${userDoc.id}', '${user.email}')" style="color:#f44336;">Delete User</button>
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
  // Remove any existing floating dropdown
  const existing = document.getElementById('floating-dropdown');
  if (existing) existing.remove();

  // Get the dropdown element and button
  const dropdown = document.getElementById(`dropdown-${userId}`);
  const btn = event.currentTarget;
  if (dropdown && btn) {
    // Clone dropdown for floating
    const floatingDropdown = dropdown.cloneNode(true);
    floatingDropdown.id = 'floating-dropdown';
    floatingDropdown.classList.add('show');
    floatingDropdown.style.position = 'fixed';
    floatingDropdown.style.zIndex = '2147483647';
    // Position below the button
    const rect = btn.getBoundingClientRect();
    floatingDropdown.style.top = `${rect.bottom}px`;
    floatingDropdown.style.left = `${rect.right - floatingDropdown.offsetWidth}px`;
    document.body.appendChild(floatingDropdown);

    // Add click handlers for dropdown actions
    floatingDropdown.querySelectorAll('button').forEach((button, idx) => {
      const origButton = dropdown.querySelectorAll('button')[idx];
      if (origButton) button.onclick = origButton.onclick;
    });
  }
};

// Remove floating dropdown on click or scroll
['click', 'scroll'].forEach(evt => {
  document.addEventListener(evt, function() {
    const floating = document.getElementById('floating-dropdown');
    if (floating) floating.remove();
  }, evt === 'scroll');
});

// Change user role
window.changeUserRole = async function(userId, newRole) {
  await updateDoc(doc(db, "users", userId), { role: newRole });
};

// Render pending users table
function renderPendingUsers(usersSnapshot) {
  const tbody = document.getElementById("pending-users-table").querySelector("tbody");
  tbody.innerHTML = "";
  usersSnapshot.forEach((userDoc) => {
    const user = userDoc.data();
    if (user.role === "pending") {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.email}</td>
        <td>
          <button class="approvalBtn" onclick="approveUser('${userDoc.id}')">Approve</button>
          <button class="rejectBtn" onclick="rejectUser('${userDoc.id}')">Reject</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });
}

// Approve user
window.approveUser = async function(uid) {
  try {
    await updateDoc(doc(db, "users", uid), { role: "user" });
    alert('User approved.');
  } catch (err) {
    alert('Error approving user: ' + err.message);
  }
};

// Reject user
window.rejectUser = async function(uid) {
  try {
    await updateDoc(doc(db, "users", uid), { role: "rejected" });
    await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js').then(({ deleteDoc }) => deleteDoc(doc(db, "users", uid)));
    // Call backend to delete user from Firebase Auth
    await fetch('http://10.0.2.120:3000/deleteUserAuth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid })
    });
    alert('User rejected, deleted from Firestore, and removed from Firebase Auth.');
  } catch (err) {
    alert('Error rejecting/deleting user: ' + err.message);
  }
};

// Delete user from Firestore and Firebase Auth
window.deleteUserAndData = async function(userId, userEmail) {
  if (!confirm(`Are you sure you want to delete user ${userEmail}? This cannot be undone.`)) return;
  try {
    await updateDoc(doc(db, "users", userId), { deleted: true }); // Optional: mark as deleted first
    await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js').then(({ deleteDoc }) => deleteDoc(doc(db, "users", userId)));
    // Call backend to delete user from Firebase Auth
    await fetch('https://us-central1-frostbyte-test-6f9ae.cloudfunctions.net/deleteUserAuth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId })
    });
    alert('User deleted from Firestore and Firebase Auth.');
  } catch (err) {
    alert('Error deleting user: ' + err.message);
  }
};