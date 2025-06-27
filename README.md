# CinemAI
Znajdż filmy, które Ciebie interesują 
Find or discover your movies

## Konfiguracja API – `config.js`
Projekt wykorzystuje plik `config.js` do przechowywania klucza API TMDB. **Ten plik NIE jest dodawany do repozytorium**.
### Krok 1: Skąd wziąć klucz?
Zarejestruj się lub zaloguj na The Movie Database (TMDB) i wygeneruj własny klucz API.
### Krok 2: Utwórz plik `config.js` na podstawie `config.example.js`
W katalogu głównym projektu utwórz plik `config.js` z zawartością:
```js
const CONFIG = {
  TMDB_API_KEY: 'TWOJ_KLUCZ_API'
};
Plik config.js znajduje się na liście .gitignore

## API Configuration – `config.js`
The project uses the `config.js` file to store the TMDB API key. **This file is NOT added to the repository**.
### Step 1: Where to get the key?
Register or log in to The Movie Database (TMDB) and generate your own API key.
### Step 2: Create a `config.js` file based on `config.example.js`
In the project root directory, create a `config.js` file with the following contents:
```js
const CONFIG = {
TMDB_API_KEY: 'YOUR_API_KEY'
};
The config.js file is listed in the .gitignore

