import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faCog } from "@fortawesome/free-solid-svg-icons";

interface BoardControlsProps {
  addColumn: () => void;
};

interface BoardControlsState {
  title: string;
  isEditingTitle: boolean;
}

export class BoardControls extends React.Component<BoardControlsProps, BoardControlsState> {
  constructor(props: BoardControlsProps) {
    super(props);

    this.state = {
      title: "Title!",
      isEditingTitle: false,
    }
  }

  editTitle() {
    this.setState({
      isEditingTitle: !this.state.isEditingTitle,
    });
  }

  render() {
    let boardTitle;
    if (this.state.isEditingTitle) {
      boardTitle = (
        <>
          <input></input>
          <button value="Save"></button>
          <a href="">Cancel</a>
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