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
  votesRemaining: number | undefined;
};

interface BoardControlsState {
  title: string;
  description: string;
  isEditingTitle: boolean;
}

export class BoardControls extends React.Component<BoardControlsProps, BoardControlsState> {
  private titleInput: React.RefObject<HTMLInputElement>;
  private descriptionInput: HTMLInputElement | null = null;

  constructor(props: BoardControlsProps) {
    super(props);

    this.state = {
      title: this.props.title,
      description: this.props.description,
      isEditingTitle: false,
    }

    this.titleInput = React.createRef();
  }

  componentDidMount() {
    this.props.socket.on(`board:loaded:${this.props.boardId}`, (data: { title: string; description: string; }) => {
      if (data) {
        this.setState({
          description: data.description,
          title: data.title,
        });
      }
    });

    this.props.socket.on(`board:updated:${this.props.boardId}`, (data: any) => {
      this.setState({
        title: data.title,
        description: data.description,
      });
    });
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
    this.setState({
      title: (this.titleInput as any).current.value,
    });
    this.props.socket.emit("board:updated", {
      boardId: this.props.boardId,
      description: this.state.description,
      title: (this.titleInput as any).current.value,
    });
    this.editTitle();
  }

  saveDescription(e: React.KeyboardEvent) {
    if(e.key === "Enter") {
      e.preventDefault();
      this.setState({
        description: (this.descriptionInput as HTMLInputElement).value,
      });
      this.props.socket.emit("board:updated", {
        boardId: this.props.boardId,
        description: (this.descriptionInput as HTMLInputElement).value,
        title: this.state.title,
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
          <input type="text" defaultValue={this.state.title} ref={this.titleInput}></input>
          <button onClick={this.saveTitle.bind(this)}>Save</button>
          <a href="" onClick={event => this.editTitle(event)}>cancel</a>
        </>
      );
    } else {
      boardTitle = (<div id="board-title">
        <h2>
          {this.state.title} <FontAwesomeIcon icon={faPencilAlt} onClick={() => this.editTitle()} />
        </h2>
      </div>);
    }

    return (
      <div className="board-controls">
        { boardTitle }
        <div id="board-description">
          <input type="text" defaultValue={this.state.description} placeholder="Add a description" onKeyDown={(e) => this.saveDescription(e)} ref={ref => this.descriptionInput = ref}></input>
        </div>
        <div id="board-controls">
          <strong className="votes-remaining">
            Votes Remaining: {this.props.votesRemaining === undefined ? null : this.props.votesRemaining}
          </strong>
          <button
            className="button button--create"
            onClick={() => this.props.addColumn()}
          >
            New Column
          </button>
        </div>
      </div>
    );
  }
}
