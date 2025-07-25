PL 
# CinemAI
Znajdż filmy, które Ciebie interesują. Aplikacja webowa w języku polskim do wyszukiwania i zarządzania filmami z wykorzystaniem API The Movie Database (TMDb). Zbudowana w czystym HTML, CSS i JavaScript bez zewnętrznych frameworków. 

## Inteligentne Wyszukiwanie. Funkcje i Zapisywanie Filmów
Wyszukiwanie podstawowe i zaawansowane - np. po tytule, po aktorach itp. <br />
Filtrowanie po gatunkach filmowych <br />
Filtrowanie wyników - według popularności i ocen <br />
Dodawanie i przeglądanie zapisanych filmów <br />
Debouncing - optymalizacja zapytań API <br />

## Informacje o konkretnym filmie
Plakaty filmów w wysokiej rozdzielczości <br />
Oceny użytkowników i system gwiazdek <br />
Informacje o obsadzie i ekipie <br />
Linki do Filmweb i Google (do szybkiego wyszukiwania) <br />
Oznaczenia nowych filmów <br /> 
Rekomendacje TOP dla najlepszych filmów <br />

## Prosty Interfejs Użytkownika
Responsywny design <br />
Animacje - płynne przejścia i efekty hover <br />
Modalne okna - szczegółowe informacje o filmach <br />
Paginacja - sprawne przeglądanie wyników <br />

## Technologie
Frontend: HTML5, CSS3, JavaScript (ES6+) <br />
API: The Movie Database (TMDb) <br />
Lokalny Storage: Zapisywanie ulubionych filmów <br />
Responsive: Mobile-first design <br />

## Instalacja
1. Sklonuj repozytorium <br />
2. Uzyskaj klucz API TMDb <br />
3. Skonfiguruj API <br />
4. Stwórz plik config.js w katalogu <br />
Plik `config.js` przeznaczony jest do przechowywania klucza API TMDB. **Ten plik NIE jest dodawany do repozytorium - znajduje się w .gitignore**.
// config.js
```js
const CONFIG = {
TMDB_API_KEY: 'TWOJ_KLUCZ'
};
```
5. Uruchom aplikację <br />
<br />

🇬🇧 
# CinemAI
Find movies that interest you. A Polish-language web application for searching and managing movies using The Movie Database (TMDb) API. Built with pure HTML, CSS, and JavaScript without external frameworks.

## Inteligentne Wyszukiwanie. Funkcje i Zapisywanie Filmów
Basic and advanced search - e.g. by title, by actors, etc. <br />
Filter by movie genres <br />
Result filtering - by popularity and ratings <br />
Add and browse saved movies <br />
Debouncing - API query optimization <br />

## Specific Movie Information
High-resolution movie posters <br />
User ratings and star system <br />
Cast and crew information <br />
Links to Filmweb and Google (for quick searching) <br />
New movie labels <br />
TOP recommendations for best movies <br />

## Simple User Interface
Responsive design
Animations - smooth transitions and hover effects
Modal windows - detailed movie information
Pagination - efficient result browsing

## Technologies
Frontend: HTML5, CSS3, JavaScript (ES6+) <br />
API: The Movie Database (TMDb) <br />
Local Storage: Saving favorite movies <br />
Responsive: Mobile-first design <br />

## Installation
1. Clone the repository <br />
2. Get TMDb API key <br />
3. Configure API <br />
4. Create config.js file in directory <br />
The config.js file is designed to store the TMDB API key. **This file is NOT added to the repository - it's included in .gitignore**
js// config.js
```js
const CONFIG = {
    TMDB_API_KEY: 'YOUR_KEY'
};
```
5. Run the application <br />


<br />
LIVE DEMO: https://krzykerlin.github.io/CinemAI/
