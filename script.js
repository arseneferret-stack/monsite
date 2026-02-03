const links = document.querySelectorAll('.project-link, .symbol-link');
const overlay = document.getElementById ('overlay');
const overlayImage = document.getElementById('overlay-image');
const overlayContent = document.getElementById('overlay-content');

links.forEach (link => {
    link.addEventListener ('click',(e) => {
        e.preventDefault();
        const articlePath = link.getAttribute('data-article');
        const imgSrc = link.getAttribute('data-image');
        const label = link.dataset.project;
        
        if (articlePath) {
            // Load article content
            fetch(articlePath)
                .then(response => response.text())
                .then(html => {
                    if (overlayContent) {
                        overlayContent.innerHTML = html;
                        
                        // Add English version button at the top
                        const buttonContainer = document.createElement('div');
                        buttonContainer.style.textAlign = 'center';
                        buttonContainer.style.marginBottom = '20px';
                        const englishBtn = document.createElement('button');
                        englishBtn.className = 'retro-button';
                        englishBtn.textContent = 'Click here for English Version';
                        englishBtn.onclick = () => {
                            const englishVersions = {
                                'le_vers': 'articles/The_Worm_is_Still_There.html',
                                'repeter': 'articles/Repeat_is_no_Longer_Play.html',
                                'demantellement': 'articles/Family_Dismantlement.html',
                                'anesthesie': 'articles/Under_Anesthesia.html'
                            };
                            const englishPath = englishVersions[label];
                            if (englishPath) {
                                // Create loading dialog
                                const loadingDialog = document.createElement('div');
                                loadingDialog.className = 'loading-dialog';
                                loadingDialog.innerHTML = `
                                    <div class="loading-dialog-title">
                                        <span>Loading...</span>
                                        <div class="loading-dialog-close">×</div>
                                    </div>
                                    <div class="loading-dialog-content">
                                        <div class="loading-dialog-text">Loading English version...</div>
                                        <div class="progress-bar">
                                            <div class="progress-fill"></div>
                                        </div>
                                    </div>
                                `;
                                document.body.appendChild(loadingDialog);
                                
                                // Add glitch effect
                                overlayContent.classList.add('glitch-animation');
                                
                                // Remove loading dialog after 4 seconds
                                setTimeout(() => {
                                    loadingDialog.remove();
                                    overlayContent.classList.remove('glitch-animation');
                                }, 4000);
                                
                                // Fetch and load after delay
                                setTimeout(() => {
                                    fetch(englishPath)
                                        .then(response => response.text())
                                        .then(html => {
                                            overlayContent.innerHTML = html;
                                        })
                                        .catch(error => alert('English version coming soon!'));
                                }, 2000);
                            }
                        };
                        buttonContainer.appendChild(englishBtn);
                        overlayContent.insertBefore(buttonContainer, overlayContent.firstChild);
                        
                        overlay.classList.add('active');
                        spawnProjectWords(label);
                        
                        // Remove button after 4 seconds
                        setTimeout(() => {
                            buttonContainer.remove();
                        }, 4000);
                    }
                })
                .catch(error => console.error('Error loading article:', error));
        } else if (imgSrc) {
            // Load image
            overlayImage.src = imgSrc;
            overlay.classList.add('active');
            spawnProjectWords(label);
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 1500);
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