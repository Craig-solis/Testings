// dashboard.js - User dashboard logic
import { auth } from "../Java/firebase-config.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore();

// Session Timeout for inactivity
let inactivityTimeout;
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
function autoSignOut() {
  alert("You have been signed out due to inactivity.");
  signOut(auth);
  window.location.href = "../index.html";
}
function resetInactivityTimer() {
  if (inactivityTimeout) clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(autoSignOut, INACTIVITY_LIMIT);
}
["mousemove", "keydown", "mousedown", "touchstart"].forEach((event) => {
  document.addEventListener(event, resetInactivityTimer, true);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    alert("User document does not exist.");
    await signOut(auth);
    window.location.href = "login.html";
    return;
  }
  const role = userDoc.data().role;
  if (role === "user" || role === "approved") {
    document.body.style.display = "block";
    const loader = document.getElementById("loader");
    const content = document.getElementById("content");
    const adminDash = document.getElementById("admin-dashboard");
    if (loader) loader.style.display = "none";
    if (content) content.style.display = "block";
    if (adminDash) adminDash.style.display = "none";
    setupNavbar();
    setupSignOut();
  } else if (role === "admin") {
    document.body.style.display = "block";
    const loader = document.getElementById("loader");
    const content = document.getElementById("content");
    const adminDash = document.getElementById("admin-dashboard");
    if (loader) loader.style.display = "none";
    if (content) content.style.display = "block";
    if (adminDash) adminDash.style.display = "block";
    setupNavbar();
    setupSignOut();
  } else {
    document.body.style.display = "none";
    alert("Your account is pending admin approval.");
    await signOut(auth);
    window.location.href = "login.html";
    return;
  }
  resetInactivityTimer(); // Start inactivity timer
});

function setupNavbar() {
  const navbarToggle = document.querySelector(".navbar-toggle");
  const navbarMenu = document.querySelector(".navbar-menu");
  const navbar = document.querySelector(".navbar");
  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navbarToggle.classList.toggle("active");
      navbarMenu.classList.toggle("active");
    });
    document.addEventListener("click", (e) => {
      if (
        navbarMenu.classList.contains("active") &&
        !navbar.contains(e.target)
      ) {
        navbarToggle.classList.remove("active");
        navbarMenu.classList.remove("active");
      }
    });
    const menuLinks = navbarMenu.querySelectorAll("a");
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (navbarMenu.classList.contains("active")) {
          navbarToggle.classList.remove("active");
          navbarMenu.classList.remove("active");
        }
      });
    });
  }
  window.addEventListener("scroll", function () {
    if (window.scrollY > 0) {
      navbar.classList.add("solid");
    } else {
      navbar.classList.remove("solid");
    }
  });
}

function setupSignOut() {
  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "../index.html";
    });
  }
}

window.addEventListener("DOMContentLoaded", function () {
  if (window.emailjs) {
    emailjs.init("AGk60--qzPOJcZW2G");
  }
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      emailjs.sendForm("service_qwcb55i", "template_mo0cr2f", this).then(
        function () {
          alert("Message sent successfully!");
          contactForm.reset();
        },
        function (error) {
          alert("Failed to send message: " + JSON.stringify(error));
        }
      );
    });
  }

  // Initialize Security Monitoring
  initializeSecurityMonitoring();
});

// Security Monitoring Functions
function initializeSecurityMonitoring() {
  const refreshBtn = document.getElementById("refresh-endpoints");
  const runScanBtn = document.getElementById("run-scan");
  const testConnectionBtn = document.getElementById("test-connection");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshEndpointData);
  }

  if (runScanBtn) {
    runScanBtn.addEventListener("click", runSecurityScan);
  }

  if (testConnectionBtn) {
    testConnectionBtn.addEventListener("click", testAgentConnection);
  }

  // Auto-refresh every 30 seconds
  setInterval(refreshEndpointData, 30000);

  // Initial load
  refreshEndpointData();
}

