import React, { FormEvent, MouseEvent, useRef } from "react";

import "./Timer.css";

const millisecondsPerSecond = 1000;
const secondsPerMinute = 60;
const minutesPerHour = 60;
const millisecondsPerHour = millisecondsPerSecond * secondsPerMinute * minutesPerHour;
const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute;

function calculateTimeDurationInMilliseconds(minutes: number, seconds: number) {
  const millisecondsPerSeconds = 1000;
  const secondsPerMinute = 60;
  const durationMilliseconds =
    (minutes * secondsPerMinute * millisecondsPerSeconds) +
    (seconds * millisecondsPerSecond);

  return durationMilliseconds;
}

function getFormattedRemainingTimerTime(timerClockMS: number): string {
  // FIXME: this can probably be made more efficient.
  const hours = Math.floor(timerClockMS / millisecondsPerHour);
  const minutes = Math.floor((timerClockMS - (hours * millisecondsPerHour)) /millisecondsPerMinute);
  const seconds = ((timerClockMS - (minutes * millisecondsPerMinute) - (hours * millisecondsPerHour)) / millisecondsPerSecond);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export const Timer = ({ socket, boardId, remainingTimeMS, state }: {
  socket: SocketIOClient.Socket,
  boardId: string,
  remainingTimeMS: number,
  state: "running" | "paused" | "stopped",
}) => {
  let minutesInputRef = useRef<HTMLInputElement>(null);
  let secondsInputRef = useRef<HTMLInputElement>(null);
  const specialInitialTimerMS = -1;

  function stopTimer(e: MouseEvent) {
    const sessionId = sessionStorage.getItem("retroSessionId");
    e.preventDefault();
    socket.emit(`board:timer-stop`, { boardId, sessionId });
  }

  function toggleTimerRunning(e: FormEvent) {
    const sessionId = sessionStorage.getItem("retroSessionId");
    e.preventDefault();

    if (state === "running") {
      socket.emit(`board:timer-pause`, { boardId, sessionId });
    } else if (state === "paused") {
      socket.emit(`board:timer-start`, {
        boardId,
        sessionId,
        durationMS: remainingTimeMS,
      });
    } else {
      socket.emit(`board:timer-start`, {
        boardId,
        sessionId,
        durationMS: calculateTimeDurationInMilliseconds(
          parseInt(minutesInputRef?.current?.value ?? "1"),
          parseInt(secondsInputRef?.current?.value ?? "1"),
        )
      });
    }

    return false;
  }

  if (remainingTimeMS === specialInitialTimerMS) {
    return null;
  } else if (state === "running" || state === "paused") {
    return (
      <div className="timer-display">
        <span className="gg-timer"></span>
        <h4 className="digits">{ getFormattedRemainingTimerTime(remainingTimeMS) }</h4>
        <form className="timer-control" onSubmit={toggleTimerRunning}>
          <button type="submit">
            <span className={`gg-play-${state === "running" ? "pause" : "button"}`}></span>
          </button>
          <button type="button" onClick={stopTimer}>
            <span className="gg-play-stop"></span>
          </button>
        </form>
      </div>
    )
  } else {
    return (
      <form className="timer-control" onSubmit={toggleTimerRunning}>
        <div className="timer-display">
          <span className="gg-timer"></span>
          <input name="minutes" type="number" min="0" ref={minutesInputRef} defaultValue={30}/>m
          <input name="seconds" type="number" min="0" ref={secondsInputRef} defaultValue={0}/>s
          <button type="submit"><span className="gg-play-button"></span></button>
        </div>
      </form>
    );
  }
};
