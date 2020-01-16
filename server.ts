import express from "express";
import SocketIO from "socket.io";
import uuid from "uuid";

let boards: {[key: string]: Board} = {};
let sessionStore: {
  [id: string]: Session;
} = {};

const MAX_VOTES_USER_VOTE_PER_BOARD = 10;
const NEW_BOARD = {
  title: "Retro",
  showResults: false,
  maxStars: MAX_VOTES_USER_VOTE_PER_BOARD,
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

let app = express();
let server = require("http").Server(app);
let io = SocketIO(server);
server.listen(8000);
app.use(express.static('public'));

app.get("/board/:boardId", function(_req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

function createNewBoard(boardId?: string) {
  if(!boardId) {
    boardId = uuid.v4();
  }
  boards[boardId] = NEW_BOARD;
  return boardId;
}

function reclaimStarsFromDeleteCard(card: Card, boardId: string) {
  Object.keys(card.stars).forEach(sessionId => {
    sessionStore[sessionId].remainingStars[boardId] += Math.abs(card.stars[sessionId]);
  });
}

function emitBoardLoaded(socket: SocketIO.Socket, boardId: string, sessionId: string) {
  socket.emit(`board:loaded:${boardId}`, {
    board: boards[boardId],
    sessionId,
    remainingStars: sessionStore[sessionId].remainingStars[boardId],
  });
}

function initializeBoardForUser(boardId: string, sessionId: string) {
  boardId = createNewBoard(boardId);
  sessionStore[sessionId].remainingStars[boardId] = MAX_VOTES_USER_VOTE_PER_BOARD;
}

function updateRemainingStars(
  session: Session,
  socket: SocketIO.Socket,
  card: Card,
  boardId: string,
  star: number,
) {
  if (card.stars[session.id] === undefined) {
    card.stars[session.id] = 0;
  }

  // Check if the star undoes a previous one and adds a remaining star back.
  if((star < 0 && card.stars[session.id] > 0)) {
    session.remainingStars[boardId]++;
    card.starsCount--;
    card.stars[session.id]--;
  } else if (star > 0 && session.remainingStars[boardId] > 0){
    session.remainingStars[boardId]--;
    card.starsCount++;
    card.stars[session.id]++;
  } else {
    console.log("No more stars left");
    socket.emit(`board:star-limit-reached:${boardId}`, { maxStars: MAX_VOTES_USER_VOTE_PER_BOARD });
  }
}

function newBoardSession(session: Session, boardId: string) {
  return session.remainingStars[boardId] === undefined;
}

function canStar(remainingStars: number) {
  return remainingStars >= 0;
}

io.on('connection', function (socket) {

  socket.on('board:show-results', function(data) {
    if (!!boards[data.boardId]) {
      boards[data.boardId].showResults = !boards[data.boardId].showResults;
      socket.emit(`board:show-results:${data.boardId}`, { showResults: boards[data.boardId].showResults });
      socket.broadcast.emit(`board:show-results:${data.boardId}`, { showResults: boards[data.boardId].showResults });
    }
  });

  socket.on('board:loaded', function (data: { boardId: string, sessionId: string }) {
    let sessionId = data.sessionId ?? uuid.v4();

    if(!sessionStore[sessionId]) {
      sessionStore[sessionId] = {
        id: sessionId,
        remainingStars: {},
      };
    }

    if(!data.boardId || !boards[data.boardId]) {
      initializeBoardForUser(data.boardId, sessionId);
    } else if (newBoardSession(sessionStore[sessionId], data.boardId)) {
      sessionStore[sessionId].remainingStars[data.boardId] = MAX_VOTES_USER_VOTE_PER_BOARD
    }

    emitBoardLoaded(socket, data.boardId, sessionId);
  });

  socket.on('board:updated', function(data: { boardId: string, title: string, sessionId: string }) {
    if(data.title !== undefined) {
      boards[data.boardId].title = data.title;
    }

    socket.emit(`board:updated:${data.boardId}`, {
      title: boards[data.boardId].title,
    });
    socket.broadcast.emit(`board:updated:${data.boardId}`, {
      title: boards[data.boardId].title,
    });
  });

  socket.on("column:loaded", function(data: { boardId: string, id: string, sessionId: string }) {
    console.log("column load request");
    if (data.sessionId === undefined && !sessionStore[data.sessionId]) {
      console.error("No session");
      return;
    }
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.id);
    if (column) {
      socket.emit(`column:loaded:${data.id}`, {
        cards: column.cards.map((card) => {
          // Remove all stars other than the current users.
          card.stars = {
            [data.sessionId]: card.stars[data.sessionId]
          };
          return card;
        }),
      });
    }
  });

  socket.on("column:created", function(data: { boardId: string, id: string, name: string, sessionId: string }) {
    console.log("column create request");
    if (data.sessionId === undefined && !sessionStore[data.sessionId]) {
      console.error("No session");
      return;
    }
    console.log(data);
    boards[data.boardId].columns.push({id: data.id, name: data.name, cards: []})
    socket.broadcast.emit(`column:created:${data.boardId}`, {
      id: data.id,
      name: data.name
    });
  });

  socket.on("column:updated", function(data: { boardId: string, id: string, name: string, sessionId: string }) {
    console.log("column update request");
    if (data.sessionId === undefined && !sessionStore[data.sessionId]) {
      console.error("No session");
      return;
    }
    let column = boards[data.boardId].columns.find((column) => column.id === data.id);
    if (column) {
      column.name = data.name;
      socket.broadcast.emit(`column:updated:${data.id}`, {
        name: data.name
      });
    }
  });

  socket.on("column:deleted", function(data: { boardId: string, id: string, sessionId: string }) {
    console.log("column delete request");
    if (data.sessionId === undefined && !sessionStore[data.sessionId]) {
      console.error("No session");
      return;
    }

    console.log(data);
    let columnIndex = boards[data.boardId].columns.findIndex((column) => column.id === data.id);
    if (columnIndex) {
      const column = boards[data.boardId].columns[columnIndex];

      column.cards.forEach((card) => { reclaimStarsFromDeleteCard(card, data.boardId); });

      boards[data.boardId].columns.splice(columnIndex, 1);
      socket.broadcast.emit(`column:deleted:${data.boardId}`, {
        id: data.id
      });
    }
  })

  socket.on("card:created", function(data: { boardId: string, columnId: string, id: string, sessionId: string }) {
    console.log("card create request")
    if (data.sessionId === undefined && !sessionStore[data.sessionId]) {
      console.error("No session");
      return;
    }

    const column = boards[data.boardId].columns.find((column) => column.id === data.columnId);
    if (column) {
      column.cards.push({
        id: data.id,
        text: "",
        stars: {},
        ownerId: data.sessionId,
        starsCount: 0,
      });
    }

    socket.broadcast.emit(`card:created:${data.columnId}`, {
      id: data.id
    });
  });

  socket.on("card:updated", function (data: { boardId: string, columnId: string, id: string, text: string, sessionId: string }) {
    console.log("card update request");
    if (data.sessionId === undefined && !sessionStore[data.sessionId]) {
      console.error("No session");
      return;
    }
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.columnId);
    if (column) {
      const card = column.cards.find((card) => card.id === data.id);
      if (card && card.ownerId === data.sessionId) {
        card.text = data.text;
        socket.broadcast.emit(`card:updated:${data.id}`, {
          text: data.text,
        });
      }
    }
  });

  socket.on("card:deleted", function (data: { boardId: string, columnId: string, id: string, sessionId: string }) {
    console.log("card delete request");
    if (data.sessionId === undefined && !sessionStore[data.sessionId]) {
      console.error("No session");
      return;
    }
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.columnId);
    if (column) {
      const cardIndex = column.cards.findIndex((card) => card.id === data.id);
      const card = column.cards[cardIndex];
      // Check to see if the request is coming from the card's owner
      if(card.ownerId === data.sessionId) {
        column.cards.splice(cardIndex, 1);

        reclaimStarsFromDeleteCard(card, data.boardId);

        socket.broadcast.emit(`card:deleted:${data.columnId}`, {
          id: data.id
        });
      }
    }
  });

  socket.on("card:starred", function ({ id, star, boardId, columnId, sessionId }: { id: string, star: number, boardId: string, columnId: string, sessionId: string }) {
    console.log("star for card request");
    if (sessionId === undefined && !sessionStore[sessionId]) {
      console.error("No session");
      return;
    }
    const session = sessionStore[sessionId];

    const column = boards[boardId].columns.find((column) => column.id === columnId);
    if (column) {
      const card = column.cards.find((card) => card.id === id);
      if (card && canStar(session.remainingStars[boardId])) {
        updateRemainingStars(session, socket, card, boardId, star);
        const userStars = card.stars[session.id];
        const { starsCount } = card;

        socket.emit(`card:starred:${id}`, { starsCount, userStars });
        socket.broadcast.emit(`card:starred:${id}`, {
          starsCount,
        });
        socket.emit(`board:update-remaining-stars:${boardId}`, {
          remainingStars: session.remainingStars[boardId],
        });
      }
    }
  });
});

