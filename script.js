const links = document.querySelectorAll('.project-link, .symbol-link');
const overlay = document.getElementById ('overlay');
const overlayImage = document.getElementById('overlay-image');
const overlayContent = document.getElementById('overlay-content');

links.forEach(link => {
    link.addEventListener('click', (e) => {
        const articlePath = link.getAttribute('data-article');
        const imgSrc = link.getAttribute('data-image');
        const label = link.dataset.project || '';

        if (articlePath) {
            e.preventDefault();
            showLoadingDialog('Chargement du texte...');

            fetch(articlePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const articleNode = doc.querySelector('article');

                    overlayContent.innerHTML = '';

                    if (articleNode) {
                        const cloned = articleNode.cloneNode(true);

                        // if article already has English button, keep it. Sinon ajouter.
                        addEnglishButtonIfMissing(cloned, articlePath);

                        overlayContent.appendChild(cloned);
                    } else {
                        // fallback to sanitized full HTML
                        overlayContent.innerHTML = DOMPurify.sanitize(html);
                    }

                    overlay.classList.add('active');
                    spawnProjectWords(label);
                    hideLoadingDialog();
                })
                .catch(error => {
                    console.error('Error loading article:', error);
                    hideLoadingDialog();
                    alert('Impossible de charger l’article. Rafraîchissez la page ou essayez plus tard.');
                });

            return;
        }

        if (imgSrc) {
            e.preventDefault();
            overlayImage.src = imgSrc;
            overlay.classList.add('active');
            spawnProjectWords(label);
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 1500);
            return;
        }

        if (link.getAttribute('href') === '#') {
            e.preventDefault();
        }
    });
});

// Close button functionality
const closeBtn = document.getElementById('close-overlay');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
    });
}

// Close overlay when clicking on the dark background
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        overlay.classList.remove('active');
    }
});

let loadingDialog = null;
function showLoadingDialog(message = 'Loading...') {
    if (loadingDialog) return;
    loadingDialog = document.createElement('div');
    loadingDialog.className = 'loading-dialog';
    loadingDialog.innerHTML = `
        <div class="loading-dialog-title">
            <span>${message}</span>
            <div class="loading-dialog-close">×</div>
        </div>
        <div class="loading-dialog-content">
            <div class="loading-dialog-text">Veuillez patienter...</div>
            <div class="progress-bar"><div class="progress-fill"></div></div>
        </div>
    `;
    document.body.appendChild(loadingDialog);

    const fill = loadingDialog.querySelector('.progress-fill');
    fill.style.width = '0%';
    setTimeout(() => { fill.style.width = '70%'; }, 80);
    setTimeout(() => { fill.style.width = '100%'; }, 1400);
}

function hideLoadingDialog() {
    if (!loadingDialog) return;
    loadingDialog.remove();
    loadingDialog = null;
}

function addEnglishButtonIfMissing(articleNode, articlePath) {
    if (articleNode.querySelector('a.retro-button')) return;

    const englishMap = {
        'Le_Vers_est_toujours_la.html': '/articles/The_Worm_is_Still_There.html',
        'Reperer_nest_plus_jouer.html': '/articles/Repeat_is_no_Longer_Play.html',
        'Le_Demantellement_familial.html': '/articles/Family_Dismantlement.html',
        'Sous_anesthesie.html': '/articles/Under_Anesthesia.html',
        'La_fabrique_politique_de_la_peur.html': '/articles/La_fabrique_politique_de_la_peur_en.html',
        'La_fabrique_politique_de_la_peur_en.html': '/articles/La_fabrique_politique_de_la_peur.html',
        'At_symbol.html': '/articles/World_symbol.html',
        'World_symbol.html': '/articles/At_symbol.html'
    };

    const filename = articlePath.split('/').pop();
    const englishHref = englishMap[filename];
    if (!englishHref) return;

    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';
    wrapper.style.margin = '16px 0';

    const button = document.createElement('a');
    button.className = 'retro-button';
    button.href = englishHref;
    button.textContent = 'Click here for English version';

    wrapper.appendChild(button);
    articleNode.insertBefore(wrapper, articleNode.firstChild);
}

