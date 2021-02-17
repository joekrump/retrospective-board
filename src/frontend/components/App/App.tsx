import React, { useState, useEffect } from "react";
import * as io from "socket.io-client";
import * as uuid from "uuid";
import { useOvermind } from "../../overmind";

import "./app.css";

import { Header } from "../Header/Header";
import { Board } from "../Board/Board";
import { AppMode } from "../../overmind/state";
import { Board as IBoard } from "../../../@types";

const LOCAL_DEV_SERVER_PORT = "4000";
const SERVER_PORT = "8000";

export const App = () => {
  const { actions: { updateMode} } = useOvermind();
  const initialCSSBackgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--app--background-color")
    .trim();
  // Get the last 2 characters of the hex value.
  // These will be assumed to be the hex value that is assign to r, g, and b.
  // Ex. If "e6", then it will be assumed the initial bg color is #e6e6e6.
  const initialBackgroundColorHexValue = initialCSSBackgroundColor.substr(initialCSSBackgroundColor.length - 2);
  const initialBackgroundColor = parseInt(`0x${initialBackgroundColorHexValue}`, 16);
  let serverURL = window.location.origin;
  let initialBoardId = window.location.pathname.split("/").pop() || "";

  if (window.location.port === LOCAL_DEV_SERVER_PORT) {
    serverURL = window.location.origin.replace(window.location.port, SERVER_PORT);
    initialBoardId = "dev-board";
  } else if (!initialBoardId) {
    initialBoardId = uuid.v4();
    window.location.assign(`/board/${initialBoardId}`);
  }

  const socket = io.connect(serverURL);
  const [boardId] = useState(initialBoardId);
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

  function updateClock(timeMS: number) {
    // set time
  }

  useEffect(function onMount() {
    const sessionId = sessionStorage.getItem("retroSessionId");
    socket.on(`board:loaded:${boardId}`, (
      data: { board: IBoard, sessionId: string, remainingStars: number, showResults: boolean },
    ) => {
      updateMode(data.showResults ? AppMode.review : AppMode.vote);
    });
    socket.on(`board:star-limit-reached:${boardId}`, (data: { maxStars: number }) => {
      displayStarLimitAlert(data.maxStars);
    });

    socket.on(`board:show-results:${boardId}`, (data: { showResults: boolean }) => {
      updateMode(data.showResults ? AppMode.review : AppMode.vote);
    });
    socket.on(`board:timer-tick:${boardId}`, ({ remainingTimeMS }: { remainingTimeMS: number }) => {
      updateClock(remainingTimeMS);
    });
    socket.on(`board:darken-app-tick:${boardId}`, ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
      if (totalSteps > currentStep) {
        darkenTheApp((totalSteps - currentStep) / totalSteps);
      }
    });

    socket.emit("board:loaded", {
      boardId,
      sessionId,
    });

    return function cleanup() {
      socket.removeListener(`board:star-limit-reached:${boardId}`);
      socket.removeListener(`board:show-results:${boardId}`);
      socket.removeListener(`board:darken-app-tick:${boardId}`);
      socket.removeListener(`board:timer-tick:${boardId}`);
      socket.close();
    };
  }, []);

  function darkenTheApp(percentageTimeRemainingInRetroStage: number) {
    const theseHoldForWhiteText = 0x70;
    const newHexColor = Math.floor(initialBackgroundColor * percentageTimeRemainingInRetroStage);
    const newHexColorString = newHexColor.toString(16);
    const newBackgroundColor = `#${newHexColorString}${newHexColorString}${newHexColorString}`;

    if (newHexColor < theseHoldForWhiteText) {
      document.documentElement.style.setProperty("--text-color-primary", "#e6e6e6");
    }
    document.documentElement.style.setProperty("--app--background-color", `${newBackgroundColor}`);
  }

  return (
    <>
      <Header
        socket={socket}
        boardId={boardId}
      />
      <Board
        socket={socket}
        boardId={boardId}
      />
      <div className={`alert alert-star-limit ${showStarLimitAlert ? "alert--show" : ""}`}>
        Your voting limit of {maxStars} has been reached. Undo previous stars if you want some back.
      </div>
    </>
  );
}
