import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPencilAlt, faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons";

import "./card.css";

interface CardProps {
  key: string;
  id: string;
  deleteCard: (event: React.MouseEvent, key: string) => void;
  text?: string;
  editable: boolean;
  onCardSaved: (data: any) => void;
}

interface CardState {
  isEditing: boolean;
  text: string;
  votes: number;
}

export class Card extends React.Component<CardProps, CardState> {
  constructor(props: CardProps) {
    super(props);

    let stateToSet = {
      isEditing: true,
      votes: 0,
      text: "",
    }

    if (this.props.text) {
      stateToSet.isEditing = false;
      stateToSet.text = this.props.text;
    }
    this.state = stateToSet;
  }

  flipEditable(event: React.MouseEvent) {
    event.preventDefault();
    let newState = {
      isEditing: !this.state.isEditing,
    }

    this.setState(newState);
  }

  save(event: React.MouseEvent) {
    this.flipEditable(event);

    this.props.onCardSaved({
      id: this.props.id,
      text: this.state.text,
    });
  }

  voteUp(event: React.MouseEvent) {
    event.preventDefault();

    this.setState({
      votes: this.state.votes + 1,
    })
  }

  voteDown(event: React.MouseEvent) {
    event.preventDefault();

    this.setState({votes: this.state.votes - 1});
  }

  render() {
    let cardContents;

    if (this.state.isEditing) {
      cardContents = (
        <div>
          <textarea onChange={event => this.setState({text: event.target.value})} value={this.state.text}></textarea>
          <button onClick={event => this.save(event)}>Add</button>
          <a href="" onClick={event => this.props.deleteCard(event, this.props.id)}><FontAwesomeIcon icon={faTrash} /></a>
        </div>
      );
    } else {
      let downvote;
      if (this.state.votes > 0) {
        downvote = (
          <a href="" onClick={event => this.voteDown(event)} className="vote-link"><FontAwesomeIcon icon={faThumbsDown} /></a>
        );
      }

      let editLink;
      if (this.props.editable) {
        editLink = (
          <a href="" onClick={event => this.flipEditable(event)} className="edit-link"><FontAwesomeIcon icon={faPencilAlt} /></a>
        );
      }

      cardContents = (
        <div>
          <div>{this.state.text}</div>
          {editLink}
          <a href="" onClick={event => this.voteUp(event)} className="vote-link"><FontAwesomeIcon icon={faThumbsUp} /></a>
          <span className="vote-count">{this.state.votes}</span>
          {downvote}
        </div>);
    }

    return (
      <div className="card-container">
        {cardContents}
      </div>
    );
  }
}