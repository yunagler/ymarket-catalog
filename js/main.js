// ===========================================
// Y Market - Main JavaScript
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            const icon = this.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (mainNav && mainNav.classList.contains('active')) {
            if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mainNav.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animate elements on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.category-card, .product-card, .feature-item, .why-us-item, .stat-item');

        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Set initial state for animated elements
    document.querySelectorAll('.category-card, .product-card, .feature-item, .why-us-item, .stat-item').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.5s ease';
    });

    // Run animation on load and scroll
    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll);

    // Counter animation for statistics
    const animateCounters = function() {
        const counters = document.querySelectorAll('.stat-number');

        counters.forEach(counter => {
            const target = parseInt(counter.textContent.replace(/[^0-9]/g, ''));
            const suffix = counter.textContent.replace(/[0-9]/g, '');
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const updateCounter = function() {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current) + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target + suffix;
                }
            };

            // Only animate when in view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(counter);
        });
    };

    animateCounters();

    // WhatsApp message tracking (optional)
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.addEventListener('click', function() {
            // Track WhatsApp clicks (can integrate with Google Analytics)
            console.log('WhatsApp click tracked');
        });
    });

    // Form validation for contact page
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = this.querySelector('[name="name"]');
            const phone = this.querySelector('[name="phone"]');
            const message = this.querySelector('[name="message"]');

            let isValid = true;

            // Simple validation
            if (!name || name.value.trim() === '') {
                showError(name, 'נא להזין שם');
                isValid = false;
            }

            if (!phone || !/^[0-9]{9,10}$/.test(phone.value.replace(/[-\s]/g, ''))) {
                showError(phone, 'נא להזין מספר טלפון תקין');
                isValid = false;
            }

            if (isValid) {
                // Redirect to WhatsApp with form data
                const text = `שלום, שמי ${name.value}.\nטלפון: ${phone.value}\n\n${message ? message.value : ''}`;
                const encodedText = encodeURIComponent(text);
                window.open(`https://wa.me/972547867657?text=${encodedText}`, '_blank');
            }
        });
    }

    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        let errorEl = formGroup.querySelector('.error-message');

        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'error-message';
            errorEl.style.color = '#ff4444';
            errorEl.style.fontSize = '12px';
            errorEl.style.marginTop = '5px';
            errorEl.style.display = 'block';
            formGroup.appendChild(errorEl);
        }

        errorEl.textContent = message;
        input.style.borderColor = '#ff4444';

        input.addEventListener('input', function() {
            errorEl.remove();
            input.style.borderColor = '';
        }, { once: true });
    }

    // Sticky header shadow on scroll
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            }
        });
    }

    // Product image placeholder handling
    document.querySelectorAll('.product-image img').forEach(img => {
        img.addEventListener('error', function() {
            this.src = 'https://via.placeholder.com/300x300?text=' + encodeURIComponent('תמונה');
        });
    });

    console.log('Y Market website loaded successfully');
});
