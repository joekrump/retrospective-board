# Retro

A tool for running retros.

<img width="1409" alt="retro_screenshot" src="https://user-images.githubusercontent.com/3317231/72572068-4994b400-3876-11ea-8d35-44f5789f574b.png">

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
* [ ] Add color per session that will be added as a boarder on their cards so they can find and edit them more easily.
* [ ] Sort the cards in columns by the number of ⭐️s when in "Review" mode.
