import express from "express";
import SocketIO from "socket.io";
import ngrok from "ngrok";

const session = require('express-session');
let app = express();
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, maxAge: 60000 },
});
app.use(sessionMiddleware);
let server = require("http").Server(app);
let io = SocketIO(server);
import uuid from "uuid";

interface Card {
  id: string;
  text: string;
  votes: number;
}

interface Column {
  title: string;
  id: string;
  cards: Card[];
}

interface Board {
  title: string;
  description: string;
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
        title: "Column 1",
        cards: []
      },
      {
        id: uuid.v4(),
        title: "Column 2",
        cards: []
      },
      {
        id: uuid.v4(),
        title: "Column 3",
        cards: []
      }
    ]
  };
  console.log(boards);
  res.redirect(`/board/${boardId}`);
});

io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on('connection', function (socket) {
  socket.on('board:loaded', function (data) {
    socket.emit(`board:loaded:${data.boardId}`, boards[data.boardId]);
  });

  socket.on('board:updated', function(data) {
    boards[data.boardId].title = data.title;
    boards[data.boardId].description = data.description;
    socket.broadcast.emit(`board:updated:${data.boardId}`, {
      title: data.title,
      description: data.description,
    });
  });

  socket.on("column:loaded", function(data) {
    console.log("column created");
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.id);
    if (column) {
      socket.emit(`column:loaded:${data.id}`, {
        cards: column.cards,
      });
    }
  });

  socket.on("column:created", function(data) {
    console.log("column created");
    console.log(data);
    boards[data.boardId].columns.push({id: data.id, title: data.name, cards: []})
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

  socket.on("column:deleted", function(data) {
    console.log("column deleted");
    console.log(data);
    let columnIndex = boards[data.boardId].columns.findIndex((column) => column.id === data.id);
    if (columnIndex) {
      boards[data.boardId].columns.splice(columnIndex, 1);
      socket.broadcast.emit(`column:deleted:${data.boardId}`, {
        id: data.id
      });
    }
  })

  socket.on("card:created", function(data) {
    // data: boardId, columnId, id
    console.log("card created");
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.columnId);
    if (column) {
      column.cards.push({id: data.id, text: "", votes: 0});
    }

    socket.broadcast.emit(`card:created:${data.columnId}`, {
      id: data.id
    });
  });

  socket.on("card:updated", function (data) {
    console.log("card updated");
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.columnId);
    if (column) {
      const card = column.cards.find((card) => card.id === data.id);
      if (card) {
        card.text = data.text;
      }
    }
    socket.broadcast.emit(`card:updated:${data.id}`, {
      text: data.text,
    });
  });

  socket.on("card:deleted", function (data) {
    console.log("card deleted");
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.columnId);
    if (column) {
      const cardIndex = column.cards.findIndex((card) => card.id === data.id);
      column.cards.splice(cardIndex, 1);
    }

    socket.broadcast.emit(`card:deleted:${data.columnId}`, {
      id: data.id
    });
  });

  socket.on("card:voted", function (data) {
    console.log("card vote");
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.columnId);
    if (column) {
      const card = column.cards.find((card) => card.id === data.id);
      if (card) {
        card.votes += data.vote;
      }
    }
    socket.broadcast.emit(`card:voted:${data.id}`, {
      vote: data.vote
    });
  });
});

(async function() {
  const url = await ngrok.connect({
    proto: 'http',
    addr: 8000,
  });

  console.log('Tunnel Created -> ', url);
  console.log('Tunnel Inspector ->  http://127.0.0.1:4040');
})();
