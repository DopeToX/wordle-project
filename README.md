# Wordle Project

This is a Wordle game with React client, Node.js server, and PostgreSQL database.

## Running with Docker

1. Make sure Docker and Docker Compose are installed.

2. Build and run the services:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Client: http://localhost:3000
   - Server: http://localhost:5000

4. Stop the services:
   ```bash
   docker-compose down
   ```

## Development

For local development without Docker:

1. Install PostgreSQL locally (download from https://www.postgresql.org/download/windows/).

2. Create a database named `wordle_db` with user `postgres` and your password.

3. Run the schema:
   ```sql
   -- Execute db/schema.sql in your PostgreSQL client (e.g., pgAdmin or psql)
   ```

4. Copy `.env.example` to `.env` in the server directory and update the values.

5. In server directory:
   ```bash
   npm install
   npm run dev
   ```

6. In client directory:
   ```bash
   npm install
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the server directory with:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wordle_db
DB_USER=postgres
DB_PASSWORD=your_password
SECRET_KEY=your_secret_key_here
PORT=5000
```