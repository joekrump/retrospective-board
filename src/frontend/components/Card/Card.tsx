import React, { useState, useEffect, useRef, RefObject } from "react";
import { ButtonDelete } from "../ButtonDelete/ButtonDelete";
import { useOvermind } from "../../overmind";
import { AppMode } from "../../overmind/state";
import ReactMarkdown from "react-markdown";

import "./card.css";

interface CardProps {
  key: string;
  id: string;
  deleteCard: (event: React.MouseEvent, id: string) => void;
  socket: SocketIOClient.Socket;
  columnId: string;
  boardId: string;
  text: string;
  starsCount: number;
  userStars: number;
  ownerId?: string;
  isEditing: boolean;
}

export const Card = (props: CardProps) => {
  const sessionId = sessionStorage.getItem("retroSessionId") ?? "";
  const [isEditing, updateIsEditing] = useState(props.isEditing && (props.ownerId === "" || sessionId === props.ownerId));
  const [text, updateText] = useState(props.text);
  const [ownerId, updateOwnerId] = useState(props.ownerId ?? null);
  const [userStars, updateUserStars] = useState(props.userStars);
  const [starsCount, updateStarsCount] = useState(props.starsCount);
  const { state: { mode }, actions: { updateCardBeingDragged, updateCard } } = useOvermind();
  const innerRef: RefObject<HTMLDivElement> = useRef(null);
  let cardContents;

  function handleDragStart(e: DragEvent) {
    if (innerRef.current !== null) {
      innerRef.current.style.opacity = "0.4";
    }

    if (e.dataTransfer !== undefined && e.dataTransfer !== null) {
      e.dataTransfer.effectAllowed = "move";
    }

    const {
      id,
      columnId,
    } = props;

    updateCardBeingDragged({
      id,
      columnId,
      text,
      starsCount,
      userStars,
      isEditing,
      ownerId,
    });
  }

  function handleDragEnd() {
    if (innerRef.current !== null) {
      innerRef.current.style.opacity = "1";
    }
  }

  useEffect(() => {
    props.socket.on(`card:updated:${props.id}`, (data: any) => {
      updateText(data.text);
    });

    props.socket.on(`card:starred:${props.id}`, (
      data: { starsCount: number, userStars: number }
    ) => {
      if(!!data) {
        updateStarsCount(data.starsCount);
        updateCard({
          id: props.id,
          starsCount: data.starsCount,
        });
        if(data.userStars !== undefined) {
          updateUserStars(data.userStars);
        }
      }
    });

    return function cleanup() {
      props.socket.removeListener(`card:updated:${props.id}`);
      props.socket.removeListener(`card:starred:${props.id}`);
    }
  }, []);

  useEffect(() => {
    const cardRef = innerRef.current;

    if (cardRef !== null) {
      cardRef.addEventListener("dragstart", (e) => handleDragStart(e), false);
      cardRef.addEventListener("dragend", () => handleDragEnd(), false);
    }

    return function cleanup() {
      if (cardRef !== null) {
        cardRef.removeEventListener("dragstart", (e) => handleDragStart(e));
        cardRef.removeEventListener("dragend", () => handleDragEnd());
      }
    }
  }, [text, isEditing, props.columnId, ownerId, starsCount, userStars])

  function toggleIsEditing(event?: React.MouseEvent) {
    if (!!event) {
      event.preventDefault();
    }
    updateIsEditing(!isEditing);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    toggleIsEditing();

    let eventName: string;

    if(!!ownerId) {
      eventName = "card:updated";
    } else {
      eventName = "card:created";
      updateOwnerId(sessionId);
    }

    updateCard({ id: props.id, isEditing: false, text, ownerId: sessionId });

    props.socket.emit(eventName, {
      boardId: props.boardId,
      columnId: props.columnId,
      cardId: props.id,
      sessionId,
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
      sessionId,
    });
  }

  function starDown(event: React.MouseEvent) {
    event.preventDefault();

    props.socket.emit("card:starred", {
      boardId: props.boardId,
      columnId: props.columnId,
      id: props.id,
      star: -1,
      sessionId,
    });
  }

  function isEditable() {
    return ownerId === sessionId && mode === AppMode.vote;
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
      <button onClick={event => starDown(event)} className="undo-button" data-cy="undo-star-button">
        <span className="gg-undo"></span>
      </button>
    );
  }

  if (isEditing) {
    cardContents = (
      <form onSubmit={save}>
        <textarea
          data-cy="card-contents-textarea"
          autoFocus={true}
          onChange={event => updateText(event.target.value)}
          value={text}>
        </textarea>
        <div className="card--footer">
          <button type="submit" className="button__save" title="Save" data-cy="save-card-button">
            <span className="gg-check"></span>
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
    if (isEditable()) {
      editLink = (
        <a
          data-cy="edit-card-button"
          href=""
          onClick={event => toggleIsEditing(event)}
          className="edit-link"
        >
          <span className="gg-pen" role="img" data-icon="edit" title="Edit"></span>
        </a>
      );
    }

    cardContents = (
      <>
        <ReactMarkdown
          className="card--content"
          source={text}
          allowedTypes={[
            "paragraph",
            "text",
            "root",
            "emphasis",
            "strong",
            "image",
            "link",
            "inlineCode",
            "code",
          ]}
        >
        </ReactMarkdown>
        <div className="card--footer">
          <div className="starring">
            {
            mode === AppMode.review ?
              <span className="star">⭐️</span>
              :
              <button className="star star-button" onClick={starUp} data-cy="add-star-button">
                ⭐️
              </button>
            }
            { mode === AppMode.vote ? renderUserStars() : renderResults() }
            { mode === AppMode.vote && userStars > 0 ? renderUndoButton() : null }
          </div>
          { editLink }
        </div>
      </>
    );
  }

  const draggable = ownerId === sessionId;

  return (
    <div
      ref={innerRef}
      draggable={draggable ? "true" : "false"}
      className={`card-container ${draggable ? "draggable" : ""} ${isEditing ? "card-container--editing" : ""}`}>
      {cardContents}
    </div>
  );
}
