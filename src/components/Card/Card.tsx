import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faUndo, faSave } from "@fortawesome/free-solid-svg-icons";
import { ButtonDelete } from "../ButtonDelete/ButtonDelete";
import { useOvermind } from "../../overmind";

import "./card.css";
import { AppMode } from "../../overmind/state";

interface CardProps {
  key: string;
  id: string;
  deleteCard: (event: React.MouseEvent, id: string) => void;
  editable: boolean;
  isEditing: boolean;
  socket: SocketIOClient.Socket;
  columnId: string;
  boardId: string;
  text: string;
  starsCount: number;
  userStars: number;
  newCard?: boolean;
}

export const Card = (props: CardProps) => {
  const [isEditing, updateIsEditing] = useState(props.isEditing);
  const [text, updateText] = useState(props.text);
  const [userStars, updateUserStars] = useState(props.userStars);
  const [starsCount, updateStarsCount] = useState(props.starsCount);
  const { state: { mode } } = useOvermind();
  let cardContents;

  useEffect(() => {
    const sessionId = sessionStorage.getItem("retroSessionId") || "";
    props.socket.on(`card:updated:${props.id}`, (data: any) => {
      alert(data.card.ownerId === sessionId);
      updateText(data.text);
    });

    props.socket.on(`card:starred:${props.id}`, (
      data: { starsCount: number, userStars: number }
    ) => {
      if(!!data) {
        updateStarsCount(data.starsCount);
        updateUserStars(data.userStars !== undefined ? data.userStars : userStars);
      }
    });

    return function cleanup() {
      props.socket.removeListener(`card:updated:${props.id}`);
      props.socket.removeListener(`card:starred:${props.id}`);
    }
  }, []);

  function toggleIsEditing(event?: React.MouseEvent) {
    if (!!event) {
      event.preventDefault();
    }
    updateIsEditing(!isEditing);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    toggleIsEditing();

    const eventName = !!props.newCard ? "card:created" : "card:updated";

    props.socket.emit(eventName, {
      boardId: props.boardId,
      columnId: props.columnId,
      id: props.id,
      sessionId: sessionStorage.getItem("retroSessionId"),
      text,
    });
  }

  function starUp(event: React.MouseEvent) {
    event.preventDefault();

    props.socket.emit("card:starred", {
      boardId: props.boardId,
      columnId: props.columnId,
      id: props.id,
      star: 1,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
  }

  function starDown(event: React.MouseEvent) {
    event.preventDefault();

    props.socket.emit("card:starred", {
      boardId: props.boardId,
      columnId: props.columnId,
      id: props.id,
      star: -1,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
  }

  function renderUserStars() {
    return (
      <span className="user-stars">{userStars}</span>
    );
  }

  function renderResults() {
    return (
      <span className="star-count">{starsCount}</span>
    );
  }

  function renderUndoButton() {
    return (
      <button onClick={event => starDown(event)} className="undo-button">
        <FontAwesomeIcon icon={faUndo} />
      </button>
    );
  }

  if (isEditing) {
    cardContents = (
      <form onSubmit={save}>
        <textarea
          autoFocus={true}
          onChange={event => updateText(event.target.value)}
          value={text}>
        </textarea>
        <div className="card--footer">
          <button type="submit" className="button__save" title="Save">
            <FontAwesomeIcon icon={faSave} />
          </button>
          <ButtonDelete
            id={props.id}
            handleClick={(event, id) => props.deleteCard(event, id as string)}
          />
        </div>
      </form>
    );
  } else {
    let editLink;
    if (props.editable) {
      editLink = (
        <a
          href=""
          onClick={event => toggleIsEditing(event)}
          className="edit-link"
        >
          <FontAwesomeIcon icon={faPencilAlt} />
        </a>
      );
    }

    cardContents = (
      <>
        <p className="card--text">{text}{editLink}</p>
        <div className="card--footer">
          {
            mode === AppMode.review ?
              <span className="star">⭐️</span>
              :
              <span className="star star-button" onClick={starUp}>
                ⭐️
              </span>
          }
          { mode === AppMode.vote ? renderUserStars() : renderResults() }
          { mode === AppMode.vote && userStars > 0 ? renderUndoButton() : null }
        </div>
      </>
    );
  }

  return (
    <div className="card-container">
      {cardContents}
    </div>
  );
}
