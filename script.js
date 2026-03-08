// ========================================
// PORTFOLIO JAVASCRIPT
// Guillaume Legrand - BTS SISR
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // NAVIGATION
    // ========================================
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect on navbar
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', function() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    });

    // ========================================
    // PROJECT TABS
    // ========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // ========================================
    // VEILLE TABS
    // ========================================
    const veilleTabs = document.querySelectorAll('.veille-tab-btn');
    const veillePanels = document.querySelectorAll('.veille-panel');

    veilleTabs.forEach(btn => {
        btn.addEventListener('click', function() {
            const veilleId = this.getAttribute('data-veille');
            
            // Remove active from all
            veilleTabs.forEach(b => b.classList.remove('active'));
            veillePanels.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            document.getElementById('veille-' + veilleId).classList.add('active');
            
            // Load RSS feed if not already loaded
            loadRSSFeed(veilleId);
        });
    });

    // ========================================
    // RSS FEED LOADER - API RSS2JSON
    // ========================================
    const rssFeeds = {
        cyber: [
            { name: 'CERT-FR', url: 'https://www.cert.ssi.gouv.fr/feed/' },
            { name: 'ZATAZ', url: 'https://www.zataz.com/feed/' },
            { name: 'IT-Connect Sécurité', url: 'https://www.it-connect.fr/feed/' },
            { name: 'UnderNews', url: 'https://www.undernews.fr/feed' }
        ],
        infra: [
            { name: 'IT-Connect', url: 'https://www.it-connect.fr/feed/' },
            { name: 'Le Monde Informatique', url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/infrastructure/rss.xml' },
            { name: 'ZDNet', url: 'https://www.zdnet.com/rss.xml' },
            { name: 'TechRepublic', url: 'https://www.techrepublic.com/rssfeeds/articles/' }
        ],
        ia: [
            { name: 'ActuIA', url: 'https://www.actuia.com/feed/' },
            { name: 'LeBigData', url: 'https://www.lebigdata.fr/feed' },
            { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
            { name: 'MIT News AI', url: 'https://news.mit.edu/topic/artificial-intelligence2/feed' }
        ],
        quantum: [
            { name: 'The Quantum Insider', url: 'https://thequantuminsider.com/feed/' },
            { name: 'Phys.org Quantum', url: 'https://phys.org/rss-feed/physics-news/quantum-physics/' },
            { name: 'Science Daily Quantum', url: 'https://www.sciencedaily.com/rss/matter_energy/quantum_physics.xml' }
        ]
    };

    const loadedFeeds = new Set();

    async function loadRSSFeed(category) {
        if (loadedFeeds.has(category)) return;
        
        const feedContainer = document.getElementById('feed-' + category);
        if (!feedContainer) return;

        const feeds = rssFeeds[category];
        if (!feeds || feeds.length === 0) {
            feedContainer.innerHTML = '<p class="feed-error">Aucun flux RSS configuré pour cette catégorie.</p>';
            return;
        }

        // Afficher le loader
        feedContainer.innerHTML = '<div class="feed-loading"><div class="loader"></div><p>Chargement des actualités...</p></div>';

        let allItems = [];

        // Charger chaque flux RSS via l'API rss2json
        for (const feed of feeds) {
            try {
                const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=10`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.status === 'ok' && data.items) {
                    data.items.forEach(item => {
                        allItems.push({
                            title: item.title,
                            link: item.link,
                            source: feed.name,
                            date: formatDate(item.pubDate),
                            dateRaw: item.pubDate,
                            description: stripHtml(item.description).substring(0, 200) + '...'
                        });
                    });
                }
            } catch (error) {
                console.log('Erreur lors du chargement de ' + feed.name + ':', error);
            }
        }

        // Trier par date (plus récent en premier)
        allItems.sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));

        // Limiter à 12 articles
        allItems = allItems.slice(0, 12);

        if (allItems.length > 0) {
            displayFeedItems(feedContainer, allItems);
            loadedFeeds.add(category);
        } else {
            // Si l'API échoue, utiliser les données de secours
            const backupData = getBackupData(category);
            displayFeedItems(feedContainer, backupData);
            loadedFeeds.add(category);
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Il y a quelques minutes';
        if (diffHours < 24) return 'Il y a ' + diffHours + ' heure' + (diffHours > 1 ? 's' : '');
        if (diffDays < 7) return 'Il y a ' + diffDays + ' jour' + (diffDays > 1 ? 's' : '');
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function getBackupData(category) {
        const data = {
            cyber: [
                { title: 'Vulnérabilité critique CVE-2024 découverte dans les systèmes Windows', link: 'https://www.cert.ssi.gouv.fr/', source: 'CERT-FR', date: 'Récemment', description: 'Une faille de sécurité majeure permettant l\'exécution de code à distance a été identifiée. Les administrateurs sont invités à appliquer les correctifs immédiatement...' },
                { title: 'Campagne de phishing sophistiquée ciblant les entreprises françaises', link: 'https://www.zataz.com/', source: 'ZATAZ', date: 'Récemment', description: 'Des cybercriminels utilisent de nouvelles techniques d\'ingénierie sociale pour dérober des identifiants. Les emails frauduleux imitent des services de confiance...' },
                { title: 'Ransomware : nouvelle variante détectée en France', link: 'https://www.it-connect.fr/', source: 'IT-Connect Sécurité', date: 'Récemment', description: 'Une nouvelle version du ransomware avec des capacités de chiffrement améliorées a été repérée dans plusieurs attaques récentes sur le territoire français...' },
                { title: 'Alerte ANSSI : mise à jour de sécurité urgente pour Apache et Nginx', link: 'https://www.undernews.fr/', source: 'UnderNews', date: 'Récemment', description: 'Des correctifs critiques ont été publiés pour corriger des vulnérabilités zero-day activement exploitées sur les serveurs web...' },
                { title: 'Guide de durcissement des infrastructures Active Directory', link: 'https://www.cert.ssi.gouv.fr/', source: 'CERT-FR', date: 'Récemment', description: 'Recommandations actualisées de l\'ANSSI pour sécuriser vos environnements AD contre les attaques de type Pass-the-Hash et Kerberoasting...' },
                { title: 'Fuite de données : des millions de comptes français exposés', link: 'https://www.zataz.com/', source: 'ZATAZ', date: 'Récemment', description: 'Une base de données contenant des informations personnelles a été découverte sur un forum de hackers. Vérifiez si vous êtes concerné...' }
            ],
            infra: [
                { title: 'Windows Server 2025 : les nouvelles fonctionnalités réseau dévoilées', link: 'https://www.it-connect.fr/', source: 'IT-Connect', date: 'Récemment', description: 'Microsoft présente les améliorations majeures apportées à la gestion des réseaux, incluant le support natif de QUIC et des optimisations SMB...' },
                { title: 'VMware vs Proxmox : comparatif complet pour 2024', link: 'https://www.lemondeinformatique.fr/', source: 'Le Monde Informatique', date: 'Récemment', description: 'Analyse détaillée des deux solutions de virtualisation leaders. Performance, coût, fonctionnalités : quel hyperviseur choisir ?...' },
                { title: 'Kubernetes 1.30 : les nouveautés pour la production', link: 'https://www.zdnet.com/', source: 'ZDNet', date: 'Récemment', description: 'La nouvelle version apporte des améliorations significatives en matière de sécurité et de gestion des ressources pour les clusters...' },
                { title: 'Active Directory : migration vers Azure AD en 10 étapes', link: 'https://www.techrepublic.com/', source: 'TechRepublic', date: 'Récemment', description: 'Guide pratique pour migrer votre infrastructure AD on-premise vers une architecture hybride avec Azure Active Directory...' },
                { title: 'Tendances Cloud 2024 : l\'essor du multi-cloud et de l\'edge computing', link: 'https://www.it-connect.fr/', source: 'IT-Connect', date: 'Récemment', description: 'Les entreprises adoptent massivement des stratégies multi-cloud pour optimiser coûts et résilience...' },
                { title: 'Docker et Podman : conteneurisation sans daemon root', link: 'https://www.lemondeinformatique.fr/', source: 'Le Monde Informatique', date: 'Récemment', description: 'Comment sécuriser vos environnements de conteneurs en évitant les privilèges root avec les nouvelles alternatives...' }
            ],
            ia: [
                { title: 'GPT-5 : OpenAI annonce des capacités de raisonnement révolutionnaires', link: 'https://www.actuia.com/', source: 'ActuIA', date: 'Récemment', description: 'Le nouveau modèle promet des avancées majeures en raisonnement logique, mathématique et compréhension contextuelle...' },
                { title: 'L\'IA générative transforme le développement logiciel', link: 'https://www.lebigdata.fr/', source: 'LeBigData', date: 'Récemment', description: 'GitHub Copilot, Amazon CodeWhisperer : comment les outils d\'IA assistent les développeurs et augmentent leur productivité...' },
                { title: 'Règlement européen sur l\'IA : ce qui change pour les entreprises', link: 'https://venturebeat.com/', source: 'VentureBeat AI', date: 'Récemment', description: 'L\'UE finalise son AI Act avec des implications majeures pour le déploiement des systèmes d\'intelligence artificielle...' },
                { title: 'LLMs open source : Llama 3, Mistral et les alternatives à GPT', link: 'https://news.mit.edu/', source: 'MIT News AI', date: 'Récemment', description: 'Tour d\'horizon des modèles de langage open source qui rivalisent avec les solutions propriétaires...' },
                { title: 'IA et cybersécurité : détection des menaces en temps réel', link: 'https://www.actuia.com/', source: 'ActuIA', date: 'Récemment', description: 'L\'intelligence artificielle devient incontournable pour analyser les logs et détecter les comportements malveillants...' },
                { title: 'RAG et Vector Databases : la nouvelle architecture pour l\'IA d\'entreprise', link: 'https://www.lebigdata.fr/', source: 'LeBigData', date: 'Récemment', description: 'Comment implémenter le Retrieval-Augmented Generation pour des réponses plus précises et contextualisées...' }
            ],
            quantum: [
                { title: 'IBM Quantum : le processeur Condor atteint 1121 qubits', link: 'https://thequantuminsider.com/', source: 'The Quantum Insider', date: 'Récemment', description: 'Une avancée majeure vers l\'informatique quantique pratique avec le plus grand processeur quantique jamais construit...' },
                { title: 'Cryptographie post-quantique : les standards NIST finalisés', link: 'https://phys.org/', source: 'Phys.org Quantum', date: 'Récemment', description: 'Les algorithmes CRYSTALS-Kyber et CRYSTALS-Dilithium sont officiellement recommandés pour résister aux attaques quantiques...' },
                { title: 'Google Willow démontre la correction d\'erreurs quantiques', link: 'https://www.sciencedaily.com/', source: 'Science Daily', date: 'Récemment', description: 'Le nouveau processeur de Google réalise une percée en maintenant la cohérence quantique plus longtemps que jamais...' },
                { title: 'Informatique quantique : applications concrètes en chimie et pharmacie', link: 'https://thequantuminsider.com/', source: 'The Quantum Insider', date: 'Récemment', description: 'Les laboratoires pharmaceutiques utilisent déjà les simulateurs quantiques pour accélérer la découverte de médicaments...' },
                { title: 'Startups quantiques françaises : Pasqal et Alice & Bob en tête', link: 'https://phys.org/', source: 'Phys.org Quantum', date: 'Récemment', description: 'L\'écosystème quantique français se structure avec des levées de fonds record et des partenariats industriels majeurs...' },
                { title: 'Quantum Machine Learning : quand l\'IA rencontre le quantique', link: 'https://www.sciencedaily.com/', source: 'Science Daily', date: 'Récemment', description: 'Les algorithmes d\'apprentissage quantique promettent des gains exponentiels pour certains problèmes d\'optimisation...' }
            ]
        };
        return data[category] || [];
    }

    function displayFeedItems(container, items) {
        if (items.length === 0) {
            container.innerHTML = '<p class="feed-error">Aucune actualité disponible pour le moment.</p>';
            return;
        }

        let html = '';
        items.forEach(item => {
            html += `
                <div class="feed-item">
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="feed-item-title">${item.title}</a>
                    <div class="feed-item-meta">
                        <span class="feed-item-source">${item.source}</span>
                        <span class="feed-item-date">${item.date}</span>
                    </div>
                    <p class="feed-item-description">${item.description}</p>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // Load initial feed (cyber)
    setTimeout(() => loadRSSFeed('cyber'), 500);

    // ========================================
    // SCROLL REVEAL ANIMATION
    // ========================================
    const revealElements = document.querySelectorAll(
        '.section-header, .about-grid, .timeline-item, .skill-category, .objective-card, .contact-card, .contact-form, .school-card, .school-stat, .company-card, .company-stat, .service-card, .project-card, .location-card'
    );

    const revealOnScroll = function() {
        const windowHeight = window.innerHeight;
        
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const revealPoint = 150;
            
            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('reveal', 'active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // ========================================
    // SKILL BARS ANIMATION
    // ========================================
    const skillBars = document.querySelectorAll('.skill-progress');
    let skillsAnimated = false;

    const animateSkills = function() {
        const skillsSection = document.getElementById('skills');
        if (!skillsSection) return;
        
        const sectionTop = skillsSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight - 100 && !skillsAnimated) {
            skillBars.forEach(bar => {
                const width = bar.getAttribute('data-width');
                setTimeout(() => {
                    bar.style.width = width + '%';
                }, 200);
            });
            skillsAnimated = true;
        }
    };

    window.addEventListener('scroll', animateSkills);
    animateSkills(); // Initial check

    // ========================================
    // COUNTER ANIMATION
    // ========================================
    const counters = document.querySelectorAll('.stat-number, .school-stat-number, .company-stat-number');
    let countersAnimated = new Set();

    const animateCounters = function() {
        counters.forEach(counter => {
            if (countersAnimated.has(counter)) return;
            
            const rect = counter.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight - 100) {
                countersAnimated.add(counter);
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 800;
                const increment = target / (duration / 16);
                let current = 0;
                
                const updateCounter = function() {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
            }
        });
    };

    window.addEventListener('scroll', animateCounters);
    animateCounters(); // Initial check

    // ========================================
    // SMOOTH SCROLL
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========================================
    // CONTACT FORM
    // ========================================
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // Simple validation
            if (!data.name || !data.email || !data.message) {
                e.preventDefault();
                showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                e.preventDefault();
                showNotification('Veuillez entrer une adresse email valide.', 'error');
                return;
            }
            
            // Si tout est valide, laisser le formulaire s'envoyer
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<span>Envoi en cours...</span>';
            submitBtn.disabled = true;
        });
    }

    // ========================================
    // NOTIFICATION SYSTEM
    // ========================================
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 16px 24px;
            background: ${type === 'success' ? 'rgba(74, 222, 128, 0.9)' : 
                         type === 'error' ? 'rgba(255, 51, 102, 0.9)' : 
                         'rgba(0, 212, 255, 0.9)'};
            color: ${type === 'success' || type === 'error' ? '#fff' : '#0a0a0f'};
            border-radius: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: inherit;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        `;
        
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Add notification animations to document
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ========================================
    // TYPING EFFECT (Hero Card)
    // ========================================
    const codeContent = document.querySelector('.card-content code');
    
    if (codeContent) {
        const originalHTML = codeContent.innerHTML;
        codeContent.innerHTML = '';
        
        let index = 0;
        const typingSpeed = 20;
        
        function typeWriter() {
            if (index < originalHTML.length) {
                // Handle HTML tags
                if (originalHTML[index] === '<') {
                    const tagEnd = originalHTML.indexOf('>', index);
                    codeContent.innerHTML += originalHTML.substring(index, tagEnd + 1);
                    index = tagEnd + 1;
                } else {
                    codeContent.innerHTML += originalHTML[index];
                    index++;
                }
                setTimeout(typeWriter, typingSpeed);
            }
        }
        
        // Start typing after a delay
        setTimeout(typeWriter, 1000);
    }

    // ========================================
    // PARALLAX EFFECT (Background Glows)
    // ========================================
    const bgGlows = document.querySelectorAll('.bg-glow');
    
    window.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        bgGlows.forEach((glow, index) => {
            const speed = (index + 1) * 20;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            
            glow.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // ========================================
    // TIMELINE ANIMATION
    // ========================================
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 200);
            }
        });
    }, observerOptions);
    
    timelineItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(50px)';
        item.style.transition = 'all 0.6s ease';
        timelineObserver.observe(item);
    });

    // ========================================
    // CARD TILT EFFECT
    // ========================================
    const tiltCards = document.querySelectorAll('.hero-card, .skill-category, .objective-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });

    // ========================================
    // PRELOADER (Optional)
    // ========================================
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
        
        // Trigger initial animations
        setTimeout(() => {
            document.querySelectorAll('.animate-fade-in, .animate-fade-in-up').forEach(el => {
                el.style.opacity = '1';
            });
        }, 100);
    });

    // ========================================
    // CONSOLE EASTER EGG
    // ========================================
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   👋 Bonjour !                                        ║
    ║                                                       ║
    ║   Je suis Guillaume Legrand, étudiant en BTS SISR.    ║
    ║   Passionné par les réseaux et la cybersécurité.      ║
    ║   Alternant chez Elionis.                             ║
    ║                                                       ║
    ║   📧 Contact: guillaume.legrand@email.com             ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);

});

// ========================================
// MODAL FUNCTIONS (Global Scope)
// ========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on backdrop click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});
