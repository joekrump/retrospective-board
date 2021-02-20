import React, { useState, useEffect, useRef, useMemo, RefObject } from "react";
import { Card } from "../Card/Card";
import * as uuid from "uuid";
import { ColumnHeader } from "../ColumnHeader/ColumnHeader";
import "./column.css";
import { SortDirection } from "../Board/Board";
import { useOvermind } from "../../overmind";
import { AppMode } from "../../overmind/state";
import { Card as ICard } from "../../../@types";

interface ColumnProps {
  key: string;
  id: string;
  name: string;
  deleteColumn: (event: React.MouseEvent, id: string) => void;
  socket: SocketIOClient.Socket;
  boardId: string;
  maxWidthPercentage: number;
  isEditing?: boolean;
  new?: boolean;
  sortDirection: SortDirection;
}

export const Column = (props: ColumnProps) => {
  let nameInput = React.createRef<HTMLInputElement>();
  let [name, updateName] = useState(props.name);
  let [isEditing, updateEditingState] = useState(!!props.isEditing);
  let [newUsavedColumn, updateNewStatus] = useState(props.new);
  let { state: { mode, cardBeingDragged, columns, cards, sessionId }, actions: { updateCardBeingDragged, addCard, removeCard } } = useOvermind();
  const innerRef: RefObject<HTMLDivElement> = useRef(null);

  function handleDragOver(e: DragEvent) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    return false;
  }

  function handleDrop(e: DragEvent) {
    e.stopPropagation(); // stops the browser from redirecting.
    if (innerRef.current !== null) {
      const droppedCard = cardBeingDragged;
      innerRef.current?.classList.remove("over");

      if (droppedCard === null || droppedCard.columnId === props.id) {
        return false;
      }

      props.socket.emit("card:moved", {
        boardId: props.boardId,
        fromColumnId: droppedCard.columnId,
        toColumnId: props.id,
        sessionId,
        cardId: droppedCard.id,
      });
      updateCardBeingDragged(null);
    }

    return false;
  }

  function handleDragEnter() {
    innerRef.current?.classList.add("over");
  }

  function handleDragLeave() {
    innerRef.current?.classList.remove("over");
  }

  useEffect(function onMount() {
    const columnRef = innerRef.current;

    props.socket.on(`column:updated:${props.id}`, (data: any) => {
      updateName(data.name);
    });

    if (columnRef !== null) {
      columnRef.addEventListener("dragover", handleDragOver, false);
      columnRef.addEventListener("dragenter", () => handleDragEnter(), false);
      columnRef.addEventListener("dragleave", () => handleDragLeave(), false);
    }

    return function cleanup() {
      props.socket.removeListener(`column:updated:${props.id}`);

      if (columnRef !== null) {
        columnRef.removeEventListener("dragover", handleDragOver);
        columnRef.removeEventListener("dragenter", () => handleDragEnter());
        columnRef.removeEventListener("dragleave", () => handleDragLeave());
      }
    };
  }, []);

  useEffect(() => {
    innerRef?.current?.removeEventListener("drop", handleDrop);
    innerRef?.current?.addEventListener("drop", handleDrop, false);
    return function cleanup() {
      innerRef?.current?.removeEventListener("drop", handleDrop);
    }
  }, [cardBeingDragged]);

  function createCard(card?: ICard) {
    if (card === undefined) {
      card = {
        id: `card-${uuid.v4()}`,
        ownerId: null,
        stars: {},
        columnId: props.id,
        text: "",
        starsCount: 0,
        isEditing: true,
      };
    }

    addCard(card);
  }

  function deleteCard(event: React.MouseEvent, cardId: string) {
    event.preventDefault();
    const cardToDelete = cards[cardId];

    removeCard(cardId).then(() => {
      if (cardToDelete.ownerId !== undefined) {
        props.socket.emit("card:deleted", {
          boardId: props.boardId,
          columnId: props.id,
          cardId,
          sessionId,
        });
      }
    }).catch(() => {
      throw new Error("failed to delete card from store");
    });
  }

  function toggleIsEditing(event?: React.MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    if (mode !== AppMode.review) {
      updateEditingState(!isEditing);
    }
  }

  function updateColumnName(event: React.FormEvent) {
    event.preventDefault();

    if (nameInput?.current?.value) {
      updateName(nameInput.current.value);
    }

    const socketEvent = !!newUsavedColumn ? "column:created" : "column:updated";

    if (!!newUsavedColumn) {
      updateNewStatus(false);
    }

    props.socket.emit(socketEvent, {
      boardId: props.boardId,
      id: props.id,
      name: nameInput?.current?.value,
      sessionId,
    });

    toggleIsEditing();
  }

  function renderCards() {
    // FIXME: should not need to look up the index for the column each time.
    const column = columns.find((column) => column.id === props.id);
    let cardIds = [
      ...column?.cardIds ?? [],
    ];

    if (mode === AppMode.review) {
      cardIds?.sort((cardIdA, cardIdB) => {
        if (props.sortDirection === SortDirection.asc) {
          return cards[cardIdA].starsCount - cards[cardIdB].starsCount
        } else {
          return cards[cardIdB].starsCount - cards[cardIdA].starsCount
        }
      });
    }
    let card: ICard;

    return cardIds?.map((cardId: string) => {
      card = cards[cardId];
      if (card) {
        return (
          <Card
            key={card.id}
            id={card.id}
            deleteCard={(event: any, id: string) => deleteCard(event, id)}
            ownerId={card.ownerId}
            isEditing={card.isEditing}
            socket={props.socket}
            columnId={props.id}
            boardId={props.boardId}
            text={card.text ?? ""}
            starsCount={card.starsCount}
            userStars={card.stars[sessionId]}
          />
        );
      }
    });
  }

  let memoizedCards = useMemo(() => {
    return renderCards();
  }, [cards, props.sortDirection, mode]);

  return (
    <div
      className={"column" + (isEditing ? " column-edit" : "") }
      style={{ width: `${props.maxWidthPercentage}%`}}
    >
      <div className="header-row">
        <ColumnHeader
          columnId={props.id}
          isEditing={isEditing}
          name={name}
          nameInputRef={nameInput}
          onEditToggle={(e) => toggleIsEditing(e)}
          onSubmit={(e) => updateColumnName(e)}
          onDeleteClick={(event, id) => props.deleteColumn(event, id)}
        />
      </div>
      <div className="column--content">
        {
          mode === AppMode.review ?
            null
            :
            <button className="card--button__add" data-cy="add-card-button" onClick={() => createCard() }>
              +
            </button>
        }
        <div ref={innerRef} className="card--list">
          { memoizedCards }
        </div>
      </div>
    </div>
  );
}
