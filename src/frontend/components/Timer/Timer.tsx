import React, { FormEvent, useRef, useState } from "react";

import "./Timer.css";

function calculateTimeDurationInMilliseconds(unitSelected: string, numberInput: number) {
  const millisecondsPerSeconds = 1000;
  const secondsPerMinute = 60;
  let multiplier: number = millisecondsPerSeconds;

  if (unitSelected === "min") {
    multiplier = secondsPerMinute * millisecondsPerSeconds;
  }
  return numberInput * multiplier
}

export const Timer = ({ socket, boardId, formattedTimeRemaining }: {
  socket: SocketIOClient.Socket,
  boardId: string,
  formattedTimeRemaining: string | null,
}) => {
  let unitSelectRef = useRef<HTMLSelectElement>(null);
  let numberInputRef = useRef<HTMLInputElement>(null);
  let [isTimerRunning, updateIsTimerRunning] = useState(formattedTimeRemaining !== null);

  function submit(e: FormEvent) {
    e.preventDefault();

    if (isTimerRunning) {
      // TODO: pause timer
      updateIsTimerRunning(false);
    } else {
      socket.emit(`board:start-timer`, {
        boardId,
        durationMS: calculateTimeDurationInMilliseconds(
          unitSelectRef?.current?.value ?? "",
          parseInt(numberInputRef?.current?.value ?? "1"),
        )
      });
      updateIsTimerRunning(true);
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
      { isTimerRunning ? formattedTimeRemaining : null }
      <form className="timer-control" onSubmit={submit}>
        { isTimerRunning ? null : timerConfigUI() }
        <button type="submit">{isTimerRunning ? "pause" : "start"}</button>
      </form>
    </>
  );
};
