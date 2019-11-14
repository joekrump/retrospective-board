import express from "express";
import SocketIO from "socket.io";

let app = express();
let server = require("http").Server(app);
let io = SocketIO(server);
import uuid from "uuid";

interface Column {
  title: string;
  id: string;
}

interface Board {
  title?: string;
  description?: string;
  columns: Column[];
}

let boards: {[key: string]: Board} = {};

server.listen(8000);

app.use(express.static('public'));

app.get("/", function(_req, res) {
  res.sendFile(__dirname + "/create.html")
});

app.get("/board/:boardId", function(_req, res) {
  res.sendFile(__dirname + "/public/board.html")
});

app.post("/create-board", function(_req, res) {
  let boardId = uuid.v4();
  boards[boardId] = {
    title: "New Board",
    description: "",
    columns: [
      {
        id: uuid.v4(),
        title: "Column 1"
      },
      {
        id: uuid.v4(),
        title: "Column 2"
      },
      {
        id: uuid.v4(),
        title: "Column 3"
      }
    ]
  };
  console.log(boards);
  res.redirect(`/board/${boardId}`);
});

io.on('connection', function (socket) {
  console.log("connected!");

  socket.on('board:loaded', function (data) {
    socket.emit(`board:loaded:${data.boardId}`, boards[data.boardId]);
  });

  socket.on('cardCreated', function (data) {
    console.log(data);
    socket.broadcast.emit("card-created", data);
  });

  socket.on("column:created", function(data) {
    console.log("column created");
    console.log(data);
    boards[data.boardId].columns.push({id: data.id, title: data.name})
    socket.broadcast.emit(`column:created:${data.boardId}`, {
      id: data.id,
      title: data.name
    });
  });

  socket.on("column:updated", function(data) {
    console.log("column updated");
    console.log(data);
    let column = boards[data.boardId].columns.find((column) => column.id === data.id);
    if (column) {
      column.title = data.name;
      socket.broadcast.emit(`column:updated:${data.id}`, {
        title: data.name
      });
    }
  });

  socket.on("card:created", function(data) {
    console.log("card created");
    console.log(data);
    socket.broadcast.emit(`card:created:${data.columnId}`, {
      id: data.id
    });
  });

  socket.on("card:updated", function (data) {
    console.log("card updated");
    console.log(data);
    socket.broadcast.emit(`card:updated:${data.id}`, {
      text: data.text,
    });
  });

  socket.on("card:deleted", function (data) {
    console.log("card deleted");
    console.log(data);
    socket.broadcast.emit(`card:deleted:${data.columnId}`, {
      id: data.id
    });
  });

  socket.on("card:voted", function (data) {
    console.log("card vote");
    console.log(data);
    socket.broadcast.emit(`card:voted:${data.id}`, {
      vote: data.vote
    });
  })
});
