import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPencilAlt, faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons";

import "./card.css";

interface CardProps {
  key: string;
  id: string;
  deleteCard: (event: React.MouseEvent, id: string) => void;
  editable: boolean;
  socket: SocketIOClient.Socket;
  columnId: string;
  boardId: string;
  text: string;
  votes: number;
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
      votes: this.props.votes,
      text: this.props.text,
    }

    if (!this.props.editable) {
      stateToSet.isEditing = false;
    }
    this.state = stateToSet;
  }

  componentDidMount() {
    console.log("component mounted!")
    this.props.socket.on(`card:updated:${this.props.id}`, (data: any) => {
      this.setState({
        text: data.text,
      });
    });

    this.props.socket.on(`card:voted:${this.props.id}`, (data: any) => {
      if(data && data.vote) {
        this.setState({
          votes: this.state.votes + data.vote,
        });
      }
    });
  }

  componentWillUnmount() {
    this.props.socket.removeListener(`card:updated:${this.props.id}`);
    this.props.socket.removeListener(`card:voted:${this.props.id}`);
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

    this.props.socket.emit(`card:updated`, {
      boardId: this.props.boardId,
      columnId: this.props.columnId,
      id: this.props.id,
      text: this.state.text,
    });
  }

  voteUp(event: React.MouseEvent) {
    event.preventDefault();

    this.props.socket.emit("card:voted", {
      boardId: this.props.boardId,
      columnId: this.props.columnId,
      id: this.props.id,
      vote: 1
    });
  }

  voteDown(event: React.MouseEvent) {
    event.preventDefault();

    this.props.socket.emit("card:voted", {
      boardId: this.props.boardId,
      columnId: this.props.columnId,
      id: this.props.id,
      vote: -1
    });
  }

  render() {
    let cardContents;

    if (this.state.isEditing) {
      cardContents = (
        <div>
          <textarea
            onChange={event => this.setState({text: event.target.value})}
            value={this.state.text}>
          </textarea>
          <button onClick={event => this.save(event)}>Add</button>
          <a href="" onClick={event => this.props.deleteCard(event, this.props.id)}>
            <FontAwesomeIcon icon={faTrash} />
          </a>
        </div>
      );
    } else {
      let downvote;
      if (this.state.votes > 0) {
        downvote = (
          <a href="" onClick={event => this.voteDown(event)} className="vote-link">
            <FontAwesomeIcon icon={faThumbsDown} />
          </a>
        );
      }

      let editLink;
      if (this.props.editable) {
        editLink = (
          <a href="" onClick={event => this.flipEditable(event)} className="edit-link">
            <FontAwesomeIcon icon={faPencilAlt} />
          </a>
        );
      }

      let textAndNonEditable = !this.props.editable && this.state.text === ""

      cardContents = (
        <div className={textAndNonEditable ? "blur" : undefined}>
          <div>{this.state.text}{editLink}</div>
          <a href="" onClick={event => this.voteUp(event)} className="vote-link">
            <FontAwesomeIcon icon={faThumbsUp} />
          </a>
          <span className="vote-count">{this.state.votes}</span>
          {downvote}
        </div>
      );
    }

    return (
      <div className="card-container">
        {cardContents}
      </div>
    );
  }
}
