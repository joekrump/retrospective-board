import * as React from "react";
import { Switch } from "../Switch/Switch";
import { GitHubLink } from "./GitHubLink";
import { useOvermind } from "../../overmind";
import { AppLogo } from "../AppLogo/AppLogo";

import "./header.css";
import { AppMode } from "../../overmind/state";
import { TimerDisplay } from "./TimerDisplay/TimerDisplay";
interface HeaderProps {
  socket: SocketIOClient.Socket;
  boardId: string;
  timerClockMS: number;
}

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

  return (
    <header className="app-header">
      <div id="logo">
        <AppLogo />
        <h2>Retro</h2>
      </div>
      <div className="middle-header">
        <TimerDisplay timerClockMS={props.timerClockMS} socket={props.socket} boardId={props.boardId} />
        { isReviewing() ? <h1 data-cy="reviewing-header">Reviewing</h1> : null }
      </div>
      <div id="app-controls">
        <h4>Review</h4>
        <Switch id="toggle-app-state" isOn={isReviewing()} handleChange={(e) => toggleShowResults(e)}/>
        <GitHubLink width={24} height={24} />
      </div>
    </header>
  );
}
