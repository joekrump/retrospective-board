import React, { FormEvent, useRef, useState } from "react";

import "./Timer.css";

const millisecondsPerSecond = 1000;
const secondsPerMinute = 60;
const minutesPerHour = 60;
const millisecondsPerHour = millisecondsPerSecond * secondsPerMinute * minutesPerHour;
const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute;

function calculateTimeDurationInMilliseconds(unitSelected: string, numberInput: number) {
  const millisecondsPerSeconds = 1000;
  const secondsPerMinute = 60;
  let multiplier: number = millisecondsPerSeconds;

  if (unitSelected === "min") {
    multiplier = secondsPerMinute * millisecondsPerSeconds;
  }
  return numberInput * multiplier
}

function getFormattedRemainingTimerTime(timerClockMS: number): string {
  // FIXME: this can probably be made more efficient.
  const hours = Math.floor(timerClockMS / millisecondsPerHour);
  const minutes = Math.floor((timerClockMS - (hours * millisecondsPerHour)) /millisecondsPerMinute);
  const seconds = ((timerClockMS - (minutes * millisecondsPerMinute) - (hours * millisecondsPerHour)) / millisecondsPerSecond);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export const Timer = ({ socket, boardId, timerClockMS }: {
  socket: SocketIOClient.Socket,
  boardId: string,
  timerClockMS: number,
}) => {
  let unitSelectRef = useRef<HTMLSelectElement>(null);
  let numberInputRef = useRef<HTMLInputElement>(null);
  const isTimerRunning = timerClockMS > 0;

  function submit(e: FormEvent) {
    e.preventDefault();

    if (isTimerRunning) {
      // TODO: pause timer
    } else {
      socket.emit(`board:start-timer`, {
        boardId,
        durationMS: calculateTimeDurationInMilliseconds(
          unitSelectRef?.current?.value ?? "",
          parseInt(numberInputRef?.current?.value ?? "1"),
        )
      });
    }

    return false;
  }

  function timerConfigUI() {
    return (
      <>
        <input type="number" min="1" ref={numberInputRef} defaultValue={30}/>
        <select defaultValue="min" ref={unitSelectRef}>
          <option value="sec">seconds</option>
          <option value="min">minutes</option>
        </select>
      </>
    );
  }

  return (
    <>
      { isTimerRunning ? getFormattedRemainingTimerTime(timerClockMS) : null }
      <form className="timer-control" onSubmit={submit}>
        { isTimerRunning ? null : timerConfigUI() }
        <button type="submit">{isTimerRunning ? "pause" : "start"}</button>
      </form>
    </>
  );
};
