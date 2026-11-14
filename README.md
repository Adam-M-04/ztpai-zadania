# Room Booking API

REST API do rezerwacji sal w budynkach. Użytkownicy rezerwują sale na wybrany przedział czasu, a system pilnuje, żeby rezerwacje w jednej sali się nie nakładały, nie przekraczały pojemności sali i trwały od 15 minut do 8 godzin.

## Technologie

- Node.js 22, Express 5
- PostgreSQL 16, Knex (migracje i seedy)
- Zod (walidacja), JWT + bcrypt (uwierzytelnianie)
- Swagger UI (dokumentacja API)
- Jest + Supertest (testy)
- Docker Compose

## Uruchomienie od zera

Wymagany jest Docker z Docker Compose.

```bash
git clone https://github.com/Adam-M-04/ztpai-zadania.git
cd ztpai-zadania
cp .env.example .env
docker compose up --build
```

Przy starcie kontener `api` czeka, aż baza będzie gotowa (healthcheck), uruchamia migracje i startuje serwer.

- API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api/docs

Wartości w `.env.example` nadają się tylko do lokalnego uruchomienia. Na innym środowisku trzeba ustawić własny `JWT_SECRET` i hasła.

### Dane przykładowe

Seed tworzy konto ADMIN, kilku użytkowników, budynki, sale i rezerwacje. Uruchamia się go w działającym kontenerze:

```bash
docker compose exec api npx knex seed:run
```

Konta po seedzie:

| Email | Rola | Hasło |
|---|---|---|
| `admin@example.com` | ADMIN | `SEED_ADMIN_PASSWORD` z `.env` |
| `jan.kowalski@example.com` | USER | `SEED_USER_PASSWORD` z `.env` |

Seed czyści wszystkie tabele przed wstawieniem danych.

### Zatrzymanie

```bash
docker compose down
```

Dane bazy zostają w volume `pgdata`. Żeby je usunąć: `docker compose down -v`.

## Uruchomienie lokalne (bez kontenera API)

```bash
npm install
cp .env.example .env
docker compose up -d db
npm run migrate:latest
npm run seed:run
npm run dev
```

## Testy

```bash
npm test                  # unit + integracyjne
npm run test:unit         # bez bazy danych
npm run test:integration  # wymaga działającego PostgreSQL
```

- Unit testy sprawdzają logikę service'u rezerwacji na repozytoriach in-memory ze wstrzykniętym czasem. Nie potrzebują bazy danych.
- Testy integracyjne używają osobnej bazy z `TEST_DATABASE_URL` (nazwa musi kończyć się na `_test`). Baza jest tworzona automatycznie, schemat powstaje z migracji, a dane są czyszczone przed każdym testem.

## Zmienne środowiskowe

| Zmienna | Opis |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | dane kontenera PostgreSQL |
| `DATABASE_URL` | połączenie z bazą przy uruchomieniu lokalnym (w kontenerze ustawiane przez compose) |
| `TEST_DATABASE_URL` | baza dla testów integracyjnych |
| `PORT` | port API (domyślnie 3000) |
| `JWT_SECRET` | sekret do podpisywania tokenów, min. 32 znaki |
| `JWT_EXPIRES_IN` | czas ważności tokenu, np. `15m` |
| `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD` | hasła kont tworzonych przez seed |

Konfiguracja jest walidowana przy starcie. Przy błędnej wartości aplikacja wypisuje, co jest nie tak, i kończy działanie.

## Endpointy

Wszystkie endpointy poza `/api/auth/register`, `/api/auth/login` i `/api/docs` wymagają nagłówka `Authorization: Bearer <token>`.

| Metoda | Ścieżka | Dostęp |
|---|---|---|
| POST | `/api/auth/register` | publiczny |
| POST | `/api/auth/login` | publiczny |
| GET | `/api/auth/me` | zalogowany |
| GET | `/api/buildings`, `/api/buildings/:id`, `/api/buildings/:id/rooms` | zalogowany |
| POST | `/api/buildings` | ADMIN |
| GET | `/api/rooms`, `/api/rooms/:id` | zalogowany |
| POST | `/api/rooms` | ADMIN |
| GET | `/api/reservations` | USER widzi swoje, ADMIN wszystkie |
| GET | `/api/reservations/:id` | właściciel lub ADMIN |
| POST | `/api/reservations` | zalogowany |
| PATCH | `/api/reservations/:id/cancel` | właściciel lub ADMIN |

`GET /api/reservations` obsługuje paginację (`page`, `limit`), filtry (`roomId`, `buildingId`, `userId` tylko dla ADMIN, `status`, `from`, `to`) i sortowanie (`sort=startTime`, `-startTime`, `createdAt`, `participants`).

Szczegóły z przykładami requestów i odpowiedzi są w Swagger UI.

## Struktura projektu

```
db/migrations      migracje Knex
db/seeds           dane przykładowe
src/config         wczytanie i walidacja zmiennych środowiskowych
src/modules        moduły: auth, buildings, rooms, reservations, users
src/middleware     uwierzytelnianie, autoryzacja, walidacja, obsługa błędów
src/docs           specyfikacja OpenAPI
tests/unit         unit testy
tests/integration  testy integracyjne
```
