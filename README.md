# Retro

A tool for running retros.

<img width="945" alt="Screenshot" src="https://user-images.githubusercontent.com/3317231/71594346-72821e80-2aec-11ea-836e-0da5246fe544.png">

## Getting Started

1. `npm install` // Installs package dependencies.
1. Create an environment variable called `RETRO_SECRET` and store its value somewhere safe. It must be able to be accessed via `process.env.RETRO_SECRET` in the server code. If you do not do this, you will see an error when you try to access the app after running the steps below.
1. `npm run start:dev-client` // Starts webpack dev server for the client-side code running on **localhost:4000**.
1. `npm run start:dev-server` // Starts the express server running locally.

## Server a build of the app over HTTPS using NGROK
_This makes it easy for others to acess this app, running off your machine_
1. Create an environment variable called `RETRO_SECRET` and store its value somewhere safe. It must be able to be accessed via `process.env.RETRO_SECRET` in the server code. If you do not do this, you will see an error when you try to access the app after running the steps below.
1. `npm run prod`

## TODO

1. style!
* [ ] make it look nice - WIP

2. Features
* [ ] GIF support (/rich text?)
* [ ] Colours for columns
