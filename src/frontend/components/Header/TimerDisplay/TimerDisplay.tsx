import React from "react";
import { Timer } from "../../Timer/Timer";

import "./TimerDisplay.css";

const millisecondsPerSecond = 1000;
const secondsPerMinute = 60;
const minutesPerHour = 60;
const millisecondsPerHour = millisecondsPerSecond * secondsPerMinute * minutesPerHour;
const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute;

export const TimerDisplay = ({ timerClockMS, socket, boardId }: {
  timerClockMS: number,
  socket: SocketIOClient.Socket,
  boardId: string,
}) => {
  function getFormattedRemainingTimerTime(timerClockMS: number): string {
    // FIXME: this can probably be made more efficient.
    const hours = Math.floor(timerClockMS / millisecondsPerHour);
    const minutes = Math.floor((timerClockMS - (hours * millisecondsPerHour)) /millisecondsPerMinute);
    const seconds = ((timerClockMS - (minutes * millisecondsPerMinute) - (hours * millisecondsPerHour)) / millisecondsPerSecond);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return <Timer
    socket={socket}
    boardId={boardId}
    formattedTimeRemaining={timerClockMS < 0 ? null : getFormattedRemainingTimerTime(timerClockMS)}
  />;
};
