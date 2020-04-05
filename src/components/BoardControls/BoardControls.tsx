import React, { useState } from "react";

import "./board-controls.css";
import { SortDirection } from "../Main/Main";
import { useOvermind } from "../../overmind";
import { AppMode } from "../../overmind/state";
interface BoardControlsProps {
  title: string;
  socket: SocketIOClient.Socket;
  boardId: string;
  remainingStars: number | undefined;
  sortDirection: SortDirection;
  sortColumnCardsByStars: (e: React.MouseEvent) => void;
};

export const BoardControls = (props: BoardControlsProps) => {
  let titleInput = React.createRef<HTMLInputElement>();
  let [isEditingTitle, updateIsEditingTitle] = useState(false);
  let { state: { mode } } = useOvermind();

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
        <input className="board-title--text" type="text" autoFocus={true} defaultValue={props.title} ref={titleInput}></input>
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
        {props.title}
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
            ⭐️: {props.remainingStars}
          </strong>
        </div>
      }
    </div>
  );
}
