const links = document.querySelectorAll('.project-link, .symbol-link');
const overlay = document.getElementById ('overlay');
const overlayImage = document.getElementById('overlay-image');
const overlayContent = document.getElementById('overlay-content');

links.forEach(bindOverlayLink);

function bindOverlayLink(link) {
    const articlePath = link.getAttribute('data-article');
    if (articlePath) {
        link.setAttribute('href', articlePath);
    }

    link.addEventListener('click', (e) => {
        const articlePath = link.getAttribute('data-article');
        const imgSrc = link.getAttribute('data-image');
        const label = link.dataset.project || '';

        if (articlePath) {
            // Full-page reading mode: keep native navigation for article links.
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
}

// Close button functionality
const closeBtn = document.getElementById('close-overlay');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
    });
}

// Close overlay when clicking on the dark background
if (overlay) {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
}

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

    // Keep direct navigation for better reading flow between translations.
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
    if (!words.length) return;
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

(function loadSubstackFeed() {
    const main = document.querySelector('main[data-substack-feed-url]');
    const projectsList = document.querySelector('.projects');

    if (!main || !projectsList) {
        return;
    }

    const feedUrl = main.getAttribute('data-substack-feed-url');
    const canonicalHref = document.querySelector('link[rel="canonical"]')?.href || '';
    const canonicalOrigin = canonicalHref ? new URL(canonicalHref).origin : '';
    const localEndpoint = `/.netlify/functions/substack-feed?url=${encodeURIComponent(feedUrl)}`;
    const remoteEndpoint = canonicalOrigin
        ? `${canonicalOrigin}/.netlify/functions/substack-feed?url=${encodeURIComponent(feedUrl)}`
        : null;
    const endpoints = [localEndpoint, remoteEndpoint].filter((value, index, list) => value && list.indexOf(value) === index);

    fetchSubstackFeed(endpoints)
        .then(({ payload, endpoint }) => {
            renderWritingProjects(projectsList, payload.items || [], endpoint);
        })
        .catch((error) => {
            console.error('Error loading Substack feed:', error);
            renderWritingProjectsError(projectsList);
        });
})();

function fetchSubstackFeed(endpoints) {
    const [current, ...rest] = endpoints;

    if (!current) {
        return Promise.reject(new Error('No Substack feed endpoint available'));
    }

    return fetch(current)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response.json();
        })
        .then((payload) => ({ payload, endpoint: current }))
        .catch((error) => {
            if (!rest.length) {
                throw error;
            }

            return fetchSubstackFeed(rest);
        });
}

function renderWritingProjects(projectsList, items, endpoint) {
    const writingItems = items.filter((item) => {
        if (!item.localPath) {
            return false;
        }

        // Keep FR-first listing when a paired translation exists.
        if (item.language === 'en' && item.translationPath) {
            return false;
        }

        return true;
    });

    if (!writingItems.length) {
        renderWritingProjectsError(projectsList);
        return;
    }

    projectsList.classList.add('projects-auto');

    const endpointOrigin = new URL(endpoint, window.location.href).origin;
    const sectionBreak = projectsList.querySelector('.section-break');

    projectsList.querySelectorAll('.auto-writing-item, .projects-status-item').forEach((node) => {
        node.remove();
    });

    writingItems.forEach((item) => {
        const entry = document.createElement('li');
        entry.className = 'auto-writing-item';
        const articlePath = new URL(item.localPath, endpointOrigin).toString();

        const title = document.createElement('a');
        title.className = 'project-link';
        title.href = articlePath;
        title.setAttribute('data-article', articlePath);
        title.dataset.project = item.slug || 'substack';
        title.dataset.text = item.title;
        title.textContent = item.title;
        bindOverlayLink(title);

        entry.appendChild(title);
        projectsList.insertBefore(entry, sectionBreak);
    });
}

function renderWritingProjectsError(projectsList) {
    projectsList.classList.add('projects-auto');

    projectsList.querySelectorAll('.auto-writing-item, .projects-status-item').forEach((node) => {
        node.remove();
    });

    const sectionBreak = projectsList.querySelector('.section-break');
    const entry = document.createElement('li');
    entry.className = 'projects-status-item';

    const message = document.createElement('p');
    message.className = 'substack-status';
    message.textContent = 'Impossible de charger les derniers articles pour le moment.';

    entry.appendChild(message);
    projectsList.insertBefore(entry, sectionBreak);
}