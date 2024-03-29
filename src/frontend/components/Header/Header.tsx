import * as React from "react";
import { Switch } from "../Switch/Switch";
import { GitHubLink } from "./GitHubLink";
import { useOvermind } from "../../overmind";
import { AppLogo } from "../AppLogo/AppLogo";

import "./header.css";
import { AppMode } from "../../overmind/state";
import { Timer } from "../Timer/Timer";
import type { Socket } from "socket.io-client";

interface HeaderProps {
  socket: Socket;
}

const Header = (props: HeaderProps) => {
  let { state: { mode, board } } = useOvermind();

  function toggleShowResults(e: React.ChangeEvent) {
    e.preventDefault();

    props.socket.emit(`board:show-results`, {
      boardId: board.id,
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
