import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faCog } from "@fortawesome/free-solid-svg-icons";

interface BoardControlsProps {
  addColumn: () => void;
  title: string;
  description: string;
  socket: SocketIOClient.Socket;
  boardId: string;
};

interface BoardControlsState {
  title: string;
  description: string;
  isEditingTitle: boolean;
}

export class BoardControls extends React.Component<BoardControlsProps, BoardControlsState> {
  private titleInput: React.RefObject<HTMLInputElement>;

  constructor(props: BoardControlsProps) {
    super(props);

    this.state = {
      title: this.props.title,
      description: this.props.description,
      isEditingTitle: false,
    }

    this.titleInput = React.createRef();
  }

  componentWillMount() {
    this.props.socket.on(`board:loaded:${this.props.boardId}`, (data: any) => {
      this.setState({
        description: data.description,
        title: data.title,
      });
    });

    this.props.socket.on(`board:updated:${this.props.boardId}`, (data: any) => {
      this.setState({
        title: data.title,
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
      title: (this.titleInput as any).current.value
    });
    this.props.socket.emit("board:updated", {
      boardId: this.props.boardId,
      title: (this.titleInput as any).current.value
    });
    this.editTitle();
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
      boardTitle = <div id="board-title">{this.state.title}<FontAwesomeIcon icon={faPencilAlt} onClick={() => this.editTitle()} /></div>;
    }

    return (
      <>
        {boardTitle}
        <div id="board-description">
          <input placeholder="Set the context of the retrospective here..." />
        </div>
        <div id="board-controls">
          <button>Share</button>
          <button onClick={() => this.props.addColumn()}>New Column</button>
          <a href="#"><FontAwesomeIcon icon={faCog} /></a>
        </div>
      </>
    );
  }
}