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
        this.savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
        this.currentlySavedMovies = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPopularMovies();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');        
        const headerTitle = document.querySelector('h1');

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                const query = e.target.value.trim();

                if (query && query.trim() !== '') {
                    this.isSearchMode = true;
                    this.currentQuery = query;
                    if (this.currentGenre === 'saved') {
                        this.loadSavedMovies();
                    } else if (query.includes(' ') || /\d/.test(query)) {
                        this.smartSearch(query, this.currentPage);
                    } else {
                        this.searchMoviesByGenre(query, this.currentGenre);
                    }
                } else {
                    this.isSearchMode = false;
                    this.currentQuery = '';
                    // Check genre to show all saved movies
                    if (this.currentGenre === 'saved') {
                        this.loadSavedMovies(); // Show all saved movies without filtering
                    } else {
                        this.loadMoviesByGenre(this.currentGenre);
                    }   
                }
            }, 500);
        });

        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPage = 1;
                this.currentGenre = e.target.dataset.genre;
                if (this.currentGenre === 'saved') {
                    this.loadSavedMovies();
                }   
                else if (this.isSearchMode && this.currentQuery) {
                    if (this.allSearchResults && this.allSearchResults.length > 0) {
                        let filteredResults = this.allSearchResults;
                
                        if (this.currentGenre !== 'all') {
                            filteredResults = this.allSearchResults.filter(movie => 
                            movie.genre_ids && movie.genre_ids.includes(parseInt(this.currentGenre)));
                        }
                
                        if (filteredResults.length === 0) {
                            this.showNoResults();
                            return;
                        }
                
                        this.displayMovies(filteredResults);
                        this.totalPages = Math.ceil(filteredResults.length / 20);
                        this.updatePagination();
                    }  
                    else {
                        this.searchMoviesByGenre(this.currentQuery, this.currentGenre);
                    }
                } 
                else {
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

        if (headerTitle) {
            headerTitle.addEventListener('click', () => {
            window.location.reload();
            });
            headerTitle.style.cursor = 'pointer';
        }
    }

    async loadCurrentSearch() {
        switch (this.currentSearchType) {
            case 'smart':
                await this.smartSearch(this.currentQuery, this.currentPage);
                break;
            case 'searchGenre': 
                await this.searchMoviesByGenre(this.currentQuery, this.currentGenre, this.currentPage);
                break;
            case 'genre':
                await this.loadMoviesByGenre(this.currentGenre, this.currentPage);
                break;
            case 'saved':
                await this.loadSavedMovies();
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
            this.totalPages = Math.min(data.total_pages, 1000);
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
            this.totalPages = Math.min(data.total_pages, 1000);
            this.allMovies = data.results;
            this.displayMovies(data.results);
            this.updatePagination();
        } catch (error) {
            console.error('Błąd podczas ładowania filmów:', error);
            this.showError();
        }
    }

    async loadSavedMovies() {
        this.currentSearchType = 'saved';
        this.showLoading();
        if (this.savedMovies.length === 0) {
            this.showNoSavedMovies();
            this.totalPages = 1;
            this.updatePagination();
            return;
        }
        try {
            if (!this.currentlySavedMovies || this.currentlySavedMovies.length === 0) {
                const movieDetails = [];
                for (const movieId of this.savedMovies) {
                    const response = await fetch(`${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&language=pl-PL`);
                    const movie = await response.json();
                    movieDetails.push(movie);
                }
                this.currentlySavedMovies = movieDetails;
            }

            let filteredMovies = this.currentlySavedMovies;
        
            if (this.isSearchMode && this.currentQuery && this.currentQuery.trim()) {
                const query = this.currentQuery.toLowerCase();
                filteredMovies = this.currentlySavedMovies.filter(movie => 
                    (movie.title && movie.title.toLowerCase().includes(query)) ||
                    (movie.overview && movie.overview.toLowerCase().includes(query))
                );
            }

            const moviesPerPage = 20;
            this.totalPages = Math.ceil(filteredMovies.length / moviesPerPage);        
            const startIndex = (this.currentPage - 1) * moviesPerPage;
            const endIndex = startIndex + moviesPerPage;
            const paginatedMovies = filteredMovies.slice(startIndex, endIndex);

            this.displayMovies(paginatedMovies);
            this.updatePagination();
        } catch (error) {
            console.error('Błąd podczas ładowania zapisanych filmów:', error);
            this.showError();
        }
    }

    // Saved movie
    saveMovie(movieId) {
        if (!this.savedMovies.includes(movieId)) {
            this.savedMovies.push(movieId);
            localStorage.setItem('savedMovies', JSON.stringify(this.savedMovies));
            this.showNotification('Film dodany do zapisanych!');
        }
    }

    removeSavedMovie(movieId) {
        this.savedMovies = this.savedMovies.filter(id => id !== movieId);
        localStorage.setItem('savedMovies', JSON.stringify(this.savedMovies));
        this.showNotification('Film usunięty z zapisanych!');
        this.currentlySavedMovies = [];

        if (this.currentGenre === 'saved') {
            this.loadSavedMovies();
        }
    }

    isMovieSaved(movieId) {
        return this.savedMovies.includes(parseInt(movieId));
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background:var(--accent-primary);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `   ;
    
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showNoSavedMovies() {
        document.getElementById('moviesContainer').innerHTML = `
            <div class="no-results">
                <h3>Brak zapisanych filmów</h3>
                <p>Dodaj filmy do ulubionych klikając na przycisk "Zapisz" w szczegółach filmu.</p>
            </div>
        `   ;
    }

    async searchMoviesByGenre(query, genreId, page = 1) {
        this.currentSearchType = 'searchGenre'; 
        this.showLoading();
    
        try {
            let url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&language=pl-PL&query=${encodeURIComponent(query)}&page=${page}`;
        
            const response = await fetch(url);
            const data = await response.json();       
            this.allSearchResults = data.results;        
            let filteredResults = data.results;
        
            if (genreId !== 'all') {
                filteredResults = data.results.filter(movie => 
              movie.genre_ids && movie.genre_ids.includes(parseInt(genreId)));
            }
        
            if (filteredResults.length === 0) {
                this.showNoResults();
                return;
            }
        
            this.totalPages = Math.ceil(filteredResults.length / 20);
            this.displayMovies(filteredResults);
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
                            allMovies.push({...movie, searchScore: 3}); 
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
                        allMovies.push({...movie, searchScore: 2});
                    } else {
                        // Increase score for videos found by multiple criteria
                        const existingMovie = allMovies.find(m => m.id === movie.id);
                        if (existingMovie) existingMovie.searchScore += 2;
                    }
                });
            }
        
            // Filtering by genres
            if (parsed.genres.length > 0) {
                allMovies = allMovies.filter(movie => {
                    return parsed.genres.some(genre => 
                        movie.genre_ids && movie.genre_ids.includes(genre)
                    );
                });
            }
        
            // Filtering by years
            if (parsed.years.length > 0) {
                allMovies = allMovies.filter(movie => {
                    if (!movie.release_date) return false;
                    const movieYear = new Date(movie.release_date).getFullYear();
                    return parsed.years.includes(movieYear);
                });
            }
        
            // Sorting by search result and popularity
            allMovies.sort((a, b) => {
                if (a.searchScore !== b.searchScore) {
                    return b.searchScore - a.searchScore;
                }
                return b.popularity - a.popularity;
            });
        
            // Fallback to regular search
            if (allMovies.length === 0) {
                await this.searchMovies(query, page);
                return;
            }
        
            const moviesPerPage = 20;
            const startIndex = (page - 1) * moviesPerPage;
            const endIndex = startIndex + moviesPerPage;
            const paginatedMovies = allMovies.slice(startIndex, endIndex);
            this.totalPages = Math.ceil(allMovies.length / moviesPerPage);
        
            this.allSearchResults = allMovies; 
            this.displayMovies(paginatedMovies);
            this.updatePagination(); 
        
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

        if (this.currentPage === 1) {
            movies.sort((a, b) => {
            // Check the title
                if (this.currentQuery && this.isSearchMode) {
                    const queryLower = this.currentQuery.toLowerCase();
                    const titleA = a.title.toLowerCase();
                    const titleB = b.title.toLowerCase();
            
                    // Categorize optimal
                    const getMatchType = (title) => {
                        if (title === queryLower) return 3; 
                        if (title.startsWith(queryLower)) return 2; 
                        if (title.includes(queryLower)) return 1; 
                        return 0; 
                    };
            
                    const matchA = getMatchType(titleA);
                    const matchB = getMatchType(titleB);
            
                    // If different match type, sort by type
                    if (matchA !== matchB) {
                        return matchB - matchA;
                    }
            
                    // If same match type, sort by popularity, then ratings
                    if (matchA > 0 && matchB > 0) {
                        if (Math.abs(b.popularity - a.popularity) > 50) {
                            return b.popularity - a.popularity;
                        }
                        return b.vote_average - a.vote_average;
                    }
                }
        
                // For regular browsing or when there are no title matches
                if (Math.abs(b.popularity - a.popularity) > 50) {
                    return b.popularity - a.popularity;
                }
                return b.vote_average - a.vote_average;
            });
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
                    ${movie.vote_average >= 7.9 ? '<div class="recommendation">TOP</div>' : ''}
                    <img class="movie-poster" src="${posterUrl}" alt="${movie.title}" loading="lazy">
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title}</h3>
                        <p class="movie-year ${this.isNewMovie(movie.release_date) ? 'new-release' : ''}">
                            ${releaseYear} ${this.isNewMovie(movie.release_date) ? '<span class="new-badge">NOWY</span>' : ''} • 
                            <span class="genre-text ${this.isNewMovie(movie.release_date) ? 'new-genre' : ''}">${this.getGenreNames(movie.genre_ids)}</span>
                        </p>
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

    isNewMovie(releaseDate) {
        if (!releaseDate) return false;   
        const movieDate = new Date(releaseDate);
        const currentDate = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
    
        return movieDate >= sixMonthsAgo && movieDate <= currentDate;
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
        const filmwebUrl = `https://www.filmweb.pl/search#/all?query=${movie.title} ${releaseYear}`;
        const isSaved = this.isMovieSaved(movie.id);
    
        const modalHtml = `
            <div class="modal-overlay" id="movieModal">
                <div class="modal-content">
                    <button class="modal-close" id="closeModal">&times;</button>
                
                    <div class="modal-header">
                        <img class="modal-poster" src="${posterUrl}" alt="${movie.title}">
                        <div class="modal-info">
                            <h2 class="modal-title">${movie.title}</h2>
                            <p class="modal-year"><p class="movie-year ${this.isNewMovie(movie.release_date) ? 'new-release' : ''}">
                            ${releaseYear} ${this.isNewMovie(movie.release_date) ? '<span class="new-badge">NOWY</span>' : ''} 
                         / ${runtime}</p>
                            <div class="modal-rating">
                                ${stars}
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
                                <button class="save-movie-btn ${isSaved ? 'saved' : ''}" data-movie-id="${movie.id}">
                                    <span class="save-icon">${isSaved ? '❤️' : '▶️'}</span>
                                    ${isSaved ? '' : 'Zapisz'}
                                </button>
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
        document.querySelector('.save-movie-btn').addEventListener('click', (e) => {
            const button = e.currentTarget;
            const movieId = parseInt(button.dataset.movieId);
            const isSaved = this.isMovieSaved(movieId);
    
            if (isSaved) {
                this.removeSavedMovie(movieId);
                button.innerHTML = '<span class="save-icon">▶️</span>Zapisz';
                button.classList.remove('saved');
            } else {
                this.saveMovie(movieId);
                button.innerHTML = '<span class="save-icon">❤️</span>';
                button.classList.add('saved');
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