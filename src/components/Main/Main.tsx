import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faCog } from "@fortawesome/free-solid-svg-icons";

import "./main.css";
import { Column } from "../Column/Column";
import uuid = require("uuid");

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
      console.log(data);
      data.columns.forEach((column: {id: string}) => {
        this.addColumn(column);
      })
    });
  }

  addColumn(column?: any) {
    let newColumns = this.state.columns.slice(0);
    if (column) {
      newColumns.push({key: column.id, name: column.title});
    } else {
      newColumns.push({key: uuid.v4(), name: "New Column"})
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
          socket={this.props.socket}>
        </Column>
      );
    }

    return markup;
  }

  deleteColumn(event: React.MouseEvent, key: string) {
    event.preventDefault();

    let newColumns = this.state.columns.filter((column: ColumnData) => {
      return column.key !== key;
    });
    this.setState({columns: newColumns});
  }


  render() {
    return (
      <main>
        <div id="board-title">Title Edit!<FontAwesomeIcon icon={faPencilAlt} /></div>
        <div id="board-description">
          <input placeholder="Set the context of the retrospective here..." />
        </div>
        <div id="board-controls">
          <button>Share</button>
          <button onClick={() => this.addColumn()}>New Column</button>
          <a href="#"><FontAwesomeIcon icon={faCog} /></a>
        </div>
        <div id="columns">
          {this.renderColumns()}
        </div>
      </main>    
    );
  }
}