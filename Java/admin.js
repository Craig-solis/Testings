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

function initAdminDashboard() {
  // Listen for real-time updates
  onSnapshot(collection(db, "users"), renderPendingUsers);

  window.approveUser = async function(uid) {
    await updateDoc(doc(db, "users", uid), { role: "user" });
  };

  window.rejectUser = async function(uid) {
    await updateDoc(doc(db, "users", uid), { role: "rejected" });
  };

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