# Retro

A tool for running retros.

![UI Screenshot](https://user-images.githubusercontent.com/3317231/75081553-6dc26100-54c4-11ea-822d-f1ceb63165ae.png)

## Features

1. Anonymous posting: Each user has a session but no personal identifying information is required.
2. Anonymous voting: You only see your ⭐️s that you've given to cards while in voting mode.
3. Review mode: When reviewing, you get to see the total number of ⭐️ values given to all cards and can also sort all cards per column in ascending or descending order of ⭐️s.

## Getting Started

1. `npm install` // Install package dependencies.
1. `npm run start:dev-client` // Starts webpack dev server for the client-side code running on **localhost:4000**.
1. `npm run start:dev-server` // Starts the express server running locally.

## Server a build of the app over HTTPS using NGROK
_This makes it easy for others to access the app over the internet_
1. `npm run start:prod`

## TODO

1. Features
* [ ] GIF support (images).
* [ ] Rich text.
* [x] Sort the cards in columns by the number of ⭐️s when in "Review" mode (_requires a page refresh at the moment_).
