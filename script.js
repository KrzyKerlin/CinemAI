// Podstawowa inicjalizacja systemu
class MovieRecommendationSystem {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showLoading();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const aiSearchBtn = document.getElementById('aiSearchBtn');
        const filterButtons = document.querySelectorAll('.filter-btn');

        aiSearchBtn.addEventListener('click', () => {
            console.log('AI Search clicked');
        });

        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                console.log('Filter clicked:', e.target.dataset.genre);
            });
        });
    }

    showLoading() {
        document.getElementById('moviesContainer').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Ładowanie rekomendowanych filmów...
            </div>
        `;
    }
}

const movieSystem = new MovieRecommendationSystem();