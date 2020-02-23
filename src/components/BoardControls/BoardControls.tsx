import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";

import "./board-controls.css";
import { SortDirection } from "../Main/Main";
interface BoardControlsProps {
  addColumn: () => void;
  title: string;
  socket: SocketIOClient.Socket;
  boardId: string;
  remainingStars: number | undefined;
  sortDirection: SortDirection;
  sortColumnCardsByStars: (e: React.MouseEvent) => void;
};

interface BoardControlsState {
  isEditingTitle: boolean;
}

export class BoardControls extends React.Component<BoardControlsProps, BoardControlsState> {
  private titleInput: React.RefObject<HTMLInputElement>;

  constructor(props: BoardControlsProps) {
    super(props);

    this.state = {
      isEditingTitle: false,
    }

    this.titleInput = React.createRef();
  }

  editTitle(event?: React.MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    this.setState({
      isEditingTitle: !this.state.isEditingTitle,
    });
  }

  saveTitle() {
    this.props.socket.emit("board:updated", {
      boardId: this.props.boardId,
      title: this.titleInput?.current?.value,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
    this.editTitle();
  }

  render() {
    let boardTitle;
    if (this.state.isEditingTitle) {
      boardTitle = (
        <div id="board-title">
          <input className="board-title--text" type="text" autoFocus={true} defaultValue={this.props.title} ref={this.titleInput}></input>
          <div className="board-title--actions">
            <button onClick={this.saveTitle.bind(this)}>Save</button>
            <a href="" onClick={event => this.editTitle(event)}>cancel</a>
          </div>
        </div>
      );
    } else {
      boardTitle = (
        <div id="board-title">
          <h1 className="board-title--text">
            {this.props.title} <FontAwesomeIcon icon={faPencilAlt} className="pencil-icon" onClick={() => this.editTitle()} />
          </h1>
        </div>
      );
    }

    return (
      <div id="board-controls">
        { boardTitle }
        {
          false ? // TODO: refactor to use state.mode from overmind state
            <button className="button button__sort" onClick={this.props.sortColumnCardsByStars}>
              ⭐️s { this.props.sortDirection === SortDirection.asc ? <FontAwesomeIcon icon={faArrowDown} /> : <FontAwesomeIcon icon={faArrowUp} /> }
            </button>
          :
          <div className="board-actions">
            <button
              className="button button--create"
              onClick={() => this.props.addColumn()}
            >
              New Column
              </button>
            <strong className="stars-remaining">
              ⭐️: {this.props.remainingStars}
            </strong>
          </div>
        }
      </div>
    );
  }
}
