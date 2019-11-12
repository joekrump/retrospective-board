import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import "./card.css";

interface CardProps {
  key: string;
  id: string;
  deleteCard: (event: React.MouseEvent, key: string) => void;
}

interface CardState {
  isEditing: boolean;
  text: string;
}

export class Card extends React.Component<CardProps, CardState> {
  constructor(props: CardProps) {
    super(props);

    this.state = {
      isEditing: true,
      text: ""
    };
  }

  flipEditable() {
    this.setState({
      isEditing: !this.state.isEditing,
    });
  }

  render() {
    let cardContents;
    let buttonText;
    if (this.state.isEditing) {
      cardContents = (<textarea defaultValue={this.state.text}></textarea>);
      buttonText = "Add";
    } else {
      cardContents = (<>{this.state.text}</>);
      buttonText = "Edit";
    }

    return (
      <div className="card-container">
        {cardContents}
        <button onClick={() => this.flipEditable()}>{buttonText}</button>
        <a href="" onClick={event => this.props.deleteCard(event, this.props.id)}><FontAwesomeIcon icon={faTrash} /></a>
      </div>
    );
  }
}