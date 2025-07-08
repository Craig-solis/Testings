import { auth } from "../Java/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const db = getFirestore();

document.getElementById("loginBtn").addEventListener("click", login);

document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("loginBtn").click();
  }
});

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "none";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, "users", userCredential.user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const role = userSnap.data().role;
      if (role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else if (role === "user" || role === "approved") {
        window.location.href = "dashboard.html";
      } else {
        errorMessage.textContent = "Your account is pending admin approval.";
        errorMessage.style.display = "block";
      }
    } else {
      errorMessage.textContent = "No user record found.";
      errorMessage.style.display = "block";
    }
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.style.display = "block";
  }
}
