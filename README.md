PL 
# CinemAI
Znajdż filmy, które Ciebie interesują. Aplikacja webowa w języku polskim do wyszukiwania i zarządzania filmami z wykorzystaniem API The Movie Database (TMDb). Zbudowana w czystym HTML, CSS i JavaScript bez zewnętrznych frameworków. 

## Inteligentne Wyszukiwanie. Funkcje i Zapisywanie Filmów
Wyszukiwanie podstawowe - po tytule filmu
Wyszukiwanie zaawansowane - po aktorach, gatunkach, latach
Filtrowanie po gatunkach filmowych
Filtrowanie wyników - według popularności i ocen
Dodawanie i przeglądanie zapisanych filmów
Debouncing - optymalizacja zapytań API

## Informacje o konkretnym filmie
Plakaty filmów w wysokiej rozdzielczości
Oceny użytkowników i system gwiazdek
Informacje o obsadzie i ekipie
Linki do Filmweb i Google (do szybkiego wyszukiwania)
Oznaczenia nowych filmów
Rekomendacje TOP dla najlepszych filmów

## Prosty Interfejs Użytkownika
Responsywny design
Animacje - płynne przejścia i efekty hover
Modalne okna - szczegółowe informacje o filmach
Paginacja - sprawne przeglądanie wyników
Scroll to top - szybki powrót na górę

## Technologie
Frontend: HTML5, CSS3, JavaScript (ES6+)
API: The Movie Database (TMDb) 
Lokalny Storage: Zapisywanie ulubionych filmów
Responsive: Mobile-first design

## Instalacja
1. Sklonuj repozytorium
2. Uzyskaj klucz API TMDb
3. Skonfiguruj API
4. Stwórz plik config.js w katalogu
Plik `config.js` przeznaczony jest do przechowywania klucza API TMDB. **Ten plik NIE jest dodawany do repozytorium - znajduje się w .gitignore**.
// config.js
```js
const CONFIG = {
TMDB_API_KEY: 'TWOJ_KLUCZ'
};
```
5. Uruchom aplikację


🇬🇧 
# CinemAI
Find movies that interest you. A Polish-language web application for searching and managing movies using The Movie Database (TMDb) API. Built with pure HTML, CSS, and JavaScript without external frameworks.

## Inteligentne Wyszukiwanie. Funkcje i Zapisywanie Filmów
Basic search - by movie title
Advanced search - by actors, genres, years
Filter by movie genres
Result filtering - by popularity and ratings
Add and browse saved movies
Debouncing - API query optimization

## Specific Movie Information
High-resolution movie posters
User ratings and star system
Cast and crew information
Links to Filmweb and Google (for quick searching)
New movie labels
TOP recommendations for best movies

## Simple User Interface
Responsive design
Animations - smooth transitions and hover effects
Modal windows - detailed movie information
Pagination - efficient result browsing
Scroll to top - quick return to top

## Technologies
Frontend: HTML5, CSS3, JavaScript (ES6+)
API: The Movie Database (TMDb)
Local Storage: Saving favorite movies
Responsive: Mobile-first design

## Installation
1. Clone the repository
2. Get TMDb API key
3. Configure API
4. Create config.js file in directory
The config.js file is designed to store the TMDB API key. **This file is NOT added to the repository - it's included in .gitignore**
js// config.js
```js
const CONFIG = {
    TMDB_API_KEY: 'YOUR_KEY'
};
```
5. Run the application
