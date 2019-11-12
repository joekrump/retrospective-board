import * as React from "react";

import "./app.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as faIcons from "@fortawesome/free-solid-svg-icons";
import { Column } from "../Column/Column";

interface AppState {
  columns: number;
}

export class App extends React.Component<{}, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      columns: 3,
    }
  }

  addColumn() {
    this.setState({columns: this.state.columns + 1 });
  }

  renderColumns() {
    let markup: JSX.Element[] = [];

    for (let i = 0; i < this.state.columns; i++) {
      markup.push(
        <Column index={i}></Column>
      );
    }

    return markup;
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
