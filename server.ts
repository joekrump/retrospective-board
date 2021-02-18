import express from "express";
import SocketIO from "socket.io";
import uuid from "uuid";
import { Board, Card, Session } from "./src/@types";

let boards: {[key: string]: Board} = {};
let sessionStore: {
  [boardId: string]: {
    [id: string]: Session
  };
} = {};

const MAX_VOTES_USER_VOTE_PER_BOARD = 10;
const NEW_BOARD = {
  title: `Retro - ${(new Date()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`,
  showResults: false,
  maxStars: MAX_VOTES_USER_VOTE_PER_BOARD,
  cards: {},
  currentStep: 0,
  totalSteps: 0,
  columns: [
    {
      id: uuid.v4(),
      name: "👏 The Good",
      cardIds: []
    },
    {
      id: uuid.v4(),
      name: "😬 The Bad",
      cardIds: []
    },
    {
      id: uuid.v4(),
      name: "⚡️ To Improve",
      cardIds: []
    }
  ]
};

let app = express();
let server = require("http").Server(app);
let io = SocketIO(server, {
  origins: process.env.NODE_ENV !== "production" ? ["http://localhost:4000"] : [],
});
server.listen(8000);
app.use(express.static("public"));

app.get("/board/:boardId", function(_req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

function createNewBoard(boardId: string) {
  boards[boardId] = NEW_BOARD;
}

function getSession(boardId, sessionId: string): Session | null {
  let session;
  if (sessionId !== undefined) {
    try {
      session = sessionStore[boardId][sessionId]
    } catch {
      session =  null;
    }
  } else {
    session =  null;
  }

  if (session === null || session === undefined) {
    console.error("Not a valid session");
    return null;
  } else {
    return session;
  }
}

function reclaimStarsFromDeleteCard(card: Card, boardId: string) {
  Object.keys(card.stars).forEach(sessionId => {
    sessionStore[boardId][sessionId].remainingStars += Math.abs(card.stars[sessionId]);
  });
}

function emitBoardLoaded(socket: SocketIO.Socket, boardId: string, sessionId: string) {
  socket.emit(`board:loaded:${boardId}`, {
    board: {
      currentStep: boards[boardId].currentStep,
      totalSteps: boards[boardId].totalSteps,
      title: boards[boardId].title,
      cards: boards[boardId].cards,
      columns: boards[boardId].columns,
    },
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
  remainingStars: number,
) {
  socket.emit(`board:update-remaining-stars:${boardId}:${sessionId}`, {
    remainingStars,
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

  socket.on("board:loaded", function (data: { boardId: string, sessionId?: string }) {
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

  socket.on("board:updated", function(data: { boardId: string, title: string, sessionId: string }) {
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

  socket.on("board:start-timer", ({
    boardId,
    durationMS,
  }: {
    boardId: string,
    durationMS: number,
  }) => {
    const millisecondsPerSecond = 1000;
    // console.log("TIMER STARTED")
    // console.log(boardId)
    // console.log(durationMS)
    boards[boardId].currentStep = 0;
    boards[boardId].totalSteps = durationMS / millisecondsPerSecond;

    if (!boards[boardId]?.stepsIntervalId) {
      boards[boardId].stepsIntervalId = setInterval(() => {
        if (boards[boardId].currentStep >= boards[boardId].totalSteps) {
          clearInterval(boards[boardId].stepsIntervalId);
          boards[boardId].stepsIntervalId = undefined;
          return;
        }

        boards[boardId].currentStep++;

        // socket.emit(`board:darken-app-tick:${boardId}`, {
        //   currentStep: boards[boardId].currentStep,
        //   totalSteps: boards[boardId].totalSteps,
        // });
        // socket.broadcast.emit(`board:darken-app-tick:${boardId}`, {
        //   currentStep: boards[boardId].currentStep,
        //   totalSteps: boards[boardId].totalSteps,
        // });
        let remainingTimeMS = (boards[boardId].totalSteps * millisecondsPerSecond) - (boards[boardId].currentStep * millisecondsPerSecond);
        socket.emit(`board:timer-tick:${boardId}`, {
          remainingTimeMS,
        });
        socket.broadcast.emit(`board:timer-tick:${boardId}`, {
          remainingTimeMS,
        });
      }, 1000);
    }
  });

  socket.on("column:loaded", function(data: { boardId: string, id: string, sessionId: string }) {
    console.log("column load request");
    const session = getSession(data.boardId, data.sessionId);

    if (session === null) { return; }

    const board = boards[data.boardId];
    const column = board?.columns.find((column) => column.id === data.id);

    if (column) {
      let card: Card;
      socket.emit(`column:loaded:${data.id}`, {
        cards: column.cardIds.map((cardId) => {
          card = board?.cards[cardId];
          // Remove all stars other than the current users.
          return {
            ...card,
            stars: {
              [data.sessionId]: card.stars[data.sessionId]
            },
          };
        }),
      });
    }
  });

  socket.on("column:created", function({ boardId, id, name, sessionId }: { boardId: string, id: string, name: string, sessionId: string }) {
    console.log("column create request");
    const session = getSession(boardId, sessionId);

    if (session === null) { return; }

    const newColumn = {
      id,
      name,
      cardIds: [],
    };

    boards[boardId].columns.push(newColumn);
    socket.broadcast.emit(`column:created:${boardId}`, newColumn);
  });

  socket.on("column:updated", function(data: { boardId: string, id: string, name: string, sessionId: string }) {
    console.log("column update request");
    const session = getSession(data.boardId, data.sessionId);

    if (session === null) { return; }

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
    const session = getSession(boardId, sessionId);

    if (session === null) { return; }

    let columnIndex = boards[boardId]?.columns.findIndex((column) => column.id === id);

    if (columnIndex !== -1) {
      const column = boards[boardId].columns[columnIndex];

      column?.cardIds?.forEach((cardId) => {
        reclaimStarsFromDeleteCard(boards[boardId].cards[cardId], boardId);
        delete boards[boardId].cards[cardId];
      });

      emitUpdateRemainingStars(socket, boardId, sessionId, session.remainingStars);

      boards[boardId]?.columns.splice(columnIndex, 1);
      socket.broadcast.emit(`column:deleted:${boardId}`, { id });
    } else  {
      console.error("No column found");
    }
  });

  function removeCardFromColumn(column, cardId) {
    const index = column.cardIds.indexOf(cardId);
    column.cardIds.splice(index, 1);
  }

  function moveCardToColumn(board, column, cardId) {
    // TODO: A refinement could be for this event to receive an index where the card should be slotted in.
    // This would require the order of cards in a column to be kept track of on the client as well.
    // Keeping track of the order of cards would bring the added benefit of being able to re-order cards in a column
    board.cards[cardId].columnId = column.id;
    column.cardIds.push(cardId);
  }

  socket.on("card:moved", function({
    boardId,
    fromColumnId,
    toColumnId,
    cardId,
    sessionId,
  }: {
    boardId: string,
    fromColumnId: string,
    toColumnId: string,
    cardId: string,
    sessionId: string,
  }) {
    console.log("card move request")
    const session = getSession(boardId, sessionId);

    if (session === null) { return; }

    const toColumn = boards[boardId].columns.find((column) => column.id === toColumnId);
    const fromColumn = boards[boardId].columns.find((column) => column.id === fromColumnId);

    if (toColumn !== undefined) {
      moveCardToColumn(boards[boardId], toColumn, cardId);
    }

    if (fromColumn !== undefined) {
      removeCardFromColumn(fromColumn, cardId);
    }

    socket.emit(`card:moved:${boardId}`, {
      cardId,
      toColumnId,
    });

    socket.broadcast.emit(`card:moved:${boardId}`, {
      cardId,
      toColumnId,
    });
  });

  function addNewCardToColumn({
    cardId,
    sessionId,
    text,
    columnId,
    boardId,
  }: {
    cardId: string,
    sessionId: string,
    text: string,
    columnId: string,
    boardId: string,
  }) {
    const column = boards[boardId].columns.find((column) => column.id === columnId);
    if (column) {

      const newCard: Card = {
        id: cardId,
        text,
        stars: {},
        ownerId: sessionId,
        starsCount: 0,
        columnId,
        isEditing: false,
      };

      boards[boardId].cards[cardId] = newCard;
      column.cardIds.push(cardId);

      socket.broadcast.emit(`card:created:${boardId}`, {
        card: newCard,
      });
    }
  }

  socket.on("card:created", function(data: { boardId: string, columnId: string, cardId: string, text: string, sessionId: string }) {
    console.log("card create request")
    const session = getSession(data.boardId, data.sessionId);

    if (session === null) { return; }

    addNewCardToColumn(data);
  });

  socket.on("card:updated", function (data: { boardId: string, columnId: string, cardId: string, text: string, sessionId: string }) {
    console.log("card update request");
    const session = getSession(data.boardId, data.sessionId);

    if (session === null) { return; }

    boards[data.boardId].cards[data.cardId].text = data.text;

    socket.broadcast.emit(`card:updated:${data.cardId}`, {
      text: data.text,
    });
  });

  socket.on("card:deleted", function ({
    boardId,
    columnId,
    cardId,
    sessionId,
  }:{
    boardId: string,
    columnId: string,
    cardId: string,
    sessionId: string,
  }) {
    console.log("card delete request");
    const session = getSession(boardId, sessionId);
    if (session === null) { return; }

    const column = boards[boardId].columns.find((column) => column.id === columnId);
    if (column) {
      const card = boards[boardId].cards[cardId];

      if(card?.ownerId === sessionId) {
        const index = column.cardIds.indexOf(cardId);

        delete boards[boardId].cards[cardId];
        column.cardIds.splice(index, 1);

        reclaimStarsFromDeleteCard(card, boardId);
        emitUpdateRemainingStars(socket, boardId, sessionId, session.remainingStars);

        socket.broadcast.emit(`card:deleted:${boardId}`, {
          cardId,
        });
      }
    }
  });

  socket.on("card:starred", function ({ id, star, boardId, sessionId }: { id: string, star: number, boardId: string, columnId: string, sessionId: string }) {
    const session = getSession(boardId, sessionId);

    if (session === null) { return; }

    const card = boards[boardId].cards[id];

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
    } else {
      console.log("cannot star")
      console.log("card", card)
    }
  });
});

