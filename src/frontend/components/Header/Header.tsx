import * as React from "react";
import { Switch } from "../Switch/Switch";
import { GitHubLink } from "./GitHubLink";
import { useOvermind } from "../../overmind";
import { AppLogo } from "../AppLogo/AppLogo";

import "./header.css";
import { AppMode } from "../../overmind/state";
interface HeaderProps {
  socket: SocketIOClient.Socket;
  boardId: string;
  timerClockMS: number;
}

const millisecondsPerSecond = 1000;
const secondsPerMinute = 60;
const minutesPerHour = 60;
const millisecondsPerHour = millisecondsPerSecond * secondsPerMinute * minutesPerHour;
const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute;

export const Header = (props: HeaderProps) => {
  let { state } = useOvermind();

  function toggleShowResults(e: React.ChangeEvent) {
    e.preventDefault();
    // emit an event to show results.
    props.socket.emit(`board:show-results`, {
      boardId: props.boardId,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
  }

  function isReviewing() {
    return state.mode === AppMode.review;
  }

  function getFormattedRemainingTimerTime(timerClockMS: number): string {
    // FIXME: this can probably be made more efficient.
    const hours = Math.floor(timerClockMS / millisecondsPerHour);
    const minutes = Math.floor((timerClockMS - (hours * millisecondsPerHour)) /millisecondsPerMinute);
    const seconds = ((timerClockMS - (minutes * millisecondsPerMinute) - (hours * millisecondsPerHour)) / millisecondsPerSecond);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function getCurrentTimer() {
    return (
      <div className="timer-display">
        <h3>Remaining Time:</h3>
        <strong className="digits">{getFormattedRemainingTimerTime(props.timerClockMS)}</strong>
      </div>
    );
  }

  return (
    <header id="header">
      <div id="logo">
        <AppLogo />
        <h2>Retro</h2>
      </div>
      { props.timerClockMS > 0 ? getCurrentTimer(): null}
      { isReviewing() ? <h1 data-cy="reviewing-header">Reviewing</h1> : null }
      <div id="app-controls">
        <h4>Review</h4>
        <Switch id="toggle-app-state" isOn={isReviewing()} handleChange={(e) => toggleShowResults(e)}/>
        <GitHubLink width={24} height={24} />
      </div>
    </header>
  );
}
