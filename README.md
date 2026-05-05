# Cyber-Journaling Tool

## Setup

### Project Structure

- Frontend (Angular)   -> **./cyber-journaling**
- Backend (Javascript) -> **./cyber-journaling-backend**
- Dtos             -> **./shared**
- Docker-Compose       -> **./docker-compose.yaml**
- Database scripts (Postgres) -> **./sql**


> The Front- and Backend both use the same Dtos.

### Requirements

- [Angular](https://angular.dev/)
- [Node Package Manager](https://www.npmjs.com/)
- [Node.js](https://nodejs.org/en)
- [Docker](https://www.docker.com/)

```sh
npm install -D typescript ts-node-dev @types/node @types/express

cd cyber-journaling-backend
npx prisma generate
```
### Launch commands

Launch commands can be found in the 'scripts' section in  (Frontend/Backend/shared)/package.json

#### Frontend scripts

- 'frontend start' -> starts the frontend (hot-reload)

#### Backend scripts

- 'backend dev' -> starts the backend (hot-reload)

#### Dto Scripts

- 'watch shared' -> (hot-reload)

### Installation

#### 1. Database

1. Run the docker compose file 
   ```bash 
      docker-compose up docker-compose.yaml
   ```
2. Connect to the database with User 'cyber-journaling' and password 'cyber-journaling'.
3. Run the .sql scripts in ./sql in ascending order (01,02,03,...)

#### 2. Backend

1. Install dependencies using npm

> You can run index.ts via the script 'backend dev'

#### 3. Frontend

1. Install dependencies using npm

> You can run index.ts via the script 'frontend start'

