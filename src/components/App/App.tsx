import * as React from "react";
import * as io from "socket.io-client";
import * as uuid from "uuid";

import "./app.css";

import { Header } from "../Header/Header";
import { Main } from "../Main/Main";

interface AppState {
  boardId: string;
  socket: SocketIOClient.Socket;
  maxVotes?: number;
  showVoteLimitAlert: boolean;
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
      showVoteLimitAlert: false,
      showResults: false
    };
  }

  componentDidMount() {
    this.state.socket.emit("board:loaded", {
      boardId: this.state.boardId,
    });
    this.state.socket.on(`board:vote-limit-reached:${this.state.boardId}`, (data: { maxVotes: number }) => {
      this.displayVoteLimitAlert(data.maxVotes);
    });

    this.state.socket.on(`board:show-results:${this.state.boardId}`, (data: { showResults: boolean }) => {
      this.setState({showResults: data.showResults})
    });
  }

  private displayVoteLimitAlert(maxVotes: number) {
    this.setState({
      maxVotes,
      showVoteLimitAlert: true,
    });

    setTimeout(() => {
      this.setState({
        showVoteLimitAlert: false,
      })
    }, 3000);
  }

  componentWillUnmount() {
    this.state.socket.removeListener(`board:vote-limit-reached:${this.state.boardId}`);
    this.state.socket.removeListener(`board:show-results:${this.state.boardId}`);
    this.state.socket.close();
  }

  render() {
    return (
      <>
        <Header showResults={this.state.showResults} socket={this.state.socket} boardId={this.state.boardId}></Header>
        <Main socket={this.state.socket} boardId={this.state.boardId} showResults={this.state.showResults}></Main>
        <div className={"alert alert-vote-limit" + (this.state.showVoteLimitAlert ? " alert--show" : "")}>
          Your voting limit of {this.state.maxVotes} has been reached. Undo previous votes if you want some back.
        </div>
      </>
    );
  }
}
