document.addEventListener('DOMContentLoaded', () => {
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    const navbar = document.querySelector('.navbar');

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling to document
            navbarToggle.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });

        // Close menu when clicking outside navbar
        document.addEventListener('click', (e) => {
            if (
                navbarMenu.classList.contains('active') &&
                !navbar.contains(e.target)
            ) {
                navbarToggle.classList.remove('active');
                navbarMenu.classList.remove('active');
            }
        });
    }
});
/*
    document.querySelectorAll('.reveal-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.card').querySelector('.card-cover').classList.add('hidden');
        });
    });
});
*/

window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 0) {
        navbar.classList.add('solid');
    } else {
        navbar.classList.remove('solid');
    }
});