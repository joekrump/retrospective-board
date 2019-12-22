# Retro

A tool for running retros.

## Getting Started

1. `npm install`
1. `npm run start`

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
* [ ] make it look nice

7. voting
* [ ] config - number of votes per user
* [ ] users can't remove other users' votes

8. cleanup
* [ ] share button now shares link
* [ ] column data: title vs name, id vs key. Gross.

9. Features
* [ ] GIF support (/rich text?)
* [ ] Colours for columns

## BUGS
* [ ] when you refresh the page, you can't edit your cards (session auth)
* [ ] when you edit the column names, all the card data is deleted locally (not on the server, thankfully)
