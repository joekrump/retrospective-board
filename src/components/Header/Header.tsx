import * as React from "react";
import "./header.css";

interface HeaderProps {
  showResults: boolean;
  socket: SocketIOClient.Socket;
  boardId: string;
}

export class Header extends React.Component<HeaderProps> {

  toggleShowResults(e: React.MouseEvent) {
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
          <div id="app-controls">
            <button onClick={(e) => this.toggleShowResults(e)}>
              { this.props.showResults ? "Hide Results" : "Show Results"}
            </button>
          </div>
        </div>
      </header>
    );
  }
}
