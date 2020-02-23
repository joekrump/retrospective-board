import * as React from "react";
import { Switch } from "../Switch/Switch";
import { GitHubLink } from "./GitHubLink";

import "./header.css";
interface HeaderProps {
  showResults: boolean;
  socket: SocketIOClient.Socket;
  boardId: string;
}

export class Header extends React.Component<HeaderProps> {

  toggleShowResults(e: React.ChangeEvent) {
    e.preventDefault();
    // emit an event to show results.
    this.props.socket.emit(`board:show-results`, {
      boardId: this.props.boardId,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
  }

  render() {
    return (
      <header>
        <div id="top-header">
          <div id="logo">
            <div className="text">Retro</div>
          </div>
          { this.props.showResults ? <h1>Reviewing</h1> : null }
          <div id="app-controls">
            <h3>Review</h3>
            <Switch id="toggle-app-state" isOn={this.props.showResults} handleChange={(e) => this.toggleShowResults(e)}/>
            <GitHubLink width={24} height={24} />
          </div>
        </div>
      </header>
    );
  }
}
