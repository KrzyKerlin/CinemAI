const ICONS = {
    film: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="6" r="1.2"/><circle cx="17" cy="9" r="1.2"/><circle cx="17" cy="15" r="1.2"/><circle cx="12" cy="18" r="1.2"/><circle cx="7" cy="15" r="1.2"/><circle cx="7" cy="9" r="1.2"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    bookmarkFilled: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><polygon points="10,9 10,15 15,12" fill="currentColor" stroke="none"/></svg>',
    quote: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    chevronUp: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    starFilled: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><path d="M12 2 15 8.5 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 8.5 12 2Z"/></svg>',
    starEmpty: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2 15 8.5 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 8.5 12 2Z"/></svg>'
};

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
        this.scrollToTop();
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
            const moviesGrid = document.querySelector('.movies-grid');
            if (moviesGrid) {
                moviesGrid.classList.add('no-animation');
            }
            await this.loadCurrentSearch();
            const container = document.getElementById('moviesContainer');
            window.scrollTo({
                top: container.offsetTop - 20, behavior: 'smooth'
            });
            setTimeout(() => {
                if (moviesGrid) {
                        moviesGrid.classList.remove('no-animation');
                }
            }, 500);
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
            let movies = await this.smartSearch(query);

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

    async basicSearch(query, page = 1, year = null) {
        const params = new URLSearchParams({
            api_key: this.apiKey,
            language: 'pl-PL',
            query,
            page
        });
        if (year) params.set('primary_release_year', year);

        const response = await fetch(`${this.baseUrl}/search/movie?${params}`);
        const data = await response.json();
        return data.results || [];
    }

    async smartSearch(query) {
        const { titleQuery, genreId, year } = this.parseQuery(query);
        const movieIds = new Set();
        let movies = [];

        if (titleQuery) {
            // Title match is always the primary signal — a movie title stays a movie
            // title even when it happens to share a word with someone's name.
            const titleMovies = await this.basicSearch(titleQuery, 1, year);
            titleMovies.forEach(movie => {
                if (!movieIds.has(movie.id)) {
                    movieIds.add(movie.id);
                    movies.push({ ...movie, searchScore: this.getTitleMatchScore(movie.title, titleQuery) + 2 });
                }
            });

            // Only chase a person match when the leftover text actually looks like a
            // name, and only for actors/directors — this replaces the old behaviour
            // of firing a separate actor search per word, which let a single common
            // word in a title flood the results with an unrelated filmography.
            if (this.looksLikePersonName(titleQuery)) {
                const persons = await this.searchPersons(titleQuery);
                const relevant = persons
                    .filter(p => p.known_for_department === 'Acting' || p.known_for_department === 'Directing')
                    .slice(0, 2);

                for (const person of relevant) {
                    const personMovies = await this.getMoviesByPerson(person.id);
                    personMovies.forEach(movie => {
                        if (movieIds.has(movie.id)) {
                            const existing = movies.find(m => m.id === movie.id);
                            if (existing) existing.searchScore += 1;
                        } else {
                            movieIds.add(movie.id);
                            movies.push({ ...movie, searchScore: 1 });
                        }
                    });
                }
            }
        } else if (genreId || year) {
            // Query was pure genre/year keywords ("komedia 2020") with nothing left
            // to search by title — browse instead of searching.
            movies = await this.discoverMovies(genreId, year);
        }

        if (genreId) {
            movies = movies.filter(movie => movie.genre_ids?.includes(genreId));
        }
        if (year && titleQuery) {
            movies = movies.filter(movie => {
                if (!movie.release_date) return false;
                return new Date(movie.release_date).getFullYear() === year;
            });
        }

        return movies.sort((a, b) => {
            if (a.searchScore !== b.searchScore) return b.searchScore - a.searchScore;
            return b.popularity - a.popularity;
        });
    }

    looksLikePersonName(text) {
        const words = text.trim().split(/\s+/);
        return words.length <= 4 && /^[\p{L}\s.'-]+$/u.test(text);
    }

    parseQuery(query) {
        const words = query.trim().split(/\s+/).filter(Boolean);
        let genreId = null;
        let year = null;
        const titleWords = [];

        words.forEach(word => {
            if (/^(19|20)\d{2}$/.test(word)) {
                year = parseInt(word);
            } else if (this.genreKeywords[word.toLowerCase()]) {
                genreId = this.genreKeywords[word.toLowerCase()];
            } else {
                titleWords.push(word);
            }
        });

        return { titleQuery: titleWords.join(' '), genreId, year };
    }

    async discoverMovies(genreId, year) {
        const params = new URLSearchParams({
            api_key: this.apiKey,
            language: 'pl-PL',
            sort_by: 'popularity.desc'
        });
        if (genreId) params.set('with_genres', genreId);
        if (year) params.set('primary_release_year', year);

        const response = await fetch(`${this.baseUrl}/discover/movie?${params}`);
        const data = await response.json();
        return (data.results || []).map(movie => ({ ...movie, searchScore: 0 }));
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
            const acting = data.cast || [];
            const directing = (data.crew || []).filter(credit => credit.job === 'Director');
            return [...acting, ...directing];
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
            `<span class="star">${i < stars ? ICONS.starFilled : ICONS.starEmpty}</span>`
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
                    <button class="modal-close" id="closeModal">${ICONS.close}</button>
                    
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
                                    <span class="quote-icon">${ICONS.quote}</span>
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
                                    <span class="search-icon">${ICONS.search}</span>
                                    Szukaj
                                </a>
                                <a href="${filmwebUrl}" target="_blank" class="search-online-btn">
                                    <span class="search-icon">${ICONS.play}</span>
                                    Filmweb
                                </a>
                                <a href="#" class="save-movie-btn ${isSaved ? 'saved' : ''}" data-movie-id="${movie.id}">
                                    <span class="save-icon">${isSaved ? ICONS.bookmarkFilled : ICONS.bookmark}</span>
                                    ${isSaved ? 'Zapisano' : 'Zapisz'}
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
            button.innerHTML = `<span class="save-icon">${ICONS.bookmark}</span>Zapisz`;
            button.classList.remove('saved');
        } else {
            this.saveMovie(movieId);
            button.innerHTML = `<span class="save-icon">${ICONS.bookmarkFilled}</span>Zapisano`;
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

    scrollToTop() {
        const btn = document.createElement('button');
        btn.innerHTML = ICONS.chevronUp;
        btn.id = 'scrollToTopBtn';
        btn.className = 'scroll-btn-hidden';
        document.body.appendChild(btn);
    
        let visible = false;
        window.addEventListener('scroll', () => {
            const show = window.scrollY > 300;
            if (show !== visible) {
                visible = show;
                btn.className = show ? 'scroll-btn-visible' : 'scroll-btn-hidden';
            }
        });
    
        btn.onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});
    }
}

// Initialize
const movieSystem = new MovieRecommendationSystem();