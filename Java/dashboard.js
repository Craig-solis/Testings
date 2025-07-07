//NavBar ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Navbar logic
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
    }

    window.addEventListener('scroll', function() {
        if (window.scrollY > 0) {
            navbar.classList.add('solid');
        } else {
            navbar.classList.remove('solid');
        }
    });
});