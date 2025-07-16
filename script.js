class MovieRecommendationSystem {
    constructor() {
        this.apiKey = CONFIG.TMDB_API_KEY;
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

        // State management
        this.currentGenre = 'all';
        this.currentPage = 1;
        this.totalPages = 1;
        this.currentQuery = '';
        this.isSearchMode = false;
        this.currentSearchType = 'popular';
        
        // Cache
        this.savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
        this.savedMoviesCache = null;
        this.searchResultsCache = null;
        
        // Genre mapping
        this.genres = {
            28: 'Akcja', 12: 'Przygoda', 16: 'Animacja', 35: 'Komedia',
            80: 'Kryminał', 99: 'Dokumentalny', 18: 'Dramat', 10751: 'Familijny',
            14: 'Fantasy', 36: 'Historyczny', 27: 'Horror', 10402: 'Muzyczny',
            9648: 'Tajemnica', 10749: 'Romans', 878: 'Sci-Fi', 53: 'Thriller',
            10752: 'Wojenny', 37: 'Western'
        };
        
        this.genreKeywords = {
            'komedia': 35, 'akcja': 28, 'dramat': 18, 'horror': 27, 'thriller': 53,
            'romans': 10749, 'scifi': 878, 'fantasy': 14, 'animacja': 16, 'kryminał': 80,
            'przygoda': 12, 'dokumentalny': 99, 'familijny': 10751, 'historyczny': 36,
            'muzyczny': 10402, 'tajemnica': 9648, 'wojenny': 10752, 'western': 37
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPopularMovies();
        this.toggleSearchInput(true);
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const headerTitle = document.querySelector('h1');

        // Search with debouncing
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value.trim());
            }, 500);
        });

        // Genre filtering
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target, filterButtons);
                this.handleGenreChange(e.target.dataset.genre);
            });
        });

        // Pagination
        prevBtn.addEventListener('click', () => this.changePage(-1));
        nextBtn.addEventListener('click', () => this.changePage(1));

        // Header click to reload
        if (headerTitle) {
            headerTitle.addEventListener('click', () => window.location.reload());
            headerTitle.style.cursor = 'pointer';
        }
    }

    handleSearch(query) {
        this.currentPage = 1;
        this.currentQuery = query;
        this.isSearchMode = !!query;

        if (this.currentGenre === 'saved') {
            this.loadSavedMovies();
        } else if (query) {
            this.performSearch(query);
        } else {
            this.loadMoviesByGenre(this.currentGenre);
        }
    }

    setActiveFilter(activeBtn, allButtons) {
        allButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    handleGenreChange(genre) {
        this.currentPage = 1;
        this.currentGenre = genre;
        
        if (genre === 'saved') {
            this.toggleSearchInput(false);
            this.loadSavedMovies();
        } else {
            this.toggleSearchInput(true);
            if (this.isSearchMode && this.currentQuery) {
                this.performSearch(this.currentQuery);
            } else {
                this.loadMoviesByGenre(genre);
            }
        }
    }

    async changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            this.loadCurrentSearch();
        }
    }

    async loadCurrentSearch() {
        const searchActions = {
            'saved': () => this.loadSavedMovies(),
            'popular': () => this.loadPopularMovies(this.currentPage),
            'genre': () => this.loadMoviesByGenre(this.currentGenre, this.currentPage),
            'search': () => this.performSearch(this.currentQuery, this.currentPage)
        };

        const action = searchActions[this.currentSearchType] || searchActions.popular;
        await action();
    }

    async loadPopularMovies(page = 1) {
        this.currentSearchType = 'popular';
        await this.fetchAndDisplayMovies(
            `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=pl-PL&page=${page}`
        );
    }

    async loadMoviesByGenre(genreId, page = 1) {
        this.currentSearchType = 'genre';
        const url = genreId === 'all' 
            ? `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=pl-PL&page=${page}`
            : `${this.baseUrl}/discover/movie?api_key=${this.apiKey}&language=pl-PL&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`;
        
        await this.fetchAndDisplayMovies(url);
    }

    async fetchAndDisplayMovies(url) {
        this.showLoading();
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.totalPages = data.total_pages;
            this.displayMovies(data.results);
            this.updatePagination();
        } catch (error) {
            console.error('Błąd podczas ładowania filmów:', error);
            this.showError();
        }
    }

    async performSearch(query, page = 1) {
        this.currentSearchType = 'search';
        this.showLoading();
        
        try {
            let movies = [];
            
            // Smart search detection
            if (query.includes(' ') || /\d/.test(query)) {
                movies = await this.smartSearch(query);
            } else {
                movies = await this.basicSearch(query, page);
            }
            
            // Apply genre filter
            if (this.currentGenre !== 'all' && this.currentGenre !== 'saved') {
                movies = movies.filter(movie => 
                    movie.genre_ids?.includes(parseInt(this.currentGenre))
                );
            }
            
            if (movies.length === 0) {
                this.showNoResults();
                return;
            }
            
            this.searchResultsCache = movies;
            this.paginateAndDisplay(movies, page);
            
        } catch (error) {
            console.error('Błąd podczas wyszukiwania:', error);
            this.showError();
        }
    }

    async basicSearch(query, page = 1) {
        const response = await fetch(
            `${this.baseUrl}/search/movie?api_key=${this.apiKey}&language=pl-PL&query=${encodeURIComponent(query)}&page=${page}`
        );
        const data = await response.json();
        return data.results || [];
    }

    async smartSearch(query) {
        const parsed = this.parseQuery(query);
        let movies = [];
        const movieIds = new Set();
        
        // Search by actors
        for (const actor of parsed.actors) {
            const persons = await this.searchPersons(actor);
            for (const person of persons.slice(0, 3)) {
                const personMovies = await this.getMoviesByPerson(person.id);
                personMovies.forEach(movie => {
                    if (!movieIds.has(movie.id)) {
                        movieIds.add(movie.id);
                        movies.push({...movie, searchScore: 3});
                    }
                });
            }
        }
        
        // Search by title
        if (parsed.titles.length > 0) {
            const titleMovies = await this.basicSearch(parsed.titles.join(' '));
            titleMovies.forEach(movie => {
                if (!movieIds.has(movie.id)) {
                    movieIds.add(movie.id);
                    movies.push({...movie, searchScore: 2});
                } else {
                    const existing = movies.find(m => m.id === movie.id);
                    if (existing) existing.searchScore += 2;
                }
            });
        }
        
        // Filter by genres and years
        return this.filterMovies(movies, parsed);
    }

    parseQuery(query) {
        const words = query.toLowerCase().split(' ').filter(word => word.length > 0);
        const parsed = { actors: [], genres: [], years: [], titles: [] };
        
        words.forEach(word => {
            if (/^\d{4}$/.test(word) && parseInt(word) >= 1900 && parseInt(word) <= 2025) {
                parsed.years.push(parseInt(word));
            } else if (this.genreKeywords[word]) {
                parsed.genres.push(this.genreKeywords[word]);
            } else {
                parsed.actors.push(word);
                parsed.titles.push(word);
            }
        });
        
        return parsed;
    }

    filterMovies(movies, parsed) {
        let filtered = movies;
        
        if (parsed.genres.length > 0) {
            filtered = filtered.filter(movie => 
                parsed.genres.some(genre => movie.genre_ids?.includes(genre))
            );
        }
        
        if (parsed.years.length > 0) {
            filtered = filtered.filter(movie => {
                if (!movie.release_date) return false;
                const year = new Date(movie.release_date).getFullYear();
                return parsed.years.includes(year);
            });
        }
        
        return filtered.sort((a, b) => {
            if (a.searchScore !== b.searchScore) {
                return b.searchScore - a.searchScore;
            }
            return b.popularity - a.popularity;
        });
    }

    paginateAndDisplay(movies, page) {
        const moviesPerPage = 20;
        const startIndex = (page - 1) * moviesPerPage;
        const paginatedMovies = movies.slice(startIndex, startIndex + moviesPerPage);
        
        this.totalPages = Math.ceil(movies.length / moviesPerPage);
        this.displayMovies(paginatedMovies);
        this.updatePagination();
    }

    async loadSavedMovies() {
        this.currentSearchType = 'saved';
        this.showLoading();
        
        if (this.savedMovies.length === 0) {
            this.showNoSavedMovies();
            return;
        }
        
        try {
            if (!this.savedMoviesCache) {
                this.savedMoviesCache = await Promise.all(
                    this.savedMovies.map(async id => {
                        const response = await fetch(`${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=pl-PL`);
                        const movie = await response.json();
                        if (movie.genres) {
                            movie.genre_ids = movie.genres.map(g => g.id);
                        }
                        return movie;
                    })
                );
            }

            let filteredMovies = this.savedMoviesCache;
        
            if (this.isSearchMode && this.currentQuery) {
                const query = this.currentQuery.toLowerCase();
                filteredMovies = this.savedMoviesCache.filter(movie => movie.title.toLowerCase().includes(query) ||
                movie.overview?.toLowerCase().includes(query) ||
                (movie.genre_ids && movie.genre_ids.some(genreId => this.genres[genreId]?.toLowerCase().includes(query)))
            );
        }
        
        this.totalPages = Math.ceil(filteredMovies.length / 20);           
        this.paginateAndDisplay(filteredMovies, this.currentPage);
        
        } catch (error) {
            console.error('Błąd podczas ładowania zapisanych filmów:', error);
            this.showError();
        }
    }

    async searchPersons(query) {
        try {
            const response = await fetch(
                `${this.baseUrl}/search/person?api_key=${this.apiKey}&language=pl-PL&query=${encodeURIComponent(query)}`
            );
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Błąd podczas wyszukiwania osób:', error);
            return [];
        }
    }

    async getMoviesByPerson(personId) {
        try {
            const response = await fetch(
                `${this.baseUrl}/person/${personId}/movie_credits?api_key=${this.apiKey}&language=pl-PL`
            );
            const data = await response.json();
            return data.cast || [];
        } catch (error) {
            console.error('Błąd podczas pobierania filmów osoby:', error);
            return [];
        }
    }

    displayMovies(movies) {
        const container = document.getElementById('moviesContainer');
        
        if (movies.length === 0) {
            this.showNoResults();
            return;
        }
        
        if (this.currentPage === 1) {
            movies = this.sortMovies(movies);
        }
        
        const moviesHtml = movies.map(movie => this.createMovieCard(movie)).join('');
        container.innerHTML = `<div class="movies-grid">${moviesHtml}</div>`;
        
        // Add click listeners
        container.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.showMovieModal(e.currentTarget.dataset.movieId);
            });
        });
    }

    sortMovies(movies) {
        return movies.sort((a, b) => {
            if (this.currentQuery && this.isSearchMode) {
                const matchA = this.getTitleMatchScore(a.title, this.currentQuery);
                const matchB = this.getTitleMatchScore(b.title, this.currentQuery);
                
                if (matchA !== matchB) return matchB - matchA;
                if (matchA > 0) {
                    return Math.abs(b.popularity - a.popularity) > 50 
                        ? b.popularity - a.popularity 
                        : b.vote_average - a.vote_average;
                }
            }
            
            return Math.abs(b.popularity - a.popularity) > 50 
                ? b.popularity - a.popularity 
                : b.vote_average - a.vote_average;
        });
    }

    getTitleMatchScore(title, query) {
        const titleLower = title.toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (titleLower === queryLower) return 3;
        if (titleLower.startsWith(queryLower)) return 2;
        if (titleLower.includes(queryLower)) return 1;
        return 0;
    }

    createMovieCard(movie) {
        const posterUrl = movie.poster_path 
            ? `${this.imageBaseUrl}${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=Brak+plakatu';
        
        const releaseYear = movie.release_date 
            ? new Date(movie.release_date).getFullYear()
            : 'Nieznany';
        
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const isNew = this.isNewMovie(movie.release_date);
        
        return `
            <div class="movie-card" data-movie-id="${movie.id}">
                ${movie.vote_average >= 7.9 ? '<div class="recommendation">TOP</div>' : ''}
                <img class="movie-poster" src="${posterUrl}" alt="${movie.title}" loading="lazy">
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <p class="movie-year ${isNew ? 'new-release' : ''}">
                        ${releaseYear} ${isNew ? '<span class="new-badge">NOWY</span>' : ''} • 
                        <span class="genre-text ${isNew ? 'new-genre' : ''}">${this.getGenreNames(movie.genre_ids)}</span>
                    </p>
                    <div class="movie-rating">
                        ${this.generateStars(movie.vote_average)}
                        <span>${rating}/10</span>
                    </div>
                    <p class="movie-overview">${movie.overview || 'Brak opisu dostępnego.'}</p>
                </div>
            </div>
        `;
    }

    generateStars(rating) {
        const stars = Math.round(rating / 2);
        return Array.from({length: 5}, (_, i) => 
            `<span class="star">${i < stars ? '★' : '☆'}</span>`
        ).join('');
    }

    getGenreNames(genreIds) {
        if (!genreIds || genreIds.length === 0) return 'Nieznany';
        
        return genreIds.slice(0, 2)
            .map(id => this.genres[id] || 'Nieznany')
            .join(', ');
    }

    isNewMovie(releaseDate) {
        if (!releaseDate) return false;
        const movieDate = new Date(releaseDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return movieDate >= sixMonthsAgo && movieDate <= new Date();
    }

    // Movie saving
    saveMovie(movieId) {
        if (!this.savedMovies.includes(movieId)) {
            this.savedMovies.push(movieId);
            localStorage.setItem('savedMovies', JSON.stringify(this.savedMovies));
            this.savedMoviesCache = null; // Clear cache
            this.showNotification('Film dodany do zapisanych!');
        }
    }

    removeSavedMovie(movieId) {
        this.savedMovies = this.savedMovies.filter(id => id !== movieId);
        localStorage.setItem('savedMovies', JSON.stringify(this.savedMovies));
        this.savedMoviesCache = null; // Clear cache
        this.showNotification('Film usunięty z zapisanych!');
        
        if (this.currentGenre === 'saved') {
            this.loadSavedMovies();
        }
    }

    isMovieSaved(movieId) {
        return this.savedMovies.includes(parseInt(movieId));
    }

    // Modal functionality
    async showMovieModal(movieId) {
        try {
            const [movieDetails, credits] = await Promise.all([
                this.getMovieDetails(movieId),
                this.getMovieCredits(movieId)
            ]);
            this.createModal(movieDetails, credits);
        } catch (error) {
            console.error('Błąd podczas ładowania szczegółów filmu:', error);
        }
    }

    async getMovieDetails(movieId) {
        const response = await fetch(
            `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&language=pl-PL`
        );
        return await response.json();
    }

    async getMovieCredits(movieId) {
        const response = await fetch(
            `${this.baseUrl}/movie/${movieId}/credits?api_key=${this.apiKey}&language=pl-PL`
        );
        return await response.json();
    }

    createModal(movie, credits) {
        const posterUrl = movie.poster_path 
            ? `${this.imageBaseUrl}${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=Brak+plakatu';
        
        const releaseYear = movie.release_date 
            ? new Date(movie.release_date).getFullYear()
            : 'Nieznany';
        
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const cast = credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
        const runtime = movie.runtime ? `${movie.runtime} min` : 'Nieznane';
        const isSaved = this.isMovieSaved(movie.id);
        const isNew = this.isNewMovie(movie.release_date);
        
        const searchQuery = `${movie.title} ${releaseYear} online`;
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        const filmwebUrl = `https://www.filmweb.pl/search#/all?query=${movie.title} ${releaseYear}`;
        
        const modalHtml = `
            <div class="modal-overlay" id="movieModal">
                <div class="modal-content">
                    <button class="modal-close" id="closeModal">&times;</button>
                    
                    <div class="modal-header">
                        <img class="modal-poster" src="${posterUrl}" alt="${movie.title}">
                        <div class="modal-info">
                            <h2 class="modal-title">${movie.title}</h2>
                            <p class="modal-year ${isNew ? 'new-release' : ''}">
                                ${releaseYear} ${isNew ? '<span class="new-badge">NOWY</span>' : ''} / ${runtime}
                            </p>
                            <div class="modal-rating">
                                ${this.generateStars(movie.vote_average)}
                                <span>${rating}/10</span>
                                ${movie.vote_average >= 7.9 ? '<div class="recommendation">TOP</div>' : ''}
                            </div>
                            <div class="modal-section">
                                <p>${cast || 'Brak informacji o obsadzie'}</p>
                            </div>
                            ${movie.tagline ? `
                                <div class="modal-quote">
                                    <span class="quote-icon">💬</span>
                                    <p>"${movie.tagline}"</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>                    
                    <div class="modal-body">
                        <div class="modal-section">
                            <div class="description-container">
                                <p class="description-text">
                                    ${movie.overview || 'Brak opisu dostępnego.'}
                                </p>
                            </div>
                            <div class="modal-search-section">
                                <a href="${googleSearchUrl}" target="_blank" class="search-online-btn">
                                    <span class="search-icon">🔍</span>
                                    Szukaj
                                </a>
                                <a href="${filmwebUrl}" target="_blank" class="search-online-btn">
                                    <span class="search-icon">🎬</span>
                                    Filmweb
                                </a>
                                <a href="#" class="save-movie-btn ${isSaved ? 'saved' : ''}" data-movie-id="${movie.id}">
                                    <span class="save-icon">${isSaved ? '▶️' : '💾'}</span>
                                    ${isSaved ? '' : 'Zapisz'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Event listeners
        document.getElementById('closeModal').addEventListener('click', this.closeModal);
        document.getElementById('movieModal').addEventListener('click', (e) => {
            if (e.target.id === 'movieModal') this.closeModal();
        });
        
        document.querySelector('.save-movie-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleSaveMovie(e.currentTarget, parseInt(e.currentTarget.dataset.movieId));
        });
        
        setTimeout(() => {
            document.getElementById('movieModal').classList.add('active');
        }, 10);
    }

    toggleSaveMovie(button, movieId) {
        const isSaved = this.isMovieSaved(movieId);
        
        if (isSaved) {
            this.removeSavedMovie(movieId);
            button.innerHTML = '<span class="save-icon">💾</span>Zapisz';
            button.classList.remove('saved');
        } else {
            this.saveMovie(movieId);
            button.innerHTML = '<span class="save-icon">▶️</span>';
            button.classList.add('saved');
        }
    }

    closeModal() {
        const modal = document.getElementById('movieModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // Toggle search input
    toggleSearchInput(show = true) {
        const searchContainer = document.querySelector('.search-container');
        const searchInput = document.getElementById('searchInput');
        
        if (!searchContainer) return;
        
        if (show) {
            searchContainer.classList.remove('hidden');
            searchContainer.classList.add('visible');
            searchInput.disabled = false;
            searchInput.placeholder = 'Wyszukaj filmy, aktorów, lata...';
            setTimeout(() => {
                searchInput.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    searchInput.style.transform = 'scale(1)';
                }, 150);
            }, 200);
            
        } else {
            searchContainer.classList.remove('visible');
            searchContainer.classList.add('hidden');
            searchInput.value = '';
            searchInput.disabled = true;
            this.currentQuery = '';
            this.isSearchMode = false;
            
            searchInput.style.transform = 'scale(0.98)';
            setTimeout(() => {
                searchInput.style.transform = 'scale(1)';
            }, 300);
        }
    }

    // UI helpers
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-primary);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showNoResults() {
        document.getElementById('moviesContainer').innerHTML = `
            <div class="no-results">
                <h3>Brak wyników</h3>
                <p>Spróbuj zmienić kryteria wyszukiwania lub wybierz inny gatunek.</p>
            </div>
        `;
    }

    showNoSavedMovies() {
        document.getElementById('moviesContainer').innerHTML = `
            <div class="no-results">
                <h3>Brak zapisanych filmów</h3>
                <p>Dodaj filmy do ulubionych klikając na przycisk "Zapisz" w szczegółach filmu.</p>
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

    updatePagination() {
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        pageInfo.textContent = `Strona ${this.currentPage}`;
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages;
    }
}

// Initialize
const movieSystem = new MovieRecommendationSystem();