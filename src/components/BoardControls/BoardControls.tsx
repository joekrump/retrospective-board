import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";

import "./board-controls.css";
interface BoardControlsProps {
  addColumn: () => void;
  title: string;
  description: string;
  socket: SocketIOClient.Socket;
  boardId: string;
  remainingStars: number | undefined;
};

interface BoardControlsState {
  isEditingTitle: boolean;
}

export class BoardControls extends React.Component<BoardControlsProps, BoardControlsState> {
  private titleInput: React.RefObject<HTMLInputElement>;
  private descriptionInput: React.RefObject<HTMLInputElement>;

  constructor(props: BoardControlsProps) {
    super(props);

    this.state = {
      isEditingTitle: false,
    }

    this.titleInput = React.createRef();
    this.descriptionInput = React.createRef();
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
    });
    this.editTitle();
  }

  saveDescription(e: React.KeyboardEvent) {
    if(e.key === "Enter") {
      e.preventDefault();
      this.props.socket.emit("board:updated", {
        boardId: this.props.boardId,
        description: this.descriptionInput?.current?.value,
      });
    } else {
      return;
    }
  }

  render() {
    let boardTitle;
    if (this.state.isEditingTitle) {
      boardTitle = (
        <>
          <input type="text" defaultValue={this.props.title} ref={this.titleInput}></input>
          <button onClick={this.saveTitle.bind(this)}>Save</button>
          <a href="" onClick={event => this.editTitle(event)}>cancel</a>
        </>
      );
    } else {
      boardTitle = (
        <div id="board-title">
          <h1>
            {this.props.title} <FontAwesomeIcon icon={faPencilAlt} className="pencil-icon" onClick={() => this.editTitle()} />
          </h1>
        </div>
      );
    }

    return (
      <div className="board-controls">
        { boardTitle }
        <div id="board-description">
          <input type="text" defaultValue={this.props.description} placeholder="Add a description" onKeyDown={(e) => this.saveDescription(e)} ref={this.descriptionInput}></input>
        </div>
        <div id="board-controls">
          <button
            className="button button--create"
            onClick={() => this.props.addColumn()}
          >
            New Column
          </button>
        </div>
        <strong className="stars-remaining">
          Remaining ⭐️: {this.props.remainingStars}
        </strong>
      </div>
    );
  }
}
