// dashboard.js - User dashboard logic
import { auth } from "../Java/firebase-config.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(event => {
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
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');
  const navbar = document.querySelector('.navbar');
  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navbarToggle.classList.toggle('active');
      navbarMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
      if (navbarMenu.classList.contains('active') && !navbar.contains(e.target)) {
        navbarToggle.classList.remove('active');
        navbarMenu.classList.remove('active');
      }
    });
    const menuLinks = navbarMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navbarMenu.classList.contains('active')) {
          navbarToggle.classList.remove('active');
          navbarMenu.classList.remove('active');
        }
      });
    });
  }
  window.addEventListener('scroll', function() {
    if (window.scrollY > 0) {
      navbar.classList.add('solid');
    } else {
      navbar.classList.remove('solid');
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

window.addEventListener('DOMContentLoaded', function() {
  if (window.emailjs) {
    emailjs.init('AGk60--qzPOJcZW2G');
  }
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      emailjs.sendForm('service_qwcb55i', 'template_mo0cr2f', this)
        .then(function() {
          alert('Message sent successfully!');
          contactForm.reset();
        }, function(error) {
          alert('Failed to send message: ' + JSON.stringify(error));
        });
    });
  }
});
