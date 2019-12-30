import express from "express";
import SocketIO from "socket.io";
import ngrok from "ngrok";
import uuid from "uuid";

const MAX_VOTES_PER_USER=10;

const session = require('express-session');
let app = express();
const sessionMiddleware = session({
  secret: process.env.RETRO_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, maxAge: 60000 },
  genid: function(_req: any) {
    return uuid(); // use UUIDs for session IDs
  },
});
app.use(sessionMiddleware);
let server = require("http").Server(app);
let io = SocketIO(server);

interface Card {
  id: string;
  text: string;
  sentiments: {
    [sessionId: string]: number;
  };
  netSentiment: number;
  votesCount: number;
  ownerId: number;
}

interface Column {
  name: string;
  id: string;
  cards: Card[];
}

interface Board {
  title: string;
  description: string;
  columns: Column[];
}

interface Session {
  id: string;
  remainingVotes: {
    [boardId: string]: number
  };
}

let boards: {[key: string]: Board} = {};
const NEW_BOARD = {
  title: "Retro",
  description: "",
  columns: [
    {
      id: uuid.v4(),
      name: "The Good",
      cards: []
    },
    {
      id: uuid.v4(),
      name: "The Bad",
      cards: []
    },
    {
      id: uuid.v4(),
      name: "To Improve",
      cards: []
    }
  ]
};

server.listen(8000);

function createNewBoard(boardId?: string) {
  if(!boardId) {
    boardId = uuid.v4();
  }
  boards[boardId] = NEW_BOARD;
  return boardId;
}

app.use(express.static('public'));

app.get("/", function(_req, res) {
  res.sendFile(__dirname + "/create.html")
});

app.get("/board/:boardId", function(_req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/create-board", function(_req, res) {
  const boardId = createNewBoard();
  res.redirect(`/board/${boardId}`);
});

io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on('connection', function (socket) {
  if(!socket.request.session || !socket.request.session.id) {
    socket.request.session.save();
  }
  if(socket.request.session && socket.request.session.remainingVotes === undefined) {
    socket.request.session.remainingVotes = {};
    socket.request.session.save();
  }

  socket.on('board:loaded', function (data) {
    if(socket.request.session.remainingVotes[data.boardId] === undefined) {
      socket.request.session.remainingVotes[data.boardId] = MAX_VOTES_PER_USER;
      socket.request.session.save();
    }

    if(!data.boardId || !boards[data.boardId]) {
      data.boardId = createNewBoard(data.boardId);
    }
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
    boards[data.boardId].columns.push({id: data.id, name: data.name, cards: []})
    socket.broadcast.emit(`column:created:${data.boardId}`, {
      id: data.id,
      name: data.name
    });
  });

  socket.on("column:updated", function(data) {
    console.log("column updated");
    console.log(data);
    let column = boards[data.boardId].columns.find((column) => column.id === data.id);
    if (column) {
      column.name = data.name;
      socket.broadcast.emit(`column:updated:${data.id}`, {
        name: data.name
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
      column.cards.push({id: data.id, text: "", sentiments: {}, ownerId: socket.request.session.id, votesCount: 0, netSentiment: 0 });
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
      // Check to see if the request is coming from the card's owner
      if(column.cards[cardIndex].ownerId === socket.request.session.id) {
        column.cards.splice(cardIndex, 1);

        socket.broadcast.emit(`card:deleted:${data.columnId}`, {
          id: data.id
        });
      }
    }
  });

  function updateRemainingVotes(
    socket: SocketIO.Socket,
    card: Card,
    boardId: number,
    sentiment: number,
  ) {
    if (card.sentiments[socket.request.session.id] === undefined) {
      card.sentiments[socket.request.session.id] = 0;
    }

    // Check if the vote undoes a previous one and adds a remaining vote back.
    if(
      (sentiment > 0 && card.sentiments[socket.request.session.id] < 0)
    || (sentiment < 0 && card.sentiments[socket.request.session.id] > 0)
    ) {
      socket.request.session.remainingVotes[boardId]++;
      card.votesCount--;
    } else if (socket.request.session.remainingVotes[boardId] > 0){
      socket.request.session.remainingVotes[boardId]--;
      card.votesCount++;
    } else {
      console.log("No more votes left");
      socket.emit(`board:vote-limit-reached:${boardId}`, { maxVotes: MAX_VOTES_PER_USER });
      return; // exit early because votes have been maxed out and the user is not attempting to undo a previous vote.
    }

    if(socket.request.session.remainingVotes[boardId] >= 0) {
      card.sentiments[socket.request.session.id] += sentiment;
      card.netSentiment += sentiment;
    }
  }
  socket.on("card:voted", function ({ id, vote, boardId, columnId }) {
    const column = boards[boardId].columns.find((column) => column.id === columnId);
    if (column) {
      const card = column.cards.find((card) => card.id === id);
      if (card && canVote(socket.request.session.remainingVotes[boardId])) {
        updateRemainingVotes(socket, card, boardId, vote);
        const userSentiment = card.sentiments[socket.request.session.id];
        const { netSentiment, votesCount } = card;
        socket.emit(`card:voted:${id}`, { netSentiment, votesCount, userSentiment });
        socket.broadcast.emit(`card:voted:${id}`, { netSentiment, votesCount });
      }
    }
  });
});

function canVote(remainingVotes: number) {
  return remainingVotes >= 0;
}

if(process.env.NODE_ENV === "production") {
  (async function() {
    const url = await ngrok.connect({
      proto: 'http',
      addr: 8000,
    });

    console.log('Tunnel Created -> ', url);
    console.log('Tunnel Inspector ->  http://127.0.0.1:4040');
  })();
}