// Click handler for retro-button article translation links (glitch + loader)
document.addEventListener('click', (e) => {
    const target = e.target.closest('a.retro-button');
    if (!target) return;

    const href = target.getAttribute('href');
    if (!href || !href.match('/articles/')) return;

    e.preventDefault();
    showLoadingDialog('Chargement de la version anglaise...');
    if (overlayContent) overlayContent.classList.add('glitch-animation');

    setTimeout(() => {
        if (overlayContent) overlayContent.classList.remove('glitch-animation');
        hideLoadingDialog();
        window.location.href = href;
    }, 2000);
});

// Auto-add English version button on article pages if missing
(function addEnglishArticleLink() {
    if (!document.body.classList.contains('article-page')) return;
    const article = document.querySelector('article');
    if (!article) return;

    // Map from current article filename to English version path
    const englishMap = {
        'Le_Vers_est_toujours_la.html': '/articles/The_Worm_is_Still_There.html',
        'Reperer_nest_plus_jouer.html': '/articles/Repeat_is_no_Longer_Play.html',
        'Le_Demantellement_familial.html': '/articles/Family_Dismantlement.html',
        'Sous_anesthesie.html': '/articles/Under_Anesthesia.html',
        'La_fabrique_politique_de_la_peur.html': '/articles/La_fabrique_politique_de_la_peur_en.html',
        'At_symbol.html': '/articles/World_symbol.html',
        'World_symbol.html': '/articles/At_symbol.html',
        'article1.html': '/articles/Le_Vers_est_toujours_la.html',
        'article2.html': '/articles/Reperer_nest_plus_jouer.html',
        'article3.html': '/articles/Le_Demantellement_familial.html'
    };

    const currentFile = window.location.pathname.split('/').pop();
    const englishHref = englishMap[currentFile];
    if (!englishHref) return;

    // If button already exists, do nothing
    const existing = article.querySelector('a.retro-button[href="' + englishHref + '"]');
    if (existing) return;

    const wrapper = document.createElement('div');
    wrapper.style.marginTop = '20px';
    wrapper.style.marginBottom = '20px';
    wrapper.style.textAlign = 'center';

    const button = document.createElement('a');
    button.className = 'retro-button';
    button.href = englishHref;
    button.textContent = 'Read English version';

    wrapper.appendChild(button);

    const firstSection = article.querySelector('.article-body');
    if (firstSection) {
        article.insertBefore(wrapper, firstSection);
    } else {
        article.appendChild(wrapper);
    }

    // Add back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    const isEnglish = currentFile.includes('_en') || currentFile.includes('English') || currentFile.includes('en.');
    if (isEnglish) {
        const frenchMap = {
            'La_fabrique_politique_de_la_peur_en.html': '/articles/La_fabrique_politique_de_la_peur.html',
            'The_Worm_is_Still_There.html': '/articles/Le_Vers_est_toujours_la.html',
            'Repeat_is_no_Longer_Play.html': '/articles/Reperer_nest_plus_jouer.html',
            'Family_Dismantlement.html': '/articles/Le_Demantellement_familial.html',
            'Under_Anesthesia.html': '/articles/Sous_anesthesie.html'
        };
        const frenchHref = frenchMap[currentFile];
        backBtn.textContent = '← Version française';
        backBtn.onclick = () => window.location.href = frenchHref || '/';
    } else {
        backBtn.textContent = '← Back to Menu';
        backBtn.onclick = () => window.location.href = '/';
    }
    document.body.appendChild(backBtn);

    // Add close button (X)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => window.location.href = '/';
    document.body.appendChild(closeBtn);
})();

const words = [];
const ghost = document.getElementById("ghost-word");
function showWord() {
    const word = words[Math.floor(Math.random() * words.length)];
    ghost.textContent = word;
    ghost.style.top = Math.random() * 90 + "vh";
    ghost.style.left = Math.random() * 90 + "vw";
    ghost.style.opacity = 1;
    setTimeout(() => {
        ghost.style.opacity = 0;
    }, 800);
}
setInterval(showWord, 2500);
function spawnProjectWords(label) {
    for (let i =0; i < 8; i++) {
        const el = document.createElement('div');
        el.className = 'glitch-word';
        el.textContent = label;
        el.style.top = Math.random() * 100 + "vh";
        el.style.left = Math.random() * 100 + "vw";
        el.style.fontSize = (10 + Math.random() * 20) + "px";
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.opacity = 1;
        }, Math.random() * 500);
        setTimeout(() => {
            el.remove();
        }, 2000 + Math.random() * 2000);
    }
} 