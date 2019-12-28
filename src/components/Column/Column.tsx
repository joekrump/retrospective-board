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
  votes?: number;
}

interface ColumnProps {
  key: string;
  id: string;
  name: string;
  deleteColumn: (event: React.MouseEvent, id: string) => void;
  socket: SocketIOClient.Socket;
  boardId: string;
  maxWidthPercentage: number;
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
      isEditing: false,
    };

    this.nameInput = React.createRef();
  }

  componentDidMount() {
    this.props.socket.on(`column:loaded:${this.props.id}`, (data: any) => {
      for (let i = 0; i < data.cards.length; i++) {
        if (!!data.cards[i].text) {
          this.addCard({
            id: data.cards[i].id,
            editable: false,
            text: data.cards[i].text,
            votes: data.cards[i].votes,
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
      let newCard = {id: `card-${uuid.v4()}`, editable: true }
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

  renderCards() {
    let markup: JSX.Element[] = [];

    for (let i = 0; i < this.state.cards.length; i++) {
      let card = this.state.cards[i];

      markup.push(
        <Card
          key={card.id}
          id={card.id}
          deleteCard={(event, id) => this.deleteCard(event, id)}
          editable={card.editable}
          socket={this.props.socket}
          columnId={this.props.id}
          boardId={this.props.boardId}
          text={card.text ? card.text : ""}
          votes={card.votes ? card.votes : 0}>
        </Card>
      );
    }

    return markup;
  }

  flipIsEditing(event?: React.MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    this.setState({
      isEditing: !this.state.isEditing,
    });
  }

  updateColumnName() {
    this.setState({
      name: (this.nameInput as any).current.value
    });
    this.props.socket.emit("column:updated", {
      boardId: this.props.boardId,
      id: this.props.id,
      name: (this.nameInput as any).current.value
    });
    this.flipIsEditing();
  }

  render() {
    if (this.state.isEditing) {
      return (
        <div className="column column-edit" style={{maxWidth: `${this.props.maxWidthPercentage}%`}}>
          <input type="text" defaultValue={this.state.name} ref={this.nameInput} />
          <button onClick={this.updateColumnName.bind(this)}>Save</button>
          <a href="" onClick={event => this.flipIsEditing(event)}>cancel</a>
        </div>
      )
    }

    return (
      <div className="column">
        <div className="header-row">
          <h2 onClick={this.flipIsEditing.bind(this)}>
            {this.state.name}<FontAwesomeIcon icon={faPencilAlt} />
          </h2>
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
          {this.renderCards()}
        </div>
      </div>
    );
  }
}
