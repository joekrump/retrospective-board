# Retro

A tool for running retros.

## Getting Started

1. `npm install` // Installs package dependencies.
1. Create an environment variable called `RETRO_SECRET` and store its value somewhere safe. It must be able to be accessed via `process.env.RETRO_SECRET` in the server code. If you do not do this, you will see an error when you try to access the app after running the steps below.
1. `npm start` // Starts webpack dev server for the client-side code running on **localhost:8000**.
1. `npm run start-server` // Starts the express server running locally.

## Server a build of the app over HTTPS using NGROK
_This makes it easy for others to acess this app, running off your machine_
1. Create an environment variable called `RETRO_SECRET` and store its value somewhere safe. It must be able to be accessed via `process.env.RETRO_SECRET` in the server code. If you do not do this, you will see an error when you try to access the app after running the steps below.
1. `npm run prod`

## TODO

1. sockets for column create, delete, rename
* [x] Ability to rename columns
* [x] socket wire ups

2. create a board (index -> create new button -> new board with unique URL)
* [x] board is held in memory - don't overthink it
* [x] board stores name, context
* [x] UUID for column ids - board stores column IDs
* [x] socket on "connection" passes down name/context/boards if you create/join
* [x] "create new board" from step 2 creates & passes initial columns to board on creation

3. store data so people joining URL see what's already been created
* [x] store card data in memory on server
* [x] socket on "connection" passes columns and cards down to client

4. editable board traits
* [x] title saves to server
* [x] description saves to server

5. make it public!
* [x] figure out ngrok or some other system

6. style!
* [ ] make it look nice - WIP

7. voting
* [ ] config - number of votes per user
  * [x] Works per-session, however, sessions don't persist past a page refresh.
* [ ] users can't remove other users' votes
* [ ] Fix error that doesn't show your votes for yourself and only for others.

8. cleanup
* [ ] share button now shares link
* [x] column data: title vs name, id vs key. Gross.

9. Features
* [ ] GIF support (/rich text?)
* [ ] Colours for columns

## BUGS
* [ ] when you refresh the page, you can't edit your cards (session auth)
* [ ] when you edit the column names, all the card data is deleted locally (not on the server, thankfully)
