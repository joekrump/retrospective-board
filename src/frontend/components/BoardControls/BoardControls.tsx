import React, { useState } from "react";

import "./board-controls.css";
import { SortDirection } from "../Board/Board";
import { useOvermind } from "../../overmind";
import { AppMode } from "../../overmind/state";
interface BoardControlsProps {
  socket: SocketIOClient.Socket;
  boardId: string;
  sortDirection: SortDirection;
  sortColumnCardsByStars: (e: React.MouseEvent) => void;
};

export const BoardControls = (props: BoardControlsProps) => {
  let titleInput = React.createRef<HTMLInputElement>();
  let [isEditingTitle, updateIsEditingTitle] = useState(false);
  let { state: { mode, board, remainingStars } } = useOvermind();

  function editTitle(event?: React.MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    updateIsEditingTitle(!isEditingTitle);
  }

  function saveTitle() {
    props.socket.emit("board:updated", {
      boardId: props.boardId,
      title: titleInput?.current?.value,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
    editTitle();
  }

  let titleContent;
  if (isEditingTitle) {
    titleContent = (
      <>
        <input className="board-title--text" type="text" autoFocus={true} defaultValue={board.title} ref={titleInput}></input>
        <div className="board-title--actions">
          <button onClick={saveTitle} title="Save">
            <span className="gg-check"></span>
          </button>
          <button title="Cancel" onClick={event => editTitle(event)}>
            <span className="gg-close"></span>
          </button>
        </div>
      </>
    );
  } else {
    titleContent = (
      <h1 className="board-title--text" onClick={() => editTitle()}>
        {board.title}
      </h1>
    );
  }

  return (
    <div id="board-controls">
      <div id="board-title">
        { titleContent }
      </div>
      {
        mode === AppMode.review ?
          <button className="button button__sort" onClick={props.sortColumnCardsByStars}>
            ⭐️ { props.sortDirection === SortDirection.asc ? <span className="gg-sort-za" /> : <span className="gg-sort-az" /> }
          </button>
        :
        <div className="board-actions">
          <strong className="stars-remaining">
            ⭐️: {remainingStars}
          </strong>
        </div>
      }
    </div>
  );
}
