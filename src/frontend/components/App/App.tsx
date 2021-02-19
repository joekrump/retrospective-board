import React, { useState, useEffect, lazy, Suspense } from "react";
import { connect as socketConnect } from "socket.io-client";
import { v4 as uuidV4} from "uuid";
import { useOvermind } from "../../overmind";

import "./app.css";

const Header = lazy(() => import("../Header/Header"));
const Board = lazy(() => import("../Board/Board"));
import { AppMode } from "../../overmind/state";
import { Board as IBoard, Column as IColumn } from "../../../@types";

const LOCAL_DEV_SERVER_PORT = "4000";
const SERVER_PORT = "8000";

export const App = () => {
  const { state: { sessionId }, actions: { updateMode, updateSessionId, setBoardState, updateBoard, updateRemainingStars } } = useOvermind();
  let [timerClockRemainingMS, updateTimeClockRemainingMS] = useState(-1);
  let [timerState, updateTimerState]: ["running" | "paused" | "stopped", Function] = useState("stopped");
  let serverURL = window.location.origin;
  let boardId = window.location.pathname.split("/").pop() ?? uuidV4();

  if (window.location.port === LOCAL_DEV_SERVER_PORT) {
    serverURL = window.location.origin.replace(window.location.port, SERVER_PORT);
    boardId = "dev-board";
  } else {
    window.location.assign(`/board/${boardId}`);
  }

  const socket = socketConnect(serverURL);
  const [maxStars, setMaxStars] = useState(null as unknown as number);
  const [showStarLimitAlert, updateShowStarLimitAlert] = useState(false);

  function setHideStarLimitAlertTimeout(timeoutMS = 3000) {
    setTimeout(function hideAlert() {
      updateShowStarLimitAlert(false);
    }, timeoutMS);
  }

  function displayStarLimitAlert(maxStars: number) {
    setMaxStars(maxStars);
    updateShowStarLimitAlert(true);
    setHideStarLimitAlertTimeout();
  }

  function updateTimerClock(timeMS: number) {
    updateTimeClockRemainingMS(timeMS);
  }

  useEffect(function onMount() {
    socket.on(`board:loaded:${boardId}`, (
      data: {
        board: IBoard,
        sessionId: string,
        remainingStars: number,
        showResults: boolean,
      },
    ) => {
      updateMode(data.showResults ? AppMode.review : AppMode.vote);
      updateTimerState(data.board.timerState);
      updateTimeClockRemainingMS(data.board.timerRemainingMS);
      const initialColumns = data.board.columns.map((column: IColumn) => ({
        ...column,
        isEditing: false
      }));
      updateBoard({
        id: boardId,
        title: data.board.title,
      });
      updateRemainingStars(data.remainingStars);
      sessionStorage.setItem("retroSessionId", data.sessionId);
      updateSessionId(data.sessionId);
      setBoardState({
        columns: initialColumns,
        cards: data.board.cards,
      });
    });

    socket.on(`board:update-remaining-stars:${boardId}:${sessionId}`, (data: any) => {
      updateRemainingStars(data.remainingStars);
    });

    socket.on(`board:star-limit-reached:${boardId}`, (data: { maxStars: number }) => {
      displayStarLimitAlert(data.maxStars);
    });

    socket.on(`board:show-results:${boardId}`, (data: { showResults: boolean }) => {
      updateMode(data.showResults ? AppMode.review : AppMode.vote);
    });
    socket.on(`board:timer-tick:${boardId}`, ({ remainingTimeMS, state }: { remainingTimeMS: number, state: "running" | "paused" | "stopped" }) => {
      updateTimerClock(remainingTimeMS);
      updateTimerState(state);
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

  function renderLoading() {
    return <div>Loading...</div>
  }

  return (
    <Suspense fallback={renderLoading()}>
      <Header
        socket={socket}
        boardId={boardId}
        timerClockMS={timerClockRemainingMS}
        timerState={timerState}
      />
      <Board
        socket={socket}
      />
      <div className={`alert alert-star-limit ${showStarLimitAlert ? "alert--show" : ""}`}>
        Your voting limit of {maxStars} has been reached. Undo previous stars if you want some back.
      </div>
    </Suspense>
  );
}
