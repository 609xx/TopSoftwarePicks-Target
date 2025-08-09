// Updated script.js with slug-based article loading, dynamic sidebar, optimized preview loading, and loading screen

let currentArticle = null;
let currentSoftware = null;
let articles = [];

// Show/hide loading screen
function showLoadingScreen() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}
function hideLoadingScreen() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    showLoadingScreen();
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    fetch('/api/articles/preview')
        .then(res => res.json())
        .then(data => {
            articles = data;
            populateArticleList();
            loadDefaultArticleFromPreview();
        })
        .catch(err => {
            console.error('Error loading preview articles:', err);
            hideLoadingScreen();
        });

    setupSearch();
}

function fetchArticlesAll() {
    fetch('/api/articles')
        .then(res => res.json())
        .then(data => {
            articles = data;
            populateArticleList();
        })
        .catch(err => console.error('Error loading all articles:', err));
}

function setupEventListeners() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    menuToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    window.addEventListener('scroll', handleScroll);

    document.getElementById('affiliateBox')?.addEventListener('click', () => {
        if (currentSoftware) window.open(currentSoftware.affiliateUrl, '_blank');
    });

    document.getElementById('stickyCtatButton')?.addEventListener('click', () => {
        if (currentSoftware) window.open(currentSoftware.affiliateUrl, '_blank');
    });

    document.getElementById('affiliateCtaButton')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentSoftware) window.open(currentSoftware.affiliateUrl, '_blank');
    });

    document.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSidebar();
    });

    menuToggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSidebar();
        }
    });
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function populateArticleList() {
    const articleList = document.getElementById('articleList');
    articleList.innerHTML = '';

    articles.forEach(article => {
        const articleItem = document.createElement('div');
        articleItem.className = 'article-item';
        articleItem.innerHTML = `<h4>${article.title}</h4><p>${article.excerpt}</p>`;

        articleItem.addEventListener('click', () => {
            showLoadingScreen();
            loadArticleBySlug(article.titleSlug);
            history.pushState({}, '', `/${article.titleSlug}`);
            closeSidebar();
            document.querySelectorAll('.article-item').forEach(item => item.classList.remove('active'));
            articleItem.classList.add('active');
        });

        articleList.appendChild(articleItem);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let fullArticlesLoaded = false;

    // Prefetch all articles when search gets focus
    searchInput.addEventListener('focus', () => {
        if (!fullArticlesLoaded) {
            fullArticlesLoaded = true;
            fetchArticlesAll();
        }
    });

    searchInput.addEventListener('input', e => {
        const query = e.target.value.toLowerCase();

        document.querySelectorAll('.article-item').forEach(item => {
            const title = item.querySelector('h4').textContent.toLowerCase();
            const excerpt = item.querySelector('p').textContent.toLowerCase();
            item.style.display = (title.includes(query) || excerpt.includes(query)) ? 'block' : 'none';
        });
    });
}

function loadDefaultArticleFromPreview() {
    const slug = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (slug) {
        loadArticleBySlug(slug);
    } else if (articles.length > 0) {
        const firstArticle = articles[0];
        loadArticleBySlug(firstArticle.titleSlug);
        history.replaceState({}, '', `/${firstArticle.titleSlug}`);
    } else {
        hideLoadingScreen();
    }
}

function loadArticleBySlug(slug) {
    fetch(`/api/article/${slug}`)
        .then(res => {
            if (!res.ok) throw new Error('Article not found');
            return res.json();
        })
        .then(article => updateArticleDisplay(article))
        .catch(err => {
            console.error('Error loading article by slug:', err);
            alert('Article not found or API issue.');
            hideLoadingScreen();
        });
}

function updateArticleDisplay(article) {
    currentArticle = article;

    currentSoftware = {
        name: article.software_name || article.websiteName,
        logo: article.logo_path || 'default-logo.png',
        affiliateUrl: article.website_link,
        benefits: article.excerpt || article.excerptSlug || ''
    };

    document.getElementById('softwareLogo').src = currentSoftware.logo;
    document.getElementById('bottomSoftwareLogo').src = currentSoftware.logo;
    document.getElementById('affiliateLogo').src = currentSoftware.logo;

    document.getElementById('bottomSoftwareName').textContent = currentSoftware.name;
    document.getElementById('affiliateName').textContent = currentSoftware.name;

    document.getElementById('articleContent').innerHTML = article.article_content || '';
    document.getElementById('ctaText').textContent = `Try ${currentSoftware.name}`;
    document.getElementById('affiliateBenefits').textContent = currentSoftware.benefits;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    highlightActiveArticle(article);
    hideLoadingScreen();
}

function highlightActiveArticle(article) {
    const items = document.querySelectorAll('.article-item');
    items.forEach(item => {
        item.classList.remove('active');
        const title = item.querySelector('h4').textContent;
        if (title === article.title) {
            item.classList.add('active');
        }
    });
}

function handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const stickyCta = document.getElementById('stickyCta');
    const article = document.querySelector('.article');

    if (article) {
        const articleTop = article.offsetTop;
        const articleHeight = article.offsetHeight;
        const scrollThreshold = articleTop + (articleHeight * 0.3);

        if (scrollY > scrollThreshold && scrollY < documentHeight - windowHeight - 200) {
            stickyCta.classList.add('visible');
        } else {
            stickyCta.classList.remove('visible');
        }
    }
}
