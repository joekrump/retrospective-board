import * as React from "react";
import * as io from "socket.io-client";

import "./app.css";

import { Header } from "../Header/Header";
import { Main } from "../Main/Main";

interface AppState {
  socket: SocketIOClient.Socket;
  boardId: string;
}

export class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);

    const socket = io.connect(`${window.location.origin}:8000`);
    const boardId = window.location.pathname.split("/").pop() || "";
    this.state = {
      socket,
      boardId,
    };
  }

  componentDidMount() {
    this.state.socket.emit("board:loaded", {
      boardId: this.state.boardId,
    });
  }

  componentWillUnmount() {
    this.state.socket.close();
  }

  render() {
    return (
      <>
        <Header></Header>
        <Main socket={this.state.socket} boardId={this.state.boardId}></Main>
        <footer></footer>
      </>
    );
  }
}
