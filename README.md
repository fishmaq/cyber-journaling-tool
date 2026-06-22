# Cyber-Journaling

## What is this?

The Cyber-Journaling Tool is a project for documenting Cybersecurity Incidents and displaying them on a big presenter
screen.

## Project Structure Overview

### Shared DTOs

Contains all DTOs that will be used by the Frontend and Backend to ensure correct formatting on both ends.
> Installed via package.json --> "shared": "file:../shared",

### Backend (Express & Prisma)

The Backend service is used to GET, POST, PUT and DELETE all relevant data using an express api with prisma.io as ORM
database tool.
Prisma connects to the PostgreSQL Database hosted inside a docker container.

We use the database as the leading system and in case of a db change have to pull the schema.prisma with the following
command to update everything:

   ```sh
    cd cyber-journaling-backend
    npx prisma db pull --schemas config,data
   ```

> note that we have to explicitly list all db schemas

After any change to the schema.prisma you have to update your locally generated internal prisma models and client:

   ```sh
    cd cyber-journaling-backend
    npx prisma generate
   ```

> NOTE: This is not sufficiently tested!!!

### Database (PostgreSQL)

The database is started via a docker compose script (docker-compose.yaml). It is set up with 2 schemas data and config,
where config is used for tables that won't be edited frequently but have to be dynamic.

### Frontend (Angular)

The Frontend uses Angular and interacts with the backend via HTTP-Requests. There are 4 main features including:

1. CRUD Operations for Cases and Events
    - Cases are the outer shell for a list of events.
    - Events each represent something that happened in the network and has to be documented.
        - Events can have Services that are affected by it. These Services will then be displayed accordingly in the
          Netplan View, if a Device Health was selected
2. Timeline View
    - Look at Cases and their events in a timeline view
3. Netplan View
    - Look at the Network Plan and the current state of all services.
4. Presenter Mode
    - Automatically reload the data for netplan and timeline views

#### Netplan View

The Netplan is completely stored inside the Database and a big nested Team Object.

> Team > NetplanGroup > Host > Service

You can also add Service Icons in the icon_name column of the Service Table and store svg files or similar pictures
in ./cyber-journaling/public/resources/icons directory for them to be displayed in the service cards.

All colors are stored as hexcodes (without the #) in the database in the corresponding tables.

To ensure the correct order of the cards, there are "priority" columns in most of the tables that are being used in the
netplan.
> Priority with ascending sort order --> prio 1 is the first element

#### Archive

This contains the old files from the first prototype which was vibe-coded using Codex and was the POC for this project.

## Setup

### Project Structure

- Frontend (Angular)   -> **./cyber-journaling**
- Backend (Javascript) -> **./cyber-journaling-backend**
- DTOs -> **./shared**
- Docker-Compose -> **./docker-compose.yaml**
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

