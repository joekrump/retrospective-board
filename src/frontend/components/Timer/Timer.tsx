import React, { FormEvent, MouseEvent, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useOvermind } from "../../overmind";

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

export const Timer = ({ socket }: { socket: Socket }) => {
  let minutesInputRef = useRef<HTMLInputElement>(null);
  let secondsInputRef = useRef<HTMLInputElement>(null);
  let { state: { sessionId, board, timer } } = useOvermind();
  const specialInitialTimerMS = -1;

  function stopTimer(e: MouseEvent) {
    e.preventDefault();
    socket.emit(`board:timer-stop`, { boardId: board.id, sessionId });
  }

  function toggleTimerRunning(e: FormEvent) {
    e.preventDefault();
    console.log(board.id)
    if (timer.status === "running") {
      socket.emit(`board:timer-pause`, { boardId: board.id, sessionId });
    } else if (timer.status === "paused") {
      socket.emit(`board:timer-start`, {
        boardId: board.id,
        sessionId,
        durationMS: timer.remainingMS,
      });
    } else {
      console.log("START NEW TIMER")
      socket.emit(`board:timer-start`, {
        boardId: board.id,
        sessionId,
        durationMS: calculateTimeDurationInMilliseconds(
          parseInt(minutesInputRef?.current?.value ?? "1"),
          parseInt(secondsInputRef?.current?.value ?? "1"),
        )
      });
    }

    return false;
  }

  if (timer.remainingMS === specialInitialTimerMS) {
    return null;
  } else if (timer.status === "running" || timer.status === "paused") {
    return (
      <div className="timer-display">
        <span className="gg-timer"></span>
        <h4 className="digits">{ getFormattedRemainingTimerTime(timer.remainingMS) }</h4>
        <form className="timer-control" onSubmit={toggleTimerRunning}>
          <button type="submit">
            <span className={`gg-play-${timer.status === "running" ? "pause" : "button"}`}></span>
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
