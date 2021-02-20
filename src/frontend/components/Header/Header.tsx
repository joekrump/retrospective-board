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
}

const Header = (props: HeaderProps) => {
  let { state: { sessionId, mode, board } } = useOvermind();

  function toggleShowResults(e: React.ChangeEvent) {
    e.preventDefault();
    // emit an event to show results.
    props.socket.emit(`board:show-results`, {
      boardId: board.id,
      sessionId,
    });
  }

  function isReviewing() {
    return mode === AppMode.review;
  }

  return (
    <header className="app-header">
      <div id="logo">
        <AppLogo />
        <h2>Retro</h2>
      </div>
      <div className="header-middle">
        <Timer socket={props.socket} />
      </div>
      <div id="app-controls">
        <h4>View Results</h4>
        <Switch id="toggle-app-state" isOn={isReviewing()} handleChange={(e) => toggleShowResults(e)}/>
        <GitHubLink width={24} height={24} />
      </div>
    </header>
  );
}

export default Header;
