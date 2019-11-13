import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faCog } from "@fortawesome/free-solid-svg-icons";

import "./main.css";
import { Column } from "../Column/Column";

interface ColumnData {
  key: string;
}

interface MainProps {
  socket: SocketIOClient.Socket,
}

interface MainState {
  columns: ColumnData[];
  lastColumnIndex: number;
}

export class Main extends React.Component<MainProps, MainState> {
  constructor(props: any) {
    super(props);
    this.state = {
      columns: [
        {key: "Column-1"},
        {key: "Column-2"},
        {key: "Column-3"}
      ],
      lastColumnIndex: 3,
    }
  }
  
  addColumn() {
    let newColumns = this.state.columns.slice(0);
    newColumns.push({key: `Column-${this.state.lastColumnIndex+1}`})
    this.setState({columns: newColumns, lastColumnIndex: this.state.lastColumnIndex+1 });
  }

  renderColumns() {
    let markup: JSX.Element[] = [];

    for (let i = 0; i < this.state.columns.length; i++) {
      let name = this.state.columns[i].key.replace("-", " ");
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