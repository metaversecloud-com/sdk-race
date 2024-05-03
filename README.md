# Race App

Race App is an exciting racing game built with Node.js and React. Players compete to complete a virtual race course in the fastest time possible by navigating through a series of waypoints. The app features a leaderboard that displays the top 20 fastest race times, allowing players to compare their performance with others.

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
