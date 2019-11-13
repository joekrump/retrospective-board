import * as React from "react";
import * as io from "socket.io-client";

import "./app.css";

import { Header } from "../Header/Header";
import { Main } from "../Main/Main";

interface AppState {
  socket: SocketIOClient.Socket,
}

export class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);

    const socket = io.connect('http://localhost:8000');

    this.state = {
      socket,
    };
  }

  render() {
    return (
      <>
        <Header></Header>
        <Main socket={this.state.socket}></Main>
        <footer></footer>
      </>
    );
  }
}
