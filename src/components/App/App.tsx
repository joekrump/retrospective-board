import * as React from "react";

import "./app.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as faIcons from "@fortawesome/free-solid-svg-icons";
import { Column } from "../Column/Column";

interface ColumnData {
  key: string;
}

interface AppState {
  columns: ColumnData[];
  lastColumnIndex: number;
}

export class App extends React.Component<{}, AppState> {
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
          deleteColumn={(event, key) =>this.deleteColumn(event, key)}>
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
      <>
        <header>
          <div id="top-header">
            <div id="logo"></div>
            <div id="app-controls"></div>
          </div>
        </header>
        <main>
          <div id="board-title">Title Edit!<FontAwesomeIcon icon={faIcons.faPencilAlt} /></div>
          <div id="board-description">
            <input placeholder="Set the context of the retrospective here..." />
          </div>
          <div id="board-controls">
            <button>Share</button>
            <button onClick={() => this.addColumn()}>New Column</button>
            <a href="#"><FontAwesomeIcon icon={faIcons.faCog} /></a>
          </div>
          <div id="columns">
            {this.renderColumns()}
          </div>
        </main>
        <footer></footer>
      </>
    );
  }
}
