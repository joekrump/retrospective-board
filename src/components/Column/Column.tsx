import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlusCircle, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { Card } from "../Card/Card";
import * as uuid from "uuid";

import "./column.css";

interface CardData {
  id: string;
  editable: boolean;
  text?: string;
  votesCount: number;
  netSentiment: number;
  userSentiment: number;
  isEditing: boolean;
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
  showResults: boolean;
}

interface ColumnState {
  cards: CardData[];
  lastIndex: number;
  name: string;
  isEditing: boolean;
}

export class Column extends React.Component<ColumnProps, ColumnState> {
  private nameInput: React.RefObject<HTMLInputElement>;

  constructor(props: ColumnProps) {
    super(props);

    this.state = {
      cards: [],
      lastIndex: 0,
      name: this.props.name,
      isEditing: !!this.props.isEditing ? true : false,
    };

    this.nameInput = React.createRef();
  }

  componentDidMount() {
    const sessionId = sessionStorage.getItem("retroSessionId") || "";

    this.props.socket.on(`column:loaded:${this.props.id}`, (data: any) => {
      for (let i = 0; i < data.cards.length; i++) {
        if (!!data.cards[i].text) {
          this.addCard({
            id: data.cards[i].id,
            editable: data.cards[i].ownerId === sessionId,
            isEditing: false,
            text: data.cards[i].text,
            votesCount: data.cards[i].votesCount,
            netSentiment: data.cards[i].netSentiment,
            userSentiment: data.cards[i].sentiments[sessionId] ? data.cards[i].sentiments[sessionId] : 0,
          } as CardData);
        }
      }
    });

    this.props.socket.on(`card:created:${this.props.id}`, (data: {id: string}) => {
      this.addCard({
        id: data.id,
        editable: false,
      } as CardData);
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

  addCard(data?: CardData) {
    let newCards = this.state.cards.slice(0);
    if (data) {
      newCards.push(data);
    } else {
      let newCard = {
        id: `card-${uuid.v4()}`,
        editable: true,
        isEditing: true,
        votesCount: 0,
        netSentiment: 0,
        userSentiment: 0,
      };
      newCards.push(newCard);

      this.props.socket.emit(`card:created`, {
        boardId: this.props.boardId,
        columnId: this.props.id,
        id: newCard.id,
      });
    }

    this.setState({cards: newCards, lastIndex: this.state.lastIndex + 1});
  }

  deleteCard(event: React.MouseEvent, id: string) {
    event.preventDefault();

    let newCards = this.state.cards.filter((card: CardData) => {
      return card.id !== id;
    });

    this.props.socket.emit("card:deleted", {
      boardId: this.props.boardId,
      columnId: this.props.id,
      id,
    });

    this.setState({cards: newCards});
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
      name: (this.nameInput as any).current.value
    });
    this.props.socket.emit("column:updated", {
      boardId: this.props.boardId,
      id: this.props.id,
      name: (this.nameInput as any).current.value
    });
    this.toggleIsEditing();
  }

  renderColumnHeader() {
    if(this.state.isEditing) {
      return (
        <form
          className="column-header column-header--editing"
          onSubmit={event => this.updateColumnName(event)}
        >
          <input
            type="text"
            defaultValue={this.state.name}
            ref={this.nameInput}
            autoFocus={true}
          />
          <button type="submit">Save</button>
          <button onClick={event => this.toggleIsEditing(event)}>cancel</button>
        </form>
      );
    } else {
      return (
        <h2
          className="column-header"
          onClick={event => this.toggleIsEditing(event)}
        >
          {this.state.name}&nbsp;<FontAwesomeIcon icon={faPencilAlt} />
        </h2>
      );
    }
  }

  render() {
    return (
      <div
        className={"column" + (this.state.isEditing ? " column-edit" : "") }
        style={{ width: `${this.props.maxWidthPercentage}%`}}
      >
        <div className="header-row">
          { this.renderColumnHeader() }
          <a
            href=""
            onClick={event => this.props.deleteColumn(event, this.props.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </a>
        </div>
        <div className="body-row">
          <button onClick={() => this.addCard()}>
            <FontAwesomeIcon icon={faPlusCircle} />
          </button>
          {
            this.state.cards.map((card) =>
              <Card
                key={card.id}
                id={card.id}
                deleteCard={(event: any, id: string) => this.deleteCard(event, id)}
                editable={card.editable}
                isEditing={card.isEditing}
                socket={this.props.socket}
                columnId={this.props.id}
                boardId={this.props.boardId}
                text={card.text ? card.text : ""}
                votesCount={card.votesCount}
                netSentiment={card.netSentiment}
                showResults={this.props.showResults}
                userSentiment={card.userSentiment}
              >
              </Card>
            )
          }
        </div>
      </div>
    );
  }
}
