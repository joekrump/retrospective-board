import * as React from "react";
import { Switch } from "../Switch/Switch";
import { GitHubLink } from "./GitHubLink";
import { useOvermind } from "../../overmind";

import "./header.css";
import { State, AppMode } from "../../overmind/state";
interface HeaderProps {
  showResults: boolean;
  socket: SocketIOClient.Socket;
  boardId: string;
}

export const Header = (props: HeaderProps) => {
  let { state, actions } = useOvermind();

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
    <header>
      <div id="top-header">
        <h2 id="logo">Retro</h2>
        { props.showResults ? <h1>Reviewing</h1> : null }
        <div id="app-controls">
          <h4>Review</h4>
          <Switch id="toggle-app-state" isOn={props.showResults} handleChange={(e) => toggleShowResults(e)}/>
          <GitHubLink width={24} height={24} />
        </div>
      </div>
    </header>
  );
}
