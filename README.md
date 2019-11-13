# Standup

## TODO

1. sockets for column create, delete, rename
* Ability to rename columns
* socket wire ups

2. create a board (index -> create new button -> new board with unique URL)
* board is held in memory - don't overthink it
* board stores name, context
* UUID for column ids - board stores column IDs
* socket on "connection" passes down name/context/boards if you create/join
* share button now shares link

3. store data so people joining URL see what's already been created
* store card data in memory on server
* socket on "connection" passes columns and cards down to client
* "create new board" from step 2 creates & passes initial columns to board on creation

4. style! make it look nice

5. voting - number of votes, can't remove other votes
