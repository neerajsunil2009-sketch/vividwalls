const KEYS = {
    unsplash: 'yr1wxgn6oZ2XeIZcbZwBPpsImtrY6Ah8ZIn0DJ6cqiE',
    pexels: 'o1X7PyrGxEiaDgdyxq6j2ewlQsU8wBGg6ZIENUBThf4yudD59NiE2QUc',
    pixabay: '55660755-90f69456cc2ac320284d8b998',
};
// REPLACE THESE WITH YOUR ACTUAL API KEYS

let currentMain = 'normal'; 
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const orientation = isMobile ? 'portrait' : 'landscape';
const pixabayOrientation = isMobile ? 'vertical' : 'horizontal';

// --- 2. THE MAIN ENGINE ---
async function fetchGallery(query = 'popular') {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '<div class="loader">Merging global libraries...</div>';

    try {
        let combinedResults = [];

        if (currentMain === 'live') {
            // Fetch videos from Pexels and Pixabay (Unsplash doesn't do video)
            const results = await Promise.allSettled([
                getPexelsVideos(query),
                getPixabayVideos(query)
            ]);
            results.forEach(res => {
                if (res.status === "fulfilled") combinedResults = [...combinedResults, ...res.value];
            });
        } else {
            // Fetch photos from all 3 sources
            const results = await Promise.allSettled([
                getUnsplashPhotos(query),
                getPexelsPhotos(query),
                getPixabayPhotos(query)
            ]);
            results.forEach(res => {
                if (res.status === "fulfilled") combinedResults = [...combinedResults, ...res.value];
            });
        }

        // Shuffle so sources are mixed together
        combinedResults.sort(() => Math.random() - 0.5);
        displayItems(combinedResults);

    } catch (error) {
        console.error("Gallery Error:", error);
        gallery.innerHTML = '<p style="color:red; text-align:center;">Failed to load content. Check your API keys.</p>';
    }
}

// --- 3. API FETCHERS (PHOTOS) ---

async function getUnsplashPhotos(query) {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${query}&orientation=${orientation}&per_page=15&client_id=${KEYS.unsplash}`);
    const data = await res.json();
    return (data.results || []).map(img => ({
        type: 'image',
        preview: img.urls.regular,
        download: img.urls.full,
        author: img.user.name
    }));
}

async function getPexelsPhotos(query) {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&orientation=${orientation}&per_page=15`, {
        headers: { Authorization: KEYS.pexels }
    });
    const data = await res.json();
    return (data.photos || []).map(img => ({
        type: 'image',
        preview: img.src.large,
        download: img.src.original,
        author: img.photographer
    }));
}

async function getPixabayPhotos(query) {
    const res = await fetch(`https://pixabay.com/api/?key=${KEYS.pixabay}&q=${encodeURIComponent(query)}&orientation=${pixabayOrientation}&per_page=15`);
    const data = await res.json();
    return (data.hits || []).map(img => ({
        type: 'image',
        preview: img.largeImageURL,
        download: img.largeImageURL,
        author: img.user
    }));
}

// --- 4. API FETCHERS (VIDEOS / LIVE) ---

async function getPexelsVideos(query) {
    // If the query is too specific (like Marvel), Pexels might have 0 videos. 
    // We fall back to "abstract" if the main "popular" search is triggered.
    const q = (query === 'popular' || query === 'all') ? 'abstract loop' : query;
    const res = await fetch(`https://api.pexels.com/videos/search?query=${q}&orientation=${orientation}&per_page=15`, {
        headers: { Authorization: KEYS.pexels }
    });
    const data = await res.json();
    return (data.videos || []).map(vid => ({
        type: 'video',
        preview: vid.video_files[0].link,
        download: vid.video_files[0].link,
        author: vid.user.name
    }));
}

async function getPixabayVideos(query) {
    const q = (query === 'popular' || query === 'all') ? 'nature' : query;
    const res = await fetch(`https://pixabay.com/api/videos/?key=${KEYS.pixabay}&q=${encodeURIComponent(q)}&orientation=${pixabayOrientation}&per_page=15`);
    const data = await res.json();
    return (data.hits || []).map(vid => ({
        type: 'video',
        preview: vid.videos.medium.url,
        download: vid.videos.large.url,
        author: vid.user
    }));
}

// --- 5. DISPLAY & INTERFACE LOGIC ---

function displayItems(items) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    if (items.length === 0) {
        gallery.innerHTML = '<p style="text-align:center;">No results found for this category.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'wall-card';

        const content = item.type === 'video'
            ? `<video src="${item.preview}" loop muted onmouseover="this.play()" onmouseout="this.pause()"></video>`
            : `<img src="${item.preview}" loading="lazy">`;

        card.innerHTML = `
            ${content}
            <div class="card-info">
                <span>By ${item.author}</span>
                <a href="${item.download}" target="_blank" class="download-btn">
                    ${isMobile ? 'Portrait' : 'Landscape'}
                </a>
            </div>
        `;
        gallery.appendChild(card);
    });
}

// Navigation Logic
function setMainCategory(type) {
    currentMain = type;
    document.querySelectorAll('.main-btn').forEach(btn => btn.classList.remove('active'));
    // We use event.currentTarget to be safer
    if (event) event.currentTarget.classList.add('active');
    fetchGallery('popular');
}

function filter(query) {
    document.querySelectorAll('.sub-btn').forEach(btn => btn.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');
    fetchGallery(query);
}

// --- 6. SEARCH BAR LOGIC ---
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

function performSearch() {
    const query = searchInput.value.trim();
    if (query !== "") {
        fetchGallery(query);
    }
}

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

// Initial Load
window.onload = () => {
    fetchGallery(isMobile ? 'mobile wallpaper' : 'desktop wallpaper');
};