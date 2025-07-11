// dashboard.js - User dashboard logic

import { auth } from "../Java/firebase-config.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      if (role === "user" || role === "approved") {
        // Show main dashboard
        document.body.style.display = "block";
        const loader = document.getElementById("loader");
        const content = document.getElementById("content");
        const adminDash = document.getElementById("admin-dashboard");
        if (loader) loader.style.display = "none";
        if (content) content.style.display = "block";
        if (adminDash) adminDash.style.display= "none";
        setupNavbar(); // Attach navbar logic after content is visible
        setupSignOut(); // Attach signout logic after content is visible
      } else if (role === "admin") {
        // Show main dashboard
        document.body.style.display = "block";
        const loader = document.getElementById("loader");
        const content = document.getElementById("content");
        const adminDash = document.getElementById("admin-dashboard");
        if (loader) loader.style.display = "none";
        if (content) content.style.display = "block";
        if (adminDash) adminDash.style.display= "block";
        setupNavbar(); // Attach navbar logic after content is visible
        setupSignOut(); // Attach signout logic after content is visible
      } else {
        // Show awaiting approval screen
        document.body.style.display = "none";
        alert("Your account is pending admin approval.");
        await signOut(auth);
        window.location.href = "login.html";
      }
    } else {
      alert("User document does not exist.");
      await signOut(auth);
      window.location.href = "login.html";
    }
  } else {
    window.location.href = "login.html";
  }
});

//NavBar ----------------------------------------------------
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
            if (
                navbarMenu.classList.contains('active') &&
                !navbar.contains(e.target)
            ) {
                navbarToggle.classList.remove('active');
                navbarMenu.classList.remove('active');
            }
        });

        // Close menu when a tab is clicked (for mobile/hamburger)
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

//Signout Logic
function setupSignOut() {
    const signOutBtn = document.getElementById("signOutBtn");
    if (signOutBtn) {
        signOutBtn.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "../index.html";
        });
    }
}

// EmailJS Contact Form Logic
window.addEventListener('DOMContentLoaded', function() {
  if (window.emailjs) {
    emailjs.init('AGk60--qzPOJcZW2G');
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // Replace 'service_qwcb55i' and 'template_mo0cr2f' with your actual IDs if needed
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