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
    <header id="top-header">
      <div id="logo">
        <AppLogo />
        <h2>Retro</h2>
      </div>
      { isReviewing() ? <h1>Reviewing</h1> : null }
      <div id="app-controls">
        <h4>Review</h4>
        <Switch id="toggle-app-state" isOn={isReviewing()} handleChange={(e) => toggleShowResults(e)}/>
        <GitHubLink width={24} height={24} />
      </div>
    </header>
  );
}
