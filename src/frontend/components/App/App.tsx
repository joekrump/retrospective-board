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

    socket.emit("board:loaded", {
      boardId,
      sessionId,
    });

    const intervalId = updateBackgroundColorIncrementally();

    return function cleanup() {
      socket.removeListener(`board:star-limit-reached:${boardId}`);
      socket.removeListener(`board:show-results:${boardId}`);
      socket.close();
      clearInterval(intervalId);
    };
  }, []);

  function updateBackgroundColorIncrementally() {
    const tenSeconds = 1000;
    const initialCSSBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--app--background-color');
    // remove # prefix from the color string value so that we get an hex number that we can parse.
    const initialBackgroundColorHexValue = initialCSSBackgroundColor.trim().substr(1);
    const initialBackgroundColor = parseInt(`0x${initialBackgroundColorHexValue}`, 16);
    let newBackgroundColor = initialBackgroundColor;

    const intervalId = setInterval(() => {
      // subtract 15 (0x0F) from each rgb hex value to make the overall color darker.
      newBackgroundColor -= 0x0F0F0F;
      // If the integer number of the color is less than 6 characters long (100000 being the smallest 6 character long hex value), then stop making things darker because subracting further will result in an invalid CSS hex color value and the color will switch back to the browser's default background color value.
      if (newBackgroundColor < 0x100000) {
        clearInterval(intervalId);
        return;
      }
      updateAppThemeOnTick(newBackgroundColor);
    }, tenSeconds);

    return intervalId;
  }

  function updateAppThemeOnTick(newBackgroundColor: number) {
    const darkGray = 0x707070;

    if (newBackgroundColor < darkGray) {
      document.documentElement.style.setProperty("--text-color-primary", "#e6e6e6");
    }
    document.documentElement.style.setProperty("--app--background-color", `#${newBackgroundColor.toString(16)}`);
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
