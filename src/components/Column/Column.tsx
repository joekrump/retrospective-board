import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare, faTrash, faPlusCircle } from "@fortawesome/free-solid-svg-icons";

interface ColumnProps {
  index: number;
}

export class Column extends React.Component<ColumnProps, {}> {
  render() {
    return (
      <div className="column">
        <div className="header-row">
          <h2><FontAwesomeIcon icon={faSquare} /> Column {this.props.index + 1}</h2>
          <a href=""><FontAwesomeIcon icon={faTrash} /></a>
        </div>
        <div className="body-row">
          <button style={ {width:"100%"} }><FontAwesomeIcon icon={faPlusCircle} /></button>
        </div>
      </div>
    );
  }
}