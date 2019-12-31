import * as React from "react";
import { Column } from "../Column/Column";
import uuid = require("uuid");
import { BoardControls } from "../BoardControls/BoardControls";

import "./main.css";
interface ColumnData {
  key: string;
  name: string;
  isEditing: boolean;
}

interface MainProps {
  socket: SocketIOClient.Socket;
  boardId: string;
  showResults: boolean;
}

interface MainState {
  columns: ColumnData[];
  boardTitle: string;
  boardDescription: string;
  remainingVotes?: number | undefined;
}

export class Main extends React.Component<MainProps, MainState> {
  constructor(props: any) {
    super(props);
    this.state = {
      columns: [],
      boardTitle: "",
      boardDescription: "",
    }
  }

  componentDidMount() {
    this.props.socket.on(`board:loaded:${this.props.boardId}`, (
      data: { board: any, sessionId: string, remainingVotes: number },
    ) => {
      this.setState({
        remainingVotes: data.remainingVotes,
      });
      sessionStorage.setItem("retroSessionId", data.sessionId);
      data.board.columns.forEach((column: {id: string}) => {
        this.addColumn(column);
      });
    });

    this.props.socket.on(`board:update-remaining-votes:${this.props.boardId}`, (data: any) => {
      this.setState({
        remainingVotes: data.remainingVotes,
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
    this.props.socket.removeListener(`board:update-remaining-votes:${this.props.boardId}`);
    this.props.socket.removeListener(`column:deleted:${this.props.boardId}`);
    this.props.socket.removeListener(`column:created:${this.props.boardId}`);
  }

  addColumn(column?: any) {
    const sessionId = sessionStorage.getItem("retroSessionId");
    let newColumns = this.state.columns.slice(0);
    if (column) {
      newColumns.push({key: column.id, name: column.name, isEditing: false });
      this.props.socket.emit("column:loaded", {
        boardId: this.props.boardId,
        id: column.id,
        sessionId,
      });
    } else {
      const newColumn = {key: uuid.v4(), name: "New Column", isEditing: true };
      newColumns.push(newColumn)
      this.props.socket.emit("column:created", {
        boardId: this.props.boardId,
        id: newColumn.key,
        name: newColumn.name,
        sessionId,
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
          key={this.state.columns[i].key}
          id={this.state.columns[i].key}
          name={name}
          deleteColumn={(event, key) =>this.deleteColumn(event, key)}
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

  deleteColumn(event: React.MouseEvent | null, key: string, fromSocket: boolean = false) {
    if (event) {
      event.preventDefault();
    }

    let newColumns = this.state.columns.filter((column: ColumnData) => {
      return column.key !== key;
    });

    if (!fromSocket) {
      this.props.socket.emit(`column:deleted`, {
        boardId: this.props.boardId,
        id: key,
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
          description={this.state.boardDescription}
          socket={this.props.socket}
          boardId={this.props.boardId}
          remainingVotes={this.state.remainingVotes}
        >
        </BoardControls>
        <div id="columns">
          {this.renderColumns()}
        </div>
      </main>
    );
  }
}
