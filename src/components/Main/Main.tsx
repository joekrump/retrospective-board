import * as React from "react";
import { Column } from "../Column/Column";
import uuid = require("uuid");
import { BoardControls } from "../BoardControls/BoardControls";

import "./main.css";

interface MainProps {
  socket: SocketIOClient.Socket;
  boardId: string;
  showResults: boolean;
}

interface MainState {
  columns: BoardColumn[];
  boardTitle: string;
  remainingStars?: number | undefined;
}

export class Main extends React.Component<MainProps, MainState> {
  constructor(props: any) {
    super(props);
    this.state = {
      columns: [],
      boardTitle: "",
    }
  }

  componentDidMount() {
    this.props.socket.on(`board:loaded:${this.props.boardId}`, (
      data: { board: Board, sessionId: string, remainingStars: number },
    ) => {
      this.setState({
        remainingStars: data.remainingStars,
        boardTitle: data.board.title,
      });
      sessionStorage.setItem("retroSessionId", data.sessionId);
      data.board.columns.forEach((column: {id: string}) => {
        this.addColumn(column);
      });
    });

    this.props.socket.on(`board:updated:${this.props.boardId}`, (data: any) => {
      this.setState({
        boardTitle: data.title,
      });
    });

    this.props.socket.on(`board:update-remaining-stars:${this.props.boardId}`, (data: any) => {
      this.setState({
        remainingStars: data.remainingStars,
      });
    })

    this.props.socket.on(`column:created:${this.props.boardId}`, (data: any) => {
      this.addColumn(data);
    });

    this.props.socket.on(`column:deleted:${this.props.boardId}`, (data: any) => {
      this.deleteColumn(null, data.id, true);
    });
  }

  componentWillUnmount() {
    this.props.socket.removeListener(`board:loaded:${this.props.boardId}`);
    this.props.socket.removeListener(`board:update-remaining-stars:${this.props.boardId}`);
    this.props.socket.removeListener(`column:deleted:${this.props.boardId}`);
    this.props.socket.removeListener(`column:created:${this.props.boardId}`);
  }

  addColumn(column?: any) {
    let newColumns = this.state.columns.slice(0);
    if (column) {
      newColumns.push({ id: column.id, name: column.name, isEditing: false });
      this.props.socket.emit("column:loaded", {
        boardId: this.props.boardId,
        id: column.id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    } else {
      const newColumn = { id: uuid.v4(), name: "New Column", isEditing: true };

      newColumns.push(newColumn);

      this.props.socket.emit("column:created", {
        boardId: this.props.boardId,
        id: newColumn.id,
        name: newColumn.name,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    }

    this.setState({columns: newColumns });
  }

  renderColumns() {
    let markup: JSX.Element[] = [];
    const oneHundredPercent = 100;
    const columnCount = this.state.columns.length;
    const maxWidthPercentage = oneHundredPercent / columnCount;

    for (let i = 0; i < columnCount; i++) {
      let name = this.state.columns[i].name;
      markup.push(
        <Column
          key={this.state.columns[i].id}
          id={this.state.columns[i].id}
          name={name}
          deleteColumn={(event) =>this.deleteColumn(event, this.state.columns[i].id)}
          socket={this.props.socket}
          boardId={this.props.boardId}
          maxWidthPercentage={maxWidthPercentage}
          isEditing={this.state.columns[i].isEditing}
          showResults={this.props.showResults}
        >
        </Column>
      );
    }

    return markup;
  }

  deleteColumn(event: React.MouseEvent | null, id: string, fromSocket: boolean = false) {
    if (event) {
      event.preventDefault();
    }

    let newColumns = this.state.columns.filter((column: BoardColumn) => {
      return column.id !== id;
    });

    if (!fromSocket) {
      this.props.socket.emit(`column:deleted`, {
        boardId: this.props.boardId,
        id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    }

    this.setState({columns: newColumns});
  }

  render() {
    return (
      <main>
        <BoardControls
          addColumn={() => this.addColumn()}
          title={this.state.boardTitle}
          socket={this.props.socket}
          boardId={this.props.boardId}
          remainingStars={this.state.remainingStars}
        >
        </BoardControls>
        <div id="columns">
          {this.renderColumns()}
        </div>
      </main>
    );
  }
}
