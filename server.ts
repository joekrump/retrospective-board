import express from "express";
import SocketIO from "socket.io";
import uuid from "uuid";

let boards: {[key: string]: Board} = {};
let sessionStore: {
  [boardId: string]: {
    [id: string]: Session
  };
} = {};

const MAX_VOTES_USER_VOTE_PER_BOARD = 10;
const NEW_BOARD = {
  title: "...",
  showResults: false,
  maxStars: MAX_VOTES_USER_VOTE_PER_BOARD,
  columns: [
    {
      id: uuid.v4(),
      name: "👏 The Good",
      cards: []
    },
    {
      id: uuid.v4(),
      name: "😬 The Bad",
      cards: []
    },
    {
      id: uuid.v4(),
      name: "⚡️ To Improve",
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

function createNewBoard(boardId: string) {
  boards[boardId] = NEW_BOARD;
}

function reclaimStarsFromDeleteCard(card: Card, boardId: string) {
  Object.keys(card.stars).forEach(sessionId => {
    sessionStore[boardId][sessionId].remainingStars += Math.abs(card.stars[sessionId]);
  });
}

function emitBoardLoaded(socket: SocketIO.Socket, boardId: string, sessionId: string) {
  socket.emit(`board:loaded:${boardId}`, {
    board: boards[boardId],
    sessionId,
    showResults: boards[boardId].showResults,
    remainingStars: sessionStore[boardId][sessionId].remainingStars,
  });
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
    session.remainingStars++;
    card.starsCount--;
    card.stars[session.id]--;
  } else if (star > 0 && session.remainingStars > 0){
    session.remainingStars--;
    card.starsCount++;
    card.stars[session.id]++;
  } else {
    console.log("No more stars left");
    socket.emit(`board:star-limit-reached:${boardId}`, { maxStars: MAX_VOTES_USER_VOTE_PER_BOARD });
  }
}

function canStar(remainingStars: number) {
  return remainingStars >= 0;
}

function emitUpdateRemainingStars(
  socket: SocketIO.Socket,
  boardId: string,
  sessionId: string,
) {
  socket.emit(`board:update-remaining-stars:${boardId}:${sessionId}`, {
    remainingStars: sessionStore[boardId][sessionId].remainingStars,
  });

  Object.keys(sessionStore[boardId]).forEach((boardSessionId) => {
    socket.broadcast.emit(`board:update-remaining-stars:${boardId}:${boardSessionId}`, {
      remainingStars: sessionStore[boardId][boardSessionId].remainingStars,
    });
  });
}

io.on('connection', function (socket) {

  socket.on('board:show-results', function(data: { boardId: string, sessionId: string }) {
    if (!!boards[data.boardId]) {
      boards[data.boardId].showResults = !boards[data.boardId].showResults;

      boards[data.boardId].columns.forEach((column) => {
        socket.emit(`column:loaded:${column.id}`, column);
        socket.broadcast.emit(`column:loaded:${column.id}`, column);
      });

      socket.emit(`board:show-results:${data.boardId}`, { showResults: boards[data.boardId].showResults });
      socket.broadcast.emit(`board:show-results:${data.boardId}`, { showResults: boards[data.boardId].showResults });
    }
  });

  socket.on('board:loaded', function (data: { boardId: string, sessionId?: string }) {
    const sessionId = data.sessionId ?? uuid.v4();
    const boardId = data.boardId ?? uuid.v4();

    const newSession = {
      id: sessionId,
      remainingStars: MAX_VOTES_USER_VOTE_PER_BOARD,
    };

    if(!sessionStore[boardId]) {
      createNewBoard(boardId)
      sessionStore[boardId] = {
        [sessionId]: newSession,
      };
    } else if (!sessionStore[boardId][sessionId]) {
      sessionStore[boardId][sessionId] = newSession
    }

    emitBoardLoaded(socket, boardId, sessionId);
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
    if (data.sessionId === undefined && !sessionStore[data.boardId][data.sessionId]) {
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
    if (data.sessionId === undefined && !sessionStore[data.boardId][data.sessionId]) {
      console.error("No session");
      return;
    }

    boards[data.boardId].columns.push({id: data.id, name: data.name, cards: []});
    socket.broadcast.emit(`column:created:${data.boardId}`, {
      id: data.id,
      name: data.name
    });
  });

  socket.on("column:updated", function(data: { boardId: string, id: string, name: string, sessionId: string }) {
    console.log("column update request");
    if (data.sessionId === undefined && !sessionStore[data.boardId][data.sessionId]) {
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

  socket.on("column:deleted", function({ boardId, sessionId, id }: { boardId: string, id: string, sessionId: string }) {
    console.log("column delete request");
    if (sessionId === undefined && !sessionStore[boardId][sessionId]) {
      console.error("No session");
      return;
    }

    let columnIndex = boards[boardId]?.columns.findIndex((column) => column.id === id);

    if (columnIndex !== -1) {
      const column = boards[boardId].columns[columnIndex];

      column?.cards?.forEach((card) => { reclaimStarsFromDeleteCard(card, boardId); });

      emitUpdateRemainingStars(socket, boardId, sessionId);

      boards[boardId]?.columns.splice(columnIndex, 1);
      socket.broadcast.emit(`column:deleted:${boardId}`, { id });
    } else  {
      console.error("No column found");
    }
  })

  socket.on("card:moved", function(data: { boardId: string, fromColumnId: string, toColumnId: string, cardId: string, sessionId: string }) {
    if (data.sessionId === undefined && !sessionStore[data.boardId][data.sessionId]) {
      console.error("No session");
      return;
    }
    console.log("***MOVED***")
    console.log(data)

    const card = getCard(data.cardId, data.fromColumnId, data.boardId, data.sessionId);

    console.log(card);
    socket.emit(`card:created:${data.toColumnId}`, {
      card,
    });

    socket.broadcast.emit(`card:created:${data.toColumnId}`, {
      card,
    });

    socket.emit(`card:deleted:${data.fromColumnId}`, {
      id: data.cardId,
    });

    socket.broadcast.emit(`card:deleted:${data.fromColumnId}`, {
      id: data.cardId
    });
  });

  function addCardToColumn(card: { id: string, text: string, columnId: string, boardId: string, }, sessionId: string) {
    const column = boards[card.boardId].columns.find((column) => column.id === card.columnId);
    if (column) {
      let newCard = {
        id: card.id,
        text: card.text,
        stars: {},
        ownerId: sessionId,
        starsCount: 0,
      };
      column.cards.push(newCard);

      socket.emit(`card:created:${card.columnId}`, {
        card,
      });
      socket.broadcast.emit(`card:created:${card.columnId}`, {
        card,
      });
    }
  }

  socket.on("card:created", function(data: { boardId: string, columnId: string, id: string, text: string, sessionId: string }) {
    console.log("card create request")
    if (data.sessionId === undefined && !sessionStore[data.boardId][data.sessionId]) {
      console.error("No session");
      return;
    }

    addCardToColumn(data, data.sessionId);
  });

  socket.on("card:updated", function (data: { boardId: string, columnId: string, id: string, text: string, sessionId: string }) {
    console.log("card update request");
    if (data.sessionId === undefined && !sessionStore[data.boardId][data.sessionId]) {
      console.error("No session");
      return;
    }

    const card = getCard(data.id, data.columnId, data.boardId, data.sessionId);

    if (card !== null) {
      card.text = data.text;
      socket.broadcast.emit(`card:updated:${data.id}`, {
        text: data.text,
      });
    }
  });

  function getCard(cardId: string, columnId: string, boardId: string, sessionId: string) {
    const column = boards[boardId].columns.find((column) => column.id === columnId);
    if (column) {
      const card = column.cards.find((card) => card.id === cardId);
      if (card && card.ownerId === sessionId) {
        return card;
      } else {
        return null;
      }
    }
    return null;
  }

  socket.on("card:deleted", function (data: { boardId: string, columnId: string, id: string, sessionId: string }) {
    console.log("card delete request");
    if (data.sessionId === undefined && !sessionStore[data.boardId][data.sessionId]) {
      console.error("No session");
      return;
    }
    console.log(data);
    const column = boards[data.boardId].columns.find((column) => column.id === data.columnId);
    if (column) {
      const cardIndex = column.cards.findIndex((card) => card.id === data.id);
      const card = column.cards[cardIndex];
      // Check to see if the request is coming from the card's owner
      if(card?.ownerId === data?.sessionId) {
        column.cards.splice(cardIndex, 1);

        reclaimStarsFromDeleteCard(card, data.boardId);
        emitUpdateRemainingStars(socket, data.boardId, data.sessionId);

        socket.broadcast.emit(`card:deleted:${data.columnId}`, {
          id: data.id
        });
      }
    }
  });

  socket.on("card:starred", function ({ id, star, boardId, columnId, sessionId }: { id: string, star: number, boardId: string, columnId: string, sessionId: string }) {
    console.log("star for card request");
    if (sessionId === undefined && !sessionStore[boardId][sessionId]) {
      console.error("No session");
      return;
    }
    const session = sessionStore[boardId][sessionId];

    const column = boards[boardId].columns.find((column) => column.id === columnId);
    if (column) {
      const card = column.cards.find((card) => card.id === id);
      if (card && canStar(session.remainingStars)) {
        updateRemainingStars(session, socket, card, boardId, star);
        const userStars = card.stars[session.id];
        const { starsCount } = card;

        socket.emit(`card:starred:${id}`, { starsCount, userStars });
        socket.broadcast.emit(`card:starred:${id}`, {
          starsCount,
        });
        socket.emit(`board:update-remaining-stars:${boardId}:${sessionId}`, {
          remainingStars: session.remainingStars,
        });
      }
    }
  });
});

