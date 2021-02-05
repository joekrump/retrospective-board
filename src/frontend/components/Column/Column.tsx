import React, { useState, useEffect, useRef, useMemo, RefObject } from "react";
import { Card } from "../Card/Card";
import * as uuid from "uuid";
import { ColumnHeader } from "../ColumnHeader/ColumnHeader";
import "./column.css";
import { SortDirection } from "../Main/Main";
import { useOvermind } from "../../overmind";
import { AppMode } from "../../overmind/state";
import { CardData } from "../../../@types";

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
  let [cards, updateCards] = useState([] as CardData[]);
  let [name, updateName] = useState(props.name);
  let [isEditing, updateEditingState] = useState(!!props.isEditing);
  let [newUsavedColumn, updateNewStatus] = useState(props.new);
  let { state: { mode, cardBeingDragged }, actions: { updateCardBeingDragged } } = useOvermind();
  let cardsRef = useRef(cards);
  const sessionId = sessionStorage.getItem("retroSessionId") || "";
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

      addCard(droppedCard)

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
    props.socket.emit("column:loaded", {
      boardId: props.boardId,
      id: props.id,
      sessionId,
    });

    function handleColumnLoaded (data: any) {
      let cardsData: CardData[] = [];

      for (let i = 0; i < data.cards.length; i++) {
        if (!!data.cards[i].text) {
          cardsData.push({
            id: data.cards[i].id,
            editable: data.cards[i].ownerId === sessionId,
            isEditing: false,
            text: data.cards[i].text,
            starsCount: data.cards[i].starsCount,
            userStars: data.cards[i].stars[sessionId] ? data.cards[i].stars[sessionId] : 0,
          } as CardData);
        }
      }
      updateCards(cardsData);
    }

    function handleCardDeleted (data: any) {
      const cards = cardsRef.current.filter((card: CardData) => {
        return card.id !== data.id;
      });

      updateCards(cards);
    }

    function handleCardCreated(data: { card: CardData }) {
      const cards = cardsRef.current.filter((card) => {
        return (card.id !== data.card.id);
      });

      cards.push({
        ...data.card,
        userStars: 0,
        editable: data.card.ownerId === sessionId,
        isEditing: false,
      });

      updateCards(cards);
    }

    props.socket.on(`column:loaded:${props.id}`, handleColumnLoaded);
    props.socket.on(`card:deleted:${props.id}`, handleCardDeleted);
    props.socket.on(`card:created:${props.id}`, handleCardCreated);
    props.socket.on(`column:updated:${props.id}`, (data: any) => {
      updateName(data.name);
    });

    if (columnRef !== null) {
      columnRef.addEventListener("dragover", handleDragOver, false);
      columnRef.addEventListener("dragenter", () => handleDragEnter(), false);
      columnRef.addEventListener("dragleave", () => handleDragLeave(), false);
    }

    return function cleanup() {
      props.socket.removeListener(`column:loaded:${props.id}`);
      props.socket.removeListener(`card:deleted:${props.id}`);
      props.socket.removeListener(`card:created:${props.id}`);
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

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  function addCard(card?: CardData) {
    let updatedCards: CardData[] = [];

    if (card === undefined) {
      card = {
        id: `card-${uuid.v4()}`,
        editable: true,
        isEditing: true,
        ownerId: "",
        starsCount: 0,
        userStars: 0,
        newCard: true,
      };
    }

    updatedCards = [
      card,
      ...cardsRef.current,
    ];
    updateCards(updatedCards);
  }

  function deleteCard(event: React.MouseEvent, id: string) {
    event.preventDefault();
    let deletedCard: CardData | undefined;
    let updatedCards: CardData[] = [];

    cards.forEach((card: CardData) => {
      if(card.id === id) {
        deletedCard = card;
      } else {
        updatedCards.push(card);
      }
    });

    if (!!deletedCard && !deletedCard.newCard) {
      props.socket.emit("card:deleted", {
        boardId: props.boardId,
        columnId: props.id,
        id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    }

    updateCards(updatedCards);
  }

  function toggleIsEditing(event?: React.MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    updateEditingState(!isEditing);
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
      sessionId: sessionStorage.getItem("retroSessionId"),
    });

    toggleIsEditing();
  }

  function renderCards() {
    if (mode === AppMode.review) {
      cards.sort((cardA, cardB) => {
        if (props.sortDirection === SortDirection.asc) {
          return cardA.starsCount - cardB.starsCount
        } else {
          return cardB.starsCount - cardA.starsCount
        }
      });
    }

    return cards.map((card: CardData) => {
      if (
        mode === AppMode.review
        && card.isEditing
      ) {
        return null;
      }

      return (
        <Card
          key={card.id}
          id={card.id}
          deleteCard={(event: any, id: string) => deleteCard(event, id)}
          editable={mode === AppMode.vote && card.editable}
          isEditing={card.isEditing}
          socket={props.socket}
          columnId={props.id}
          boardId={props.boardId}
          text={card.text ? card.text : ""}
          starsCount={card.starsCount}
          userStars={card.userStars}
          newCard={card.newCard}
        />
      );
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
            <button className="card--button__add" data-cy="add-card-button" onClick={() => addCard() }>
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
