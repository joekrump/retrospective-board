import React from "react";

import "./TimerDisplay.css";

const millisecondsPerSecond = 1000;
const secondsPerMinute = 60;
const minutesPerHour = 60;
const millisecondsPerHour = millisecondsPerSecond * secondsPerMinute * minutesPerHour;
const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute;

export const TimerDisplay = ({ timerClockMS }: { timerClockMS: number }) => {
  function getFormattedRemainingTimerTime(timerClockMS: number): string {
    // FIXME: this can probably be made more efficient.
    const hours = Math.floor(timerClockMS / millisecondsPerHour);
    const minutes = Math.floor((timerClockMS - (hours * millisecondsPerHour)) /millisecondsPerMinute);
    const seconds = ((timerClockMS - (minutes * millisecondsPerMinute) - (hours * millisecondsPerHour)) / millisecondsPerSecond);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <div className={"timer-display" + (timerClockMS <= 0 ? " hidden" : "")}>
      <h3>Remaining Time:</h3>
      <strong className="digits">{getFormattedRemainingTimerTime(timerClockMS)}</strong>
    </div>
  );
};
