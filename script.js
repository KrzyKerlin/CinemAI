class MovieRecommendationSystem {
    constructor() {
        this.apiKey = CONFIG.TMDB_API_KEY; // Real key in config.js file
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
        this.allMovies = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPopularMovies();
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

    async loadPopularMovies() {
        try {
            const response = await fetch(
                `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=pl-PL&page=1`
            );
            const data = await response.json();
            this.allMovies = data.results;
            this.displayMovies(data.results);
        } catch (error) {
            console.error('Błąd podczas ładowania filmów:', error);
            this.showError();
        }
    }

    displayMovies(movies) {
        const container = document.getElementById('moviesContainer');
    
        if (movies.length === 0) {
            this.showNoResults();
            return;
        }

        const moviesHtml = movies.map(movie => {
            const posterUrl = movie.poster_path 
                ? `${this.imageBaseUrl}${movie.poster_path}`
                : 'https://via.placeholder.com/500x750?text=Brak+plakatu';
        
            const releaseYear = movie.release_date 
                ? new Date(movie.release_date).getFullYear()
                : 'Nieznany';
        
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        
            return `
                <div class="movie-card">
                    <img class="movie-poster" src="${posterUrl}" alt="${movie.title}" loading="lazy">
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="movies-grid">${moviesHtml}</div>`;
    }

    showNoResults() {
        document.getElementById('moviesContainer').innerHTML = `
            <div class="no-results">
                <h3>Brak wyników</h3>
                <p>Spróbuj zmienić kryteria wyszukiwania lub wybierz inny gatunek.</p>
            </div>
        `;  
    }

    showError() {
        document.getElementById('moviesContainer').innerHTML = `
            <div class="no-results">
                <h3>Wystąpił błąd</h3>
                <p>Nie udało się załadować filmów. Spróbuj ponownie później.</p>
            </div>
        `;
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