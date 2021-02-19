import * as React from "react";
import { Switch } from "../Switch/Switch";
import { GitHubLink } from "./GitHubLink";
import { useOvermind } from "../../overmind";
import { AppLogo } from "../AppLogo/AppLogo";

import "./header.css";
import { AppMode } from "../../overmind/state";
import { Timer } from "../Timer/Timer";
interface HeaderProps {
  socket: SocketIOClient.Socket;
  boardId: string;
  timerClockMS: number;
  timerState: "running" | "paused" | "stopped";
}

const Header = (props: HeaderProps) => {
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
      <div className="header-middle">
        { isReviewing() ? <h2 data-cy="reviewing-header">Reviewing</h2> : null }
        <Timer remainingTimeMS={props.timerClockMS} state={props.timerState} socket={props.socket} boardId={props.boardId} />
      </div>
      <div id="app-controls">
        <h4>Review</h4>
        <Switch id="toggle-app-state" isOn={isReviewing()} handleChange={(e) => toggleShowResults(e)}/>
        <GitHubLink width={24} height={24} />
      </div>
    </header>
  );
}

export default Header;
