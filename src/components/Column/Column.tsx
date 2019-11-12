import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare, faTrash, faPlusCircle } from "@fortawesome/free-solid-svg-icons";

interface ColumnProps {
  key: string;
  id: string;
  name: string;
  deleteColumn: (event: React.MouseEvent, key: string) => void;
}

export class Column extends React.Component<ColumnProps, {}> {
  render() {
    return (
      <div className="column">
        <div className="header-row">
          <h2><FontAwesomeIcon icon={faSquare} />{this.props.name}</h2>
          <a href="" onClick={event => this.props.deleteColumn(event, this.props.id)}><FontAwesomeIcon icon={faTrash} /></a>
        </div>
        <div className="body-row">
          <button style={ {width:"100%"} }><FontAwesomeIcon icon={faPlusCircle} /></button>
        </div>
      </div>
    );
  }
}