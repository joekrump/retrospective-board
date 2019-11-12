import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare, faTrash, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { Card } from "../Card/Card";

interface CardData {
  key: string;
}

interface ColumnProps {
  key: string;
  id: string;
  name: string;
  deleteColumn: (event: React.MouseEvent, key: string) => void;
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
  }

  addCard() {
    let newCards = this.state.cards.slice(0);
    newCards.push({key: `card-${this.state.lastIndex + 1}`});
    this.setState({cards: newCards, lastIndex: this.state.lastIndex + 1});
  }

  renderCards() {
    let markup: JSX.Element[] = [];

    for (let i = 0; i < this.state.cards.length; i++) {
      markup.push(
        <Card
          key={this.state.cards[i].key}
          id={this.state.cards[i].key}>
        </Card>
      );
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