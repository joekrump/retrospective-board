import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare, faTrash, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { Card } from "../Card/Card";
import * as uuid from "uuid";


import "./column.css";

interface CardData {
  key: string;
  text?: string;
}

interface ColumnProps {
  key: string;
  id: string;
  name: string;
  deleteColumn: (event: React.MouseEvent, key: string) => void;
  socket: SocketIOClient.Socket,
}

interface ColumnState {
  cards: CardData[];
  lastIndex: number;
}

export class Column extends React.Component<ColumnProps, ColumnState> {
  constructor(props: ColumnProps) {
    super(props);

    this.state = {
      cards: [],
      lastIndex: 0,
    };

    this.props.socket.on("card-created", (data: any) => {
      if (data.column === this.props.id) {
        console.log(data);
        if (!this.state.cards.some((card: CardData) => card.key === data.id)) {
          console.log("adding from socket");
          this.addCardFromSocket({key: data.id, text: data.text});
        }
      }
    });
  }

  addCardFromSocket(card: CardData) {
    let newCards = this.state.cards.slice(0);
    newCards.push(card);
    console.log("we settin' state:");
    console.log(newCards[newCards.length - 1]);
    this.setState({cards: newCards, lastIndex: this.state.lastIndex + 1});
  }

  addCard() {
    console.log("addCard called");
    let newCards = this.state.cards.slice(0);
    newCards.push({key: `card-${uuid.v4()}`});
    this.setState({cards: newCards, lastIndex: this.state.lastIndex + 1});
  }

  onCardSaved(data: any) {
    this.props.socket.emit("cardCreated", {
      id: data.id,
      column: this.props.id,
      text: data.text,
    });
  }

  deleteCard(event: React.MouseEvent, key: string) {
    event.preventDefault();

    let newCards = this.state.cards.filter((card: CardData) => {
      return card.key !== key;
    });

    this.setState({cards: newCards});
  }

  renderCards() {
    let markup: JSX.Element[] = [];

    for (let i = 0; i < this.state.cards.length; i++) {
      if (this.state.cards[i].text) {
        markup.push(
          <Card
            key={this.state.cards[i].key}
            id={this.state.cards[i].key}
            deleteCard={(event, key) => this.deleteCard(event, key)}
            text={this.state.cards[i].text}
            editable={false}
            onCardSaved={this.onCardSaved.bind(this)}>
          </Card>
        );
      } else {
        markup.push(
          <Card
            key={this.state.cards[i].key}
            id={this.state.cards[i].key}
            deleteCard={(event, key) => this.deleteCard(event, key)}
            editable={true}
            onCardSaved={this.onCardSaved.bind(this)}>
          </Card>
        );
      }
    }

    return markup;
  }

  render() {
    return (
      <div className="column">
        <div className="header-row">
          <h2><FontAwesomeIcon icon={faSquare} />{this.props.name}</h2>
          <a href="" onClick={event => this.props.deleteColumn(event, this.props.id)}><FontAwesomeIcon icon={faTrash} /></a>
        </div>
        <div className="body-row">
          <button style={ {width:"100%"} } onClick={() => this.addCard()}><FontAwesomeIcon icon={faPlusCircle} /></button>
          {this.renderCards()}
        </div>
      </div>
    );
  }
}