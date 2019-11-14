import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faCog } from "@fortawesome/free-solid-svg-icons";

import "./main.css";
import { Column } from "../Column/Column";
import uuid = require("uuid");
import { BoardControls } from "../BoardControls/BoardControls";

interface ColumnData {
  key: string;
  name: string;
}

interface MainProps {
  socket: SocketIOClient.Socket;
  boardId: string;
}

interface MainState {
  columns: ColumnData[];
}

export class Main extends React.Component<MainProps, MainState> {
  constructor(props: any) {
    super(props);
    this.state = {
      columns: [],
    }
  }

  componentWillMount() {
    this.props.socket.on(`board:loaded:${this.props.boardId}`, (data: any) => {
      data.columns.forEach((column: {id: string}) => {
        this.addColumn(column);
      })
    });

    this.props.socket.on(`column:created:${this.props.boardId}`, (data: any) => {
      this.addColumn(data);
    });

    this.props.socket.on(`column:deleted:${this.props.boardId}`, (data: any) => {
      this.deleteColumn(null, data.id, true);
    });
  }

  componentWillUnmount() {
    this.props.socket.removeListener(`board:loaded:${this.props.boardId}`);
  }

  addColumn(column?: any) {
    let newColumns = this.state.columns.slice(0);
    if (column) {
      newColumns.push({key: column.id, name: column.title});
      this.props.socket.emit("column:loaded", {
        boardId: this.props.boardId,
        id: column.id,
      });
    } else {
      const newColumn = {key: uuid.v4(), name: "New Column"};
      newColumns.push(newColumn)
      this.props.socket.emit("column:created", {
        boardId: this.props.boardId,
        id: newColumn.key,
        name: newColumn.name
      });
    }

    this.setState({columns: newColumns });
  }

  renderColumns() {
    let markup: JSX.Element[] = [];

    for (let i = 0; i < this.state.columns.length; i++) {
      let name = this.state.columns[i].name;
      markup.push(
        <Column
          key={this.state.columns[i].key}
          id={this.state.columns[i].key}
          name={name}
          deleteColumn={(event, key) =>this.deleteColumn(event, key)}
          socket={this.props.socket}
          boardId={this.props.boardId}>
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
        <BoardControls addColumn={() => this.addColumn()}></BoardControls>
        <div id="columns">
          {this.renderColumns()}
        </div>
      </main>
    );
  }
}