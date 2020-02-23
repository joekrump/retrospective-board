import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
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

export class Column extends React.Component<ColumnProps, ColumnState> {
  private nameInput: React.RefObject<HTMLInputElement>;

  constructor(props: ColumnProps) {
    super(props);

    this.state = {
      cards: [],
      name: this.props.name,
      isEditing: !!this.props.isEditing ? true : false,
      newUsavedColumn: !!this.props.new,
    };

    this.nameInput = React.createRef();
  }

  componentDidMount() {
    const sessionId = sessionStorage.getItem("retroSessionId") || "";

    this.props.socket.emit("column:loaded", {
      boardId: this.props.boardId,
      id: this.props.id,
      sessionId,
    });

    this.props.socket.on(`column:loaded:${this.props.id}`, (data: any) => {
      for (let i = 0; i < data.cards.length; i++) {
        if (!!data.cards[i].text) {
          this.addCard({
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

    this.props.socket.on(`card:created:${this.props.id}`, (data: { card: CardData }) => {
      this.addCard({
        ...data.card,
        userStars: 0,
        editable: data.card.ownerId === sessionId,
        isEditing: false,
      });
    });

    this.props.socket.on(`card:deleted:${this.props.id}`, (data: any) => {
      let newCards = this.state.cards.filter((card: CardData) => {
        return card.id !== data.id;
      });
      this.setState({cards: newCards});
    });

    this.props.socket.on(`column:updated:${this.props.id}`, (data: any) => {
      this.setState({name: data.name});
    });
  }

  componentWillUnmount() {
    this.props.socket.removeListener(`card:created:${this.props.id}`);
    this.props.socket.removeListener(`card:deleted:${this.props.id}`);
    this.props.socket.removeListener(`column:updated:${this.props.id}`);
  }

  addCard(card?: CardData) {
    let cards = this.state.cards.slice(0);
    if (!!card) {
      for(let i = 0; i < cards.length; i++) {
        if (cards[i].id === card.id) {
          cards = [
            ...cards.slice(0, i),
            ...cards.slice(i + 1),
          ]
          break;
        }
      }
      cards.push(card);
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

    this.setState({ cards });
  }

  deleteCard(event: React.MouseEvent, id: string) {
    event.preventDefault();
    let deletedCard: CardData | undefined;
    let cards: CardData[] = [];

    this.state.cards.forEach((card: CardData) => {
      if(card.id === id) {
        deletedCard = card;
      } else {
        cards.push(card);
      }
    });

    if (!!deletedCard && !deletedCard.newCard) {
      this.props.socket.emit("card:deleted", {
        boardId: this.props.boardId,
        columnId: this.props.id,
        id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    }

    this.setState({cards});
  }

  toggleIsEditing(event?: React.MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    this.setState({
      isEditing: !this.state.isEditing,
    });
  }

  updateColumnName(event: React.FormEvent) {
    event.preventDefault();
    this.setState({
      name: this.nameInput?.current?.value
    });

    const socketEvent = !!this.state.newUsavedColumn ? "column:created" : "column:updated";

    if (!!this.state.newUsavedColumn) {
      this.setState({
        newUsavedColumn: false
      });
    }

    this.props.socket.emit(socketEvent, {
      boardId: this.props.boardId,
      id: this.props.id,
      name: this.nameInput?.current?.value,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });

    this.toggleIsEditing();
  }

  renderCards() {
    let cards = this.state.cards;

    cards = cards.sort((cardA, cardB) => {
      if (this.props.sortDirection === SortDirection.none) {
        return 0;
      } else if (this.props.sortDirection === SortDirection.asc) {
        return cardA.starsCount - cardB.starsCount
      } else {
        return cardB.starsCount - cardA.starsCount
      }
    });

    return cards.map((card) => {
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
          socket={this.props.socket}
          columnId={this.props.id}
          boardId={this.props.boardId}
          text={card.text ? card.text : ""}
          starsCount={card.starsCount}
          userStars={card.userStars}
          newCard={card.newCard}
        >
        </Card>
      );
    })
  }

  render() {
    return (
      <div
        className={"column" + (this.state.isEditing ? " column-edit" : "") }
        style={{ width: `${this.props.maxWidthPercentage}%`}}
      >
        <div className="header-row">
          <ColumnHeader
            columnId={this.props.id}
            isEditing={this.state.isEditing}
            name={this.state.name}
            nameInputRef={this.nameInput}
            onEditToggle={(e) => this.toggleIsEditing(e)}
            onSubmit={(e) => this.updateColumnName(e)}
            onDeleteClick={(event, id) => this.props.deleteColumn(event, id)}
          />
        </div>
        <div className="body-row">
          {
            false ? // TODO: refactor to use state.mode from overmind state
              null
              :
              <button className="card--button__add" onClick={() => this.addCard()}>
                +
              </button>
          }
          { this.renderCards() }
        </div>
      </div>
    );
  }
}
