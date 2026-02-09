# Race App

Race App is an exciting racing game built with Node.js and React. Players compete to complete a virtual race course in the fastest time possible by navigating through a series of waypoints. The app features a leaderboard that displays the top 20 fastest race times, allowing players to compare their performance with others.

## Built With

### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

## Features

- Interactive race course with a visual racetrack loop and multiple waypoints
- Timed races with a live timer that starts when the player begins the race
- Chronological order of waypoints to ensure players follow the correct path
- Notifications and alerts for missed waypoints and race completion
- Leaderboard displaying the player's fastest race time and the top 20 fastest times
- Admin functionality to reset race stats to default unplayed state

## Prerequisites

- Node.js (version 20)

## Getting Started

1. Install the dependencies for both the server and client:

```bash
cd server
npm install

cd ../client
npm install

Start the server:

cd server
npm start

In a new terminal, start the client:

cd client
npm start
```

Open your browser and visit http://localhost:3001 to play the game.

## How to Play

Click the "Start" button on the intro/landing page to begin the race.
Follow the racetrack and pass through all the waypoints in the correct order.
If you miss a waypoint, go back and pass through it before proceeding.
Upon completing the race, your race time will be displayed, and you can view the leaderboard to compare your time with other players.
To play again, click the "Start" button on the leaderboard page.

## Admin Functionality

To reset the race stats to a default unplayed state:

Click the "Admin" button in the drawer.
On the admin page, click the "Reset Race Stats" button to remove all previously attained race times.

## Implementation Requirements

### Required Assets with Unique Names

The following assets must exist in the world with specific unique names:

| Unique Name | Description |
|-------------|-------------|
| `race-track-container` | A rectangle asset that surrounds the entire race track area. Used to determine placement position when switching tracks. |
| `race-track-checkpoint` | Checkpoint assets placed along the track. Multiple checkpoints should use partial matching (e.g., `race-track-checkpoint-1`, `race-track-checkpoint-2`). |
| `race-track-start` | The starting line asset where players begin the race. |

### Additional Environment Variables

In addition to the standard environment variables, this app supports Google Sheets integration for leaderboards:

| Variable | Description |
|----------|-------------|
| `GOOGLESHEETS_CLIENT_EMAIL` | Google service account email for Sheets API access |
| `GOOGLESHEETS_SHEET_ID` | The ID of the Google Spreadsheet for storing leaderboard data |
| `GOOGLESHEETS_PRIVATE_KEY` | Service account private key for authentication |

### Track Configuration

Tracks are configured in `server/constants.js`. Each track requires:
- `id`: Unique track identifier
- `name`: Display name for the track
- `thumbnail`: URL to track preview image
- `sceneId`: The Topia scene ID containing the track assets
