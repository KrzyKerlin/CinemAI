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

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (e.target.value.trim()) {
                    this.searchMovies(e.target.value);
                } else {
                    this.loadMoviesByGenre(this.currentGenre);
                }
            }, 500);
        });

        aiSearchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                searchInput.placeholder = "Opisz jaki film chcesz obejrzeć...";
                searchInput.focus();
            }
        });

        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentGenre = e.target.dataset.genre;
                this.loadMoviesByGenre(this.currentGenre);
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

    async loadMoviesByGenre(genreId) {
        this.showLoading();
        try {
            let url;
            if (genreId === 'all') {
                url = `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=pl-PL&page=1`;
            } else {
                url = `${this.baseUrl}/discover/movie?api_key=${this.apiKey}&language=pl-PL&with_genres=${genreId}&sort_by=popularity.desc&page=1`;
            }
        
            const response = await fetch(url);
            const data = await response.json();
            this.allMovies = data.results;
            this.displayMovies(data.results);
        } catch (error) {
            console.error('Błąd podczas ładowania filmów:', error);
            this.showError();
        }
    }

    async searchMovies(query) {
        this.showLoading();
        try {
            const response = await fetch(
                `${this.baseUrl}/search/movie?api_key=${this.apiKey}&language=pl-PL&query=${encodeURIComponent(query)}&page=1`
            );
            const data = await response.json();
                    
            if (data.results.length === 0) {
                this.showNoResults();
                return;
            }
                    
            this.displayMovies(data.results);
        } catch (error) {
            console.error('Błąd podczas wyszukiwania:', error);
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
            const stars = this.generateStars(movie.vote_average);
        
            return `
                <div class="movie-card">
                    <img class="movie-poster" src="${posterUrl}" alt="${movie.title}" loading="lazy">
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title}</h3>
                        <p class="movie-year">${releaseYear}</p>
                        <div class="movie-rating">
                            ${stars}
                            <span>${rating}/10</span>
                        </div>
                        <p class="movie-overview">${movie.overview || 'Brak opisu dostępnego.'}</p>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="movies-grid">${moviesHtml}</div>`;
    }

    generateStars(rating) {
        const stars = Math.round(rating / 2);
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            starsHtml += `<span class="star">${i < stars ? '★' : '☆'}</span>`;
        }
        return starsHtml;
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