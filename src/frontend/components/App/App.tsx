import React, { useState, useEffect, lazy, Suspense } from "react";
import { connect as socketConnect } from "socket.io-client";
import { v4 as uuidV4} from "uuid";
import { useOvermind } from "../../overmind";
import { AppErrorBoundary } from "../ErrorBoundaries/AppErrorBoundary";

import "./app.css";

const Header = lazy(() => import("../Header/Header"));
const Board = lazy(() => import("../Board/Board"));
import { AppMode } from "../../overmind/state";
import { Board as IBoard, Column as IColumn } from "../../../@types";

const LOCAL_DEV_SERVER_PORT = "4000";
const SERVER_PORT = "8000";

export const App = () => {
  const { state: { sessionId, board }, actions: { updateMode, updateSessionId, setBoardState, updateBoard, updateRemainingStars, updateTimer } } = useOvermind();
  let serverURL = window.location.origin;
  let boardId = window.location.pathname.split("/").pop()

  if (window.location.port === LOCAL_DEV_SERVER_PORT) {
    serverURL = window.location.origin.replace(window.location.port, SERVER_PORT);
    boardId = "dev-board";
  } else if (!boardId) {
    boardId = uuidV4();
    window.location.assign(`/board/${boardId}`);
  }

  const socket = socketConnect(serverURL);
  const [showStarLimitAlert, updateShowStarLimitAlert] = useState(false);

  function setHideStarLimitAlertTimeout(timeoutMS = 3000) {
    setTimeout(function hideAlert() {
      updateShowStarLimitAlert(false);
    }, timeoutMS);
  }

  function displayStarLimitAlert() {
    updateShowStarLimitAlert(true);
    setHideStarLimitAlertTimeout();
  }

  useEffect(function onMount() {
    socket.on(`board:loaded:${boardId}`, ({
      board,
      sessionId,
      remainingStars,
    }: {
      board: IBoard,
      sessionId: string,
      remainingStars: number,
    }) => {
      updateMode(board.showResults ? AppMode.review : AppMode.active);
      updateTimer({
        remainingMS: board.timerRemainingMS,
        status: board.timerStatus,
      });
      const initialColumns = board.columns.map((column: IColumn) => ({
        ...column,
        isEditing: false
      }));
      updateBoard({
        id: boardId,
        title: board.title,
        maxStarsPerUser: board.maxStarsPerUser,
      });
      updateRemainingStars(remainingStars);
      sessionStorage.setItem("retroSessionId", sessionId);
      updateSessionId(sessionId);
      setBoardState({
        columns: initialColumns,
        cards: board.cards,
      });
    });

    socket.on(`board:star-limit-reached:${boardId}`, (data: { maxStars: number }) => {
      displayStarLimitAlert();
    });

    socket.on(`board:show-results:${boardId}`, (data: { showResults: boolean }) => {
      updateMode(data.showResults ? AppMode.review : AppMode.active);
    });
    socket.on(`board:timer-tick:${boardId}`, ({ remainingMS, status }: { remainingMS: number, status: "running" | "paused" | "stopped" }) => {
      updateTimer({
        status,
        remainingMS,
      });
    });

    socket.emit("board:loaded", {
      boardId,
      sessionId,
    });

    return function cleanup() {
      socket.removeListener(`board:star-limit-reached:${boardId}`);
      socket.removeListener(`board:show-results:${boardId}`);
      socket.removeListener(`board:timer-tick:${boardId}`);
      socket.close();
    };
  }, []);

  useEffect(() => {
    socket.on(`board:update-remaining-stars:${boardId}:${sessionId}`, (data: any) => {
      updateRemainingStars(data.remainingStars);
    });

    return () => {
      socket.removeListener(`board:update-remaining-stars:${boardId}:${sessionId}`);
    };
  }, [sessionId]);

  function renderLoading() {
    return <div>Loading...</div>
  }

  return (
    <AppErrorBoundary>
      <Suspense fallback={renderLoading()}>
        <Header socket={socket} />
        <Board socket={socket} />
        <div className={`alert alert-star-limit ${showStarLimitAlert ? "alert--show" : ""}`}>
          Your ⭐️ limit of {board.maxStarsPerUser} has been reached. Undo previous stars if you want some back.
        </div>
      </Suspense>
    </AppErrorBoundary>
  );
}
