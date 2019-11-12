import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import "./card.css";

interface CardProps {
  key: string;
  id: string;
  deleteCard: (event: React.MouseEvent, key: string) => void;
}

export class Card extends React.Component<CardProps, {}> {
  render() {
    return (
      <div className="card-container">
        I'm a card!
        <a href="" onClick={event => this.props.deleteCard(event, this.props.id)}><FontAwesomeIcon icon={faTrash} /></a>
      </div>
    );
  }
}