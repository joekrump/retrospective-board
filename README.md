# Standup

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
* store card data in memory on server
* socket on "connection" passes columns and cards down to client

4. editable board traits
* title and description save to server

5. figure out ngrok or some other way to make the link public

6. style! make it look nice

7. voting - number of votes, can't remove other votes

8. cleanup
* share button now shares link
* column data: title vs name, id vs key. Gross.