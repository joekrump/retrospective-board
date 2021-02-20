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
const NEW_BOARD: Board = {
  title: `Retro - ${(new Date()).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`,
  showResults: false,
  starsPerUser: MAX_VOTES_USER_VOTE_PER_BOARD,
  cards: {},
  timerRemainingMS: 0,
  timerDurationMS: 0,
  timerStatus: "stopped",
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

function getSession(boardId: string, sessionId: string): Session | null {
  let session;
  if (sessionId !== undefined) {
    try {
      session = sessionStore[boardId][sessionId]
    } catch {
      session = null;
    }
  } else {
    session = null;
  }

  if (session === null || session === undefined) {
    console.error("Not a valid session");
    return null;
  } else {
    return session;
  }
}

function hasSession(boardId: string, sessionId: string) {
  return getSession(boardId, sessionId) !== null;
}

function reclaimStarsFromDeleteCard(card: Card, boardId: string) {
  Object.keys(card.stars).forEach(sessionId => {
    sessionStore[boardId][sessionId].remainingStars += Math.abs(card.stars[sessionId]);
  });
}

function emitBoardLoaded(socket: SocketIO.Socket, boardId: string, sessionId: string) {
  console.log(`board loaded: ${boardId}`);
  socket.emit(`board:loaded:${boardId}`, {
    board: boards[boardId],
    sessionId,
    remainingStars: sessionStore[boardId][sessionId].remainingStars,
  });
}

function updateRemainingStars(
  boardId: string,
  card: Card,
  session: Session,
  socket: SocketIO.Socket,
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

function canStar(remainingStars: number) {
  return remainingStars >= 0;
}

function emitUpdateRemainingStars(
  boardId: string,
  sessionId: string,
  socket: SocketIO.Socket,
) {
  socket.emit(`board:update-remaining-stars:${boardId}:${sessionId}`, {
    remainingStars: sessionStore[boardId][sessionId].remainingStars
  });
  socket.broadcast.emit(`board:update-remaining-stars:${boardId}:${sessionId}`, {
    remainingStars: sessionStore[boardId][sessionId].remainingStars
  });
}

function addNewCardToColumn({
  boardId,
  cardId,
  columnId,
  sessionId,
  text,
}: {
  boardId: string,
  cardId: string,
  columnId: string,
  sessionId: string,
  text: string,
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

io.on("connection", (socket) => {
  const handleShowBoardResults = ({
    boardId,
  }: {
    boardId: string,
  }) => {
    if (!!boards[boardId]) {
      boards[boardId].showResults = !boards[boardId].showResults;

      boards[boardId].columns.forEach((column) => {
        socket.emit(`column:loaded:${column.id}`, column);
        socket.broadcast.emit(`column:loaded:${column.id}`, column);
      });

      socket.emit(`board:show-results:${boardId}`, {
        showResults: boards[boardId].showResults,
      });
      socket.broadcast.emit(`board:show-results:${boardId}`, {
        showResults: boards[boardId].showResults,
      });
    }
  };

  const handleBoardLoaded = ({
    sessionId,
    boardId,
  }: {
    boardId: string,
    sessionId: string,
  }) => {
    sessionId = sessionId === "" ? uuid.v4() : sessionId;
    boardId = boardId ?? uuid.v4();

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
  };

  const handleBoardUpdated = ({
    boardId,
    sessionId,
    title,
  }: {
    boardId: string,
    sessionId: string,
    title: string,
  }) => {
    if (!hasSession(boardId, sessionId)) { return; }

    if (title !== undefined) {
      boards[boardId].title = title;
    }

    socket.broadcast.emit(`board:updated:${boardId}`, {
      title: boards[boardId].title,
    });
  };

  const handleBoardTimerStop = ({
    boardId,
    sessionId,
  }: {
    boardId: string,
    sessionId: string,
  }) => {
    console.log("timer stop request");
    if (!hasSession(boardId, sessionId)) { return; }

    clearInterval(boards[boardId].stepsIntervalId);
    boards[boardId].stepsIntervalId = undefined;
    boards[boardId].timerRemainingMS = 0;
    boards[boardId].timerDurationMS = 0;
    boards[boardId].timerStatus = "stopped";

    socket.emit(`board:timer-tick:${boardId}`, { remainingMS: 0, status: "stopped" });
    socket.broadcast.emit(`board:timer-tick:${boardId}`, { remainingMS: 0, status: "stopped" });
  };

  const handleBoardTimerPause = ({
    boardId,
    sessionId,
  }: {
    boardId: string,
    sessionId: string,
  }) => {
    console.log("timer pause request");
    if (!hasSession(boardId, sessionId)) { return; }

    boards[boardId].timerStatus = "paused";
    socket.emit(`board:timer-tick:${boardId}`, { remainingMS: boards[boardId].timerRemainingMS, status: "paused" });
    socket.broadcast.emit(`board:timer-tick:${boardId}`, { remainingMS: boards[boardId].timerRemainingMS, status: "paused" });
  };

  const handleBoardTimerStart = ({
    boardId,
    durationMS,
    sessionId,
  }: {
    boardId: string,
    durationMS: number,
    sessionId: string
  }) => {
    console.log("timer start request");
    if (!hasSession(boardId, sessionId)) { return; }
    const intervalFrequencyMS = 1000;

    boards[boardId].timerStatus = "running";
    boards[boardId].timerDurationMS = durationMS;
    boards[boardId].timerRemainingMS = durationMS;

    if (!boards[boardId]?.stepsIntervalId) {
      boards[boardId].stepsIntervalId = setInterval(() => {
        if (boards[boardId].timerStatus === "paused") { return; }
        if (boards[boardId].timerRemainingMS === 0) {
          clearInterval(boards[boardId].stepsIntervalId);
          boards[boardId].timerStatus = "stopped";
          boards[boardId].stepsIntervalId = undefined;
          return;
        }

        boards[boardId].timerRemainingMS = boards[boardId].timerRemainingMS - intervalFrequencyMS;

        socket.emit(`board:timer-tick:${boardId}`, {
          remainingMS: boards[boardId].timerRemainingMS,
          status: "running"
        });
        socket.broadcast.emit(`board:timer-tick:${boardId}`, {
          remainingMS: boards[boardId].timerRemainingMS,
          status: "running",
        });
      }, intervalFrequencyMS);
    }
  };

  const handleColumnCreated = ({
    boardId,
    id,
    name,
    sessionId,
  }: {
    boardId: string,
    id: string,
    name: string,
    sessionId: string,
  }) => {
    console.log("column create request");
    if (!hasSession(boardId, sessionId)) { return; }

    const newColumn = {
      id,
      name,
      cardIds: [],
    };

    boards[boardId].columns.push(newColumn);
    socket.broadcast.emit(`column:created:${boardId}`, newColumn);
  };

  const handleColumnUpdated = ({
    boardId,
    id,
    name,
    sessionId,
  }: {
    boardId: string,
    id: string,
    name: string,
    sessionId: string,
  }) => {
    console.log("column update request");
    if (!hasSession(boardId, sessionId)) { return; }

    const column = boards[boardId].columns.find((column) => column.id === id);
    if (column) {
      column.name = name;
      socket.broadcast.emit(`column:updated:${id}`, {
        name,
      });
    }
  };

  const handleColumnDeleted = ({
    boardId,
    id,
    sessionId,
  }: {
    boardId: string,
    id: string,
    sessionId: string,
  }) => {
    console.log("column delete request");
    if (!hasSession(boardId, sessionId)) { return; }
    let columnIndex = boards[boardId]?.columns.findIndex((column) => column.id === id);

    if (columnIndex !== -1) {
      const column = boards[boardId].columns[columnIndex];

      column?.cardIds?.forEach((cardId) => {
        reclaimStarsFromDeleteCard(boards[boardId].cards[cardId], boardId);
        delete boards[boardId].cards[cardId];
      });

      emitUpdateRemainingStars(boardId, sessionId, socket);

      boards[boardId]?.columns.splice(columnIndex, 1);
      socket.broadcast.emit(`column:deleted:${boardId}`, { id });
    } else  {
      console.error("No column found");
    }
  };

  const handleCardMoved = ({
    boardId,
    cardId,
    fromColumnId,
    sessionId,
    toColumnId,
  }: {
    boardId: string,
    cardId: string,
    fromColumnId: string,
    sessionId: string,
    toColumnId: string,
  }) => {
    console.log("card move request");
    if (!hasSession(boardId, sessionId)) { return; }

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
  };

  const handleCardCreated = ({
    boardId,
    cardId,
    columnId,
    sessionId,
    text,
  }: {
    boardId: string,
    cardId: string,
    columnId: string,
    sessionId: string,
    text: string,
  }) => {
    console.log("card create request")
    if (!hasSession(boardId, sessionId)) { return; }

    addNewCardToColumn({
      boardId,
      cardId,
      columnId,
      sessionId,
      text,
    });
  };

  const handleCardUpdated = ({
    boardId,
    cardId,
    sessionId,
    text,
  }: {
    boardId: string,
    cardId: string,
    sessionId: string,
    text: string,
  }) => {
    console.log("card update request");
    if (!hasSession(boardId, sessionId)) { return; }

    boards[boardId].cards[cardId].text = text;

    socket.broadcast.emit(`card:updated:${cardId}`, {
      text,
    });
  };

  const handleCardDeleted = ({
    boardId,
    cardId,
    columnId,
    sessionId,
  }: {
    boardId: string,
    cardId: string,
    columnId: string,
    sessionId: string,
  }) => {
    console.log("card delete request");
    if (!hasSession(boardId, sessionId)) { return; }
    const column = boards[boardId].columns.find((column) => column.id === columnId);

    if (column) {
      const card = boards[boardId].cards[cardId];

      if(card?.ownerId === sessionId) {
        const index = column.cardIds.indexOf(cardId);

        delete boards[boardId].cards[cardId];
        column.cardIds.splice(index, 1);

        reclaimStarsFromDeleteCard(card, boardId);
        emitUpdateRemainingStars(boardId, sessionId, socket);

        socket.broadcast.emit(`card:deleted:${boardId}`, {
          cardId,
        });
      }
    }
  };

  const handleCardStarred = ({
    boardId,
    id,
    sessionId,
    star,
  }: {
    boardId: string,
    columnId: string,
    id: string,
    sessionId: string,
    star: number,
  }) => {
    const session = getSession(boardId, sessionId);
    if (!hasSession(boardId, sessionId)) { return; }
    const card = boards[boardId].cards[id];

    if (card && canStar(session.remainingStars)) {
      updateRemainingStars(boardId, card, session, socket, star);
      const userStars = card.stars[session.id];
      const { starsCount } = card;

      socket.emit(`card:starred:${id}`, { starsCount, userStars });
      socket.broadcast.emit(`card:starred:${id}`, {
        starsCount,
      });

      socket.emit(`board:update-remaining-stars:${boardId}:${sessionId}`, {
        remainingStars: session.remainingStars,
      });
      socket.broadcast.emit(`board:update-remaining-stars:${boardId}:${sessionId}`, {
        remainingStars: session.remainingStars,
      });
    } else {
      console.error("cannot star card: ", card.id, card.columnId);
    }
  };

  socket.on("board:show-results", handleShowBoardResults);
  socket.on("board:loaded", handleBoardLoaded);
  socket.on("board:updated", handleBoardUpdated);
  socket.on("board:timer-stop", handleBoardTimerStop);
  socket.on("board:timer-pause", handleBoardTimerPause);
  socket.on("board:timer-start", handleBoardTimerStart);

  socket.on("column:created", handleColumnCreated);
  socket.on("column:updated", handleColumnUpdated);
  socket.on("column:deleted", handleColumnDeleted);

  socket.on("card:moved", handleCardMoved);
  socket.on("card:created", handleCardCreated);
  socket.on("card:updated", handleCardUpdated);
  socket.on("card:deleted", handleCardDeleted);
  socket.on("card:starred", handleCardStarred);
});

