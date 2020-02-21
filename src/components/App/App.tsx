import * as React from "react";
import * as io from "socket.io-client";
import * as uuid from "uuid";

import "./app.css";

import { Header } from "../Header/Header";
import { Main } from "../Main/Main";

interface AppState {
  boardId: string;
  socket: SocketIOClient.Socket;
  maxStars?: number;
  showStarLimitAlert: boolean;
  showResults: boolean;
}

export class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);

    let serverURL = window.location.origin;
    let boardId = window.location.pathname.split("board/").pop() || "";

    if (!boardId) {
      boardId = uuid.v4();
      window.location.assign(`/board/${boardId}`);
    }

    this.state = {
      boardId,
      socket: io.connect(serverURL),
      showStarLimitAlert: false,
      showResults: false
    };
  }

  private setHideStarLimitAlertTimeout(timeoutMS = 3000) {
    setTimeout(() => {
      this.setState({
        showStarLimitAlert: false,
      });
    }, timeoutMS);
  }

  private displayStarLimitAlert(maxStars: number) {
    this.setState({
      maxStars,
      showStarLimitAlert: true,
    });

    this.setHideStarLimitAlertTimeout();
  }

  componentDidMount() {
    const sessionId = sessionStorage.getItem("retroSessionId");
    this.state.socket.on(`board:loaded:${this.state.boardId}`, (
      data: { board: Board, sessionId: string, remainingStars: number, showResults: boolean },
    ) => {
      this.setState({ showResults: data.showResults });
    });
    this.state.socket.on(`board:star-limit-reached:${this.state.boardId}`, (data: { maxStars: number }) => {
      this.displayStarLimitAlert(data.maxStars);
    });

    this.state.socket.on(`board:show-results:${this.state.boardId}`, (data: { showResults: boolean }) => {
      this.setState({showResults: data.showResults})
    });

    this.state.socket.emit("board:loaded", {
      boardId: this.state.boardId,
      sessionId,
    });
  }

  componentWillUnmount() {
    this.state.socket.removeListener(`board:star-limit-reached:${this.state.boardId}`);
    this.state.socket.removeListener(`board:show-results:${this.state.boardId}`);
    this.state.socket.close();
  }

  render() {
    return (
      <>
        <Header
          showResults={this.state.showResults}
          socket={this.state.socket}
          boardId={this.state.boardId}
        />
        <Main
          socket={this.state.socket}
          boardId={this.state.boardId}
          showResults={this.state.showResults}
        />
        <div className={`alert alert-star-limit ${this.state.showStarLimitAlert ? "alert--show" : ""}`}>
          Your voting limit of {this.state.maxStars} has been reached. Undo previous stars if you want some back.
        </div>
      </>
    );
  }
}
