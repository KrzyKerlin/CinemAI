class MovieRecommendationSystem {
    constructor() {
        this.apiKey = CONFIG.TMDB_API_KEY; // Real key in config.js file
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
        this.allMovies = [];
        this.currentGenre = 'all';
        this.currentPage = 1;
        this.totalPages = 1;
        this.currentSearchType = 'popular'; 
        this.currentQuery = '';
        this.isSearchMode = false;
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
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                const query = e.target.value.trim();

                if (query) {
                    this.isSearchMode = true;
                    this.currentQuery = query;
                    this.searchMoviesByGenre(query, this.currentGenre);
                } else {
                    this.isSearchMode = false;
                    this.currentQuery = '';
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
                this.currentPage = 1;
                this.currentGenre = e.target.dataset.genre;
                if (this.isSearchMode && this.currentQuery) {
                    this.searchMoviesByGenre(this.currentQuery, this.currentGenre);
                } else {
                this.loadMoviesByGenre(this.currentGenre);
                }
            });
        });

        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadCurrentSearch();
                }
        });

        nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadCurrentSearch();
            }
        });
    }

    async loadCurrentSearch() {
        switch (this.currentSearchType) {
            case 'search':
                await this.searchMovies(this.currentQuery, this.currentPage);
                break;
            case 'searchGenre': 
                await this.searchMoviesByGenre(this.currentQuery, this.currentGenre, this.currentPage);
                break;
            case 'genre':
                await this.loadMoviesByGenre(this.currentGenre, this.currentPage);
                break;
            default:
                await this.loadPopularMovies(this.currentPage);
        }
    }

    async loadPopularMovies(page = 1) {
        this.currentSearchType = 'popular';
        try {
            const response = await fetch(
                `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=pl-PL&page=${page}`
            );
            const data = await response.json();
            this.totalPages = Math.min(data.total_pages, 100);
            this.allMovies = data.results;
            this.displayMovies(data.results);
            this.updatePagination();
        } catch (error) {
            console.error('Błąd podczas ładowania filmów:', error);
            this.showError();
        }
    }

    async loadMoviesByGenre(genreId, page = 1) {
        this.currentSearchType = 'genre'; 
        this.showLoading();
        try {
            let url;
            if (genreId === 'all') {
                url = `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&language=pl-PL&page=${page}`;
            } else {
                url = `${this.baseUrl}/discover/movie?api_key=${this.apiKey}&language=pl-PL&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`;
            }
        
            const response = await fetch(url);
            const data = await response.json();
            this.totalPages = Math.min(data.total_pages, 100);
            this.allMovies = data.results;
            this.displayMovies(data.results);
            this.updatePagination();
        } catch (error) {
            console.error('Błąd podczas ładowania filmów:', error);
            this.showError();
        }
    }

    async searchMoviesByGenre(query, genreId, page = 1) {
        this.currentSearchType = 'searchGenre'; 
        this.showLoading();
    
        try {
            let url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&language=pl-PL&query=${encodeURIComponent(query)}&page=${page}`;
        
            const response = await fetch(url);
            const data = await response.json();
        
            let filteredResults = data.results;
        
            if (genreId !== 'all') {
                filteredResults = data.results.filter(movie => 
                movie.genre_ids && movie.genre_ids.includes(parseInt(genreId)));
            }
        
            if (filteredResults.length === 0) {
                this.showNoResults();
                return;
            }
        
            this.totalPages = Math.min(data.total_pages, 100);
            this.displayMovies(filteredResults);
            this.updatePagination();
        } catch (error) {
            console.error('Błąd podczas wyszukiwania:', error);
            this.showError();
        }
    }

    async searchMovies(query, page=1) {
        this.currentSearchType = 'search';
        this.currentQuery = query;
        this.showLoading();
        try {
            const response = await fetch(
                `${this.baseUrl}/search/movie?api_key=${this.apiKey}&language=pl-PL&query=${encodeURIComponent(query)}&page=${page}`
            );
            const data = await response.json();
                    
            if (data.results.length === 0) {
                this.showNoResults();
                return;
            }
            this.totalPages = Math.min(data.total_pages, 100);
            this.displayMovies(data.results);
            this.updatePagination();
        } catch (error) {
            console.error('Błąd podczas wyszukiwania:', error);
            this.showError();
        }
    }

    parseSmartQuery(query) {
        const words = query.toLowerCase().split(' ').filter(word => word.length > 0);
        const parsed = {
            actors: [],
            genres: [],
            years: [],
            titles: [],
            moods: []
        };

        const genreKeywords = {
            'komedia': 35, 'akcja': 28, 'dramat': 18, 'horror': 27, 'thriller': 53,
            'romans': 10749, 'scifi': 878, 'fantasy': 14, 'animacja': 16, 'kryminał': 80,
            'przygoda': 12, 'dokumentalny': 99, 'familijny': 10751, 'historyczny': 36,
            'muzyczny': 10402, 'tajemnica': 9648, 'wojenny': 10752, 'western': 37
        };

        const moodKeywords = {
            'wesoły': ['komedia', 'familijny'], 'smutny': ['dramat'], 'straszny': ['horror'],
            'romantyczny': ['romans'], 'akcyjny': ['akcja'], 'futurystyczny': ['scifi'],
            'magiczny': ['fantasy'], 'dziecięcy': ['animacja', 'familijny']
        };

        words.forEach(word => {
            if (/^\d{4}$/.test(word) && parseInt(word) >= 1900 && parseInt(word) <= 2025) {
                parsed.years.push(parseInt(word));
            }
            else if (genreKeywords[word]) {
                parsed.genres.push(genreKeywords[word]);
            }
            else if (moodKeywords[word]) {
                moodKeywords[word].forEach(genre => {
                    if (genreKeywords[genre]) {
                        parsed.genres.push(genreKeywords[genre]);
                    }
                });
            }
            else {
                parsed.actors.push(word);
                parsed.titles.push(word);
            }
        });

        return parsed;
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

    async smartSearch(query, page = 1) {
        this.currentSearchType = 'smart';
        this.currentQuery = query;
        this.showLoading();
        try {
            const parsed = this.parseSmartQuery(query);
            let allMovies = [];
            let movieIds = new Set();
        
            // Search by actors
            for (const actorQuery of parsed.actors) {
                const persons = await this.searchPersons(actorQuery);
                for (const person of persons.slice(0, 3)) {
                    const personMovies = await this.getMoviesByPerson(person.id);
                    personMovies.forEach(movie => {
                        if (!movieIds.has(movie.id)) {
                            movieIds.add(movie.id);
                            allMovies.push(movie); 
                        }
                    });
                }
            }
        
            // Search by titles
            if (parsed.titles.length > 0) {
                const titleQuery = parsed.titles.join(' ');
                const response = await fetch(
                    `${this.baseUrl}/search/movie?api_key=${this.apiKey}&language=pl-PL&query=${encodeURIComponent(titleQuery)}`
                );
                const data = await response.json();
            
                data.results.forEach(movie => {
                    if (!movieIds.has(movie.id)) {
                        movieIds.add(movie.id);
                        allMovies.push(movie);
                    }
                });
            }
                
            this.displayMovies(allMovies);
        
        } catch (error) {
            console.error('Błąd podczas inteligentnego wyszukiwania:', error);
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
                <div class="movie-card" data-movie-id="${movie.id}">
                    <img class="movie-poster" src="${posterUrl}" alt="${movie.title}" loading="lazy">
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title}</h3>
                        <p class="movie-year">${releaseYear} • ${this.getGenreNames(movie.genre_ids)}</p>
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
        container.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const movieId = e.currentTarget.dataset.movieId;
                this.showMovieModal(movieId);
            });
        });
    }

    generateStars(rating) {
        const stars = Math.round(rating / 2);
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            starsHtml += `<span class="star">${i < stars ? '★' : '☆'}</span>`;
        }
        return starsHtml;
    }

    getGenreNames(genreIds) {
        const genres = {
            28: 'Akcja',
            12: 'Przygoda',
            16: 'Animacja',
            35: 'Komedia',
            80: 'Kryminał',
            99: 'Dokumentalny',
            18: 'Dramat',
            10751: 'Familijny',
            14: 'Fantasy',
            36: 'Historyczny',
            27: 'Horror',
            10402: 'Muzyczny',
            9648: 'Tajemnica',
            10749: 'Romans',
            878: 'Sci-Fi',
            10770: 'Film TV',
            53: 'Thriller',
            10752: 'Wojenny',
            37: 'Western'
        };
    
        if (!genreIds || genreIds.length === 0) {
            return 'Nieznany';
        }
    
        const genreNames = genreIds.slice(0, 2).map(id => genres[id] || 'Nieznany');
        return genreNames.join(', ');
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
        pageInfo.textContent = `Strona ${this.currentPage} z ${this.totalPages}`;
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages;
    }

    async showMovieModal(movieId) {
        try {
            const movieDetails = await this.getMovieDetails(movieId);
            const credits = await this.getMovieCredits(movieId);
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
        const stars = this.generateStars(movie.vote_average);   
        const cast = credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
        const runtime = movie.runtime ? `${movie.runtime} min` : 'Nieznane';

        const searchQuery = `${movie.title} ${releaseYear} online`;
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
        const modalHtml = `
            <div class="modal-overlay" id="movieModal">
                <div class="modal-content">
                    <button class="modal-close" id="closeModal">&times;</button>
                
                    <div class="modal-header">
                        <img class="modal-poster" src="${posterUrl}" alt="${movie.title}">
                        <div class="modal-info">
                            <h2 class="modal-title">${movie.title}</h2>
                            <p class="modal-year">${releaseYear} / ${runtime}</p>
                            <div class="modal-rating">
                                ${stars}
                                <span>${rating}/10</span>
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
                                        Szukaj online
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    
        document.getElementById('closeModal').addEventListener('click', this.closeModal);
        document.getElementById('movieModal').addEventListener('click', (e) => {
            if (e.target.id === 'movieModal') {
                this.closeModal();
            }
        });
        setTimeout(() => {
            document.getElementById('movieModal').classList.add('active');
        }, 10);
    }

    closeModal() {
        const modal = document.getElementById('movieModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
}

const movieSystem = new MovieRecommendationSystem();