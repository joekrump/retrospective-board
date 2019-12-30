import * as React from "react";
import "./header.css";

export class Header extends React.Component {
  render() {
    return (
      <header>
        <div id="top-header">
          <div id="logo">
            <div className="text">Retro</div>
          </div>
          <div id="app-controls">
            <button>Show Results</button>
          </div>
        </div>
      </header>
    );
  }
}
