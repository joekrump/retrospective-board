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
    let boardId = window.location.pathname.split("/").pop() || "";

    if (!!window.location.port && (window.location.port !== "8000")) {
      serverURL = window.location.origin.replace(window.location.port, "8000");
      boardId = uuid.v4();
    } else if (!boardId) {
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

  componentDidMount() {
    const sessionId = sessionStorage.getItem("retroSessionId");

    this.state.socket.emit("board:loaded", {
      boardId: this.state.boardId,
      sessionId,
    });
    this.state.socket.on(`board:star-limit-reached:${this.state.boardId}`, (data: { maxStars: number }) => {
      this.displayStarLimitAlert(data.maxStars);
    });

    this.state.socket.on(`board:show-results:${this.state.boardId}`, (data: { showResults: boolean }) => {
      this.setState({showResults: data.showResults})
    });
  }

  private displayStarLimitAlert(maxStars: number) {
    this.setState({
      maxStars,
      showStarLimitAlert: true,
    });

    setTimeout(() => {
      this.setState({
        showStarLimitAlert: false,
      })
    }, 3000);
  }

  componentWillUnmount() {
    this.state.socket.removeListener(`board:star-limit-reached:${this.state.boardId}`);
    this.state.socket.removeListener(`board:show-results:${this.state.boardId}`);
    this.state.socket.close();
  }

  render() {
    return (
      <>
        <Header showResults={this.state.showResults} socket={this.state.socket} boardId={this.state.boardId}></Header>
        <Main socket={this.state.socket} boardId={this.state.boardId} showResults={this.state.showResults}></Main>
        <div className={"alert alert-star-limit" + (this.state.showStarLimitAlert ? " alert--show" : "")}>
          Your voting limit of {this.state.maxStars} has been reached. Undo previous stars if you want some back.
        </div>
      </>
    );
  }
}
