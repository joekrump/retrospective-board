import React, { useState, useEffect } from "react";
import { Card } from "../Card/Card";
import * as uuid from "uuid";
import { ColumnHeader } from "../ColumnHeader/ColumnHeader";
import "./column.css";
import { SortDirection } from "../Main/Main";

interface CardData {
  id: string;
  editable: boolean;
  text?: string;
  ownerId?: string;
  starsCount: number;
  userStars: number;
  isEditing: boolean;
  newCard?: boolean;
}

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

interface ColumnState {
  cards: CardData[];
  name: string | undefined;
  isEditing: boolean;
  newUsavedColumn: boolean;
}

export const Column = (props: ColumnProps) => {
  let nameInput = React.createRef<HTMLInputElement>();
  let [cards, updateCards] = useState([] as CardData[]);
  let [name, updateName] = useState(props.name);
  let [isEditing, updateEditingState] = useState(!!props.isEditing);
  let [newUsavedColumn, updateNewStatus] = useState(props.new);

  useEffect(function onMount() {
    const sessionId = sessionStorage.getItem("retroSessionId") || "";

    props.socket.emit("column:loaded", {
      boardId: props.boardId,
      id: props.id,
      sessionId,
    });

    props.socket.on(`column:loaded:${props.id}`, (data: any) => {
      for (let i = 0; i < data.cards.length; i++) {
        if (!!data.cards[i].text) {
          addCard({
            id: data.cards[i].id,
            editable: data.cards[i].ownerId === sessionId,
            isEditing: false,
            text: data.cards[i].text,
            starsCount: data.cards[i].starsCount,
            userStars: data.cards[i].stars[sessionId] ? data.cards[i].stars[sessionId] : 0,
          } as CardData);
        }
      }
    });

    props.socket.on(`card:created:${props.id}`, (data: { card: CardData }) => {
      addCard({
        ...data.card,
        userStars: 0,
        editable: data.card.ownerId === sessionId,
        isEditing: false,
      });
    });

    props.socket.on(`card:deleted:${props.id}`, (data: any) => {
      let newCards = cards.filter((card: CardData) => {
        return card.id !== data.id;
      });
      updateCards(newCards);
    });

    props.socket.on(`column:updated:${props.id}`, (data: any) => {
      updateName(data.name);
    });

    return function cleanup() {
      props.socket.removeListener(`card:created:${props.id}`);
      props.socket.removeListener(`card:deleted:${props.id}`);
      props.socket.removeListener(`column:updated:${props.id}`);
    };
  }, []);

  function addCard(card?: CardData) {
    let updatedCards = cards.slice(0);
    if (!!card) {
      for(let i = 0; i < updatedCards.length; i++) {
        if (updatedCards[i].id === card.id) {
          updatedCards = [
            ...updatedCards.slice(0, i),
            ...updatedCards.slice(i + 1),
          ]
          break;
        }
      }
      updatedCards.push(card);
    } else {
      let newCard = {
        id: `card-${uuid.v4()}`,
        editable: true,
        isEditing: true,
        starsCount: 0,
        userStars: 0,
        newCard: true,
      };
      cards = [
        newCard,
        ...cards,
      ];
    }

    updateCards(cards);
  }

  function deleteCard(event: React.MouseEvent, id: string) {
    event.preventDefault();
    let deletedCard: CardData | undefined;
    let cards: CardData[] = [];

    cards.forEach((card: CardData) => {
      if(card.id === id) {
        deletedCard = card;
      } else {
        cards.push(card);
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

    updateCards(cards);
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
    cards.sort((cardA, cardB) => {
      if (props.sortDirection === SortDirection.none) {
        return 0;
      } else if (props.sortDirection === SortDirection.asc) {
        return cardA.starsCount - cardB.starsCount
      } else {
        return cardB.starsCount - cardA.starsCount
      }
    });

    return cards.map((card: CardData) => {
      if (false // TODO: refactor to use state.mode from overmind
        && card.isEditing) {
        return null;
      }

      return (
        <Card
          key={card.id}
          id={card.id}
          deleteCard={(event: any, id: string) => this.deleteCard(event, id)}
          editable={card.editable} // TODO: refactor to use state.mode from overmind state
          isEditing={card.isEditing}
          socket={props.socket}
          columnId={props.id}
          boardId={props.boardId}
          text={card.text ? card.text : ""}
          starsCount={card.starsCount}
          userStars={card.userStars}
          newCard={card.newCard}
        >
        </Card>
      );
    })
  }

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
        <div className="body-row">
          {
            false ? // TODO: refactor to use state.mode from overmind state
              null
              :
              <button className="card--button__add" onClick={() => addCard() }>
                +
              </button>
          }
          { renderCards() }
        </div>
      </div>
    );
}