async function getAgentConfig() {
  const endpointUrl =
    document.getElementById("endpoint-url").value || "http://localhost:5000";
  const apiKey =
    document.getElementById("api-key").value || "your-secret-api-key";
  return { endpointUrl, apiKey };
}

async function makeAgentRequest(endpoint, method = "GET", body = null) {
  const { endpointUrl, apiKey } = await getAgentConfig();

  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${endpointUrl}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Agent request failed:", error);
    throw error;
  }
}

async function refreshEndpointData() {
  const endpointInfo = document.getElementById("endpoint-info");

  try {
    endpointInfo.innerHTML = "<p>Loading endpoint information...</p>";

    const systemInfo = await makeAgentRequest("/api/system-info");

    endpointInfo.innerHTML = `
      <div class="status-online">● ONLINE</div>
      <p><strong>Hostname:</strong> ${systemInfo.hostname}</p>
      <p><strong>Platform:</strong> ${systemInfo.platform} (${
      systemInfo.arch
    })</p>
      <p><strong>CPU Cores:</strong> ${systemInfo.cpuCount}</p>
      <p><strong>Memory:</strong> ${systemInfo.freemem}GB free / ${
      systemInfo.totalmem
    }GB total</p>
      <p><strong>Uptime:</strong> ${systemInfo.uptime} minutes</p>
      <p><strong>User:</strong> ${systemInfo.userInfo.username}</p>
      <p><strong>Last Update:</strong> ${new Date(
        systemInfo.timestamp
      ).toLocaleString()}</p>
    `;
  } catch (error) {
    endpointInfo.innerHTML = `
      <div class="status-offline">● OFFLINE</div>
      <p>Failed to connect to agent: ${error.message}</p>
      <p>Check that the agent is running and the configuration is correct.</p>
    `;
  }
}

async function runSecurityScan() {
  const scanResults = document.getElementById("scan-results");
  const runScanBtn = document.getElementById("run-scan");

  try {
    runScanBtn.disabled = true;
    runScanBtn.textContent = "Scanning...";
    scanResults.innerHTML = "<p>Running security scan...</p>";

    const results = await makeAgentRequest("/api/security-scan");

    scanResults.innerHTML = `
      <h4>Security Scan Results</h4>
      <p><strong>Disk Usage:</strong> ${results.diskUsage}%</p>
      <p><strong>Threat Level:</strong> <span class="threat-level">${
        results.threatLevel
      }</span></p>
      <p><strong>Last Scan:</strong> ${new Date(
        results.lastScan
      ).toLocaleString()}</p>
      <p><strong>Status:</strong> Scan completed successfully</p>
    `;

    updateThreatLevel(results.threatLevel);
  } catch (error) {
    scanResults.innerHTML = `
      <p style="color: red;">Scan failed: ${error.message}</p>
    `;
  } finally {
    runScanBtn.disabled = false;
    runScanBtn.textContent = "Run Security Scan";
  }
}

async function testAgentConnection() {
  const testBtn = document.getElementById("test-connection");
  const originalText = testBtn.textContent;

  try {
    testBtn.disabled = true;
    testBtn.textContent = "Testing...";

    await makeAgentRequest("/api/system-info");

    alert("Connection successful! Agent is responding.");
  } catch (error) {
    alert(`Connection failed: ${error.message}`);
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = originalText;
  }
}

function updateThreatLevel(level) {
  const threatInfo = document.getElementById("threat-info");
  const className = level.toLowerCase();

  threatInfo.innerHTML = `
    <div class="threat-indicator ${className}">
      <span class="threat-level">${level}</span>
      <span class="threat-description">
        ${
          level === "LOW"
            ? "System appears secure"
            : level === "MEDIUM"
            ? "Some security concerns detected"
            : "High security risk detected"
        }
      </span>
    </div>
  `;
}
