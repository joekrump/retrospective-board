import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faUndo } from "@fortawesome/free-solid-svg-icons";
import { ButtonDelete } from "../ButtonDelete/ButtonDelete";

import "./card.css";

interface CardProps {
  key: string;
  id: string;
  deleteCard: (event: React.MouseEvent, id: string) => void;
  editable: boolean;
  isEditing: boolean;
  socket: SocketIOClient.Socket;
  columnId: string;
  boardId: string;
  text: string;
  starsCount: number;
  showResults: boolean;
  userStars: number;
}

interface CardState {
  isEditing: boolean;
  text: string;
  starsCount: number;
  userStars: number;
}

export class Card extends React.Component<CardProps, CardState> {
  constructor(props: CardProps) {
    super(props);

    let stateToSet = {
      isEditing: this.props.isEditing,
      text: this.props.text,
      userStars: this.props.userStars,
      starsCount: this.props.starsCount,
    }

    this.state = stateToSet;
  }

  componentDidMount() {
    this.props.socket.on(`card:updated:${this.props.id}`, (data: any) => {
      this.setState({
        text: data.text,
      });
    });

    this.props.socket.on(`card:starred:${this.props.id}`, (
      data: { starsCount: number, userStars: number }
    ) => {
      if(!!data) {
        this.setState({
          starsCount: data.starsCount,
          userStars: data.userStars !== undefined ? data.userStars : this.state.userStars,
        });
      }
    });
  }

  componentWillUnmount() {
    this.props.socket.removeListener(`card:updated:${this.props.id}`);
    this.props.socket.removeListener(`card:starred:${this.props.id}`);
  }

  toggleIsEditing(event?: React.MouseEvent) {
    if (!!event) {
      event.preventDefault();
    }
    let newState = {
      isEditing: !this.state.isEditing,
    }

    this.setState(newState);
  }

  save(event: React.FormEvent) {
    event.preventDefault();
    this.toggleIsEditing();

    this.props.socket.emit(`card:updated`, {
      boardId: this.props.boardId,
      columnId: this.props.columnId,
      id: this.props.id,
      text: this.state.text,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
  }

  starUp(event: React.MouseEvent) {
    event.preventDefault();

    this.props.socket.emit("card:starred", {
      boardId: this.props.boardId,
      columnId: this.props.columnId,
      id: this.props.id,
      star: 1,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
  }

  starDown(event: React.MouseEvent) {
    event.preventDefault();

    this.props.socket.emit("card:starred", {
      boardId: this.props.boardId,
      columnId: this.props.columnId,
      id: this.props.id,
      star: -1,
      sessionId: sessionStorage.getItem("retroSessionId"),
    });
  }

  renderUserStars() {
    return (
      <span className="user-stars">
        {this.state.userStars > 0 ? this.state.userStars : this.state.userStars}
      </span>
    );
  }

  renderResults() {
    return (
      <span className="star-count">{this.state.starsCount}</span>
    );
  }

  renderUndoButton() {
    return (
      <button onClick={event => this.starDown(event)} className="undo-button">
        <FontAwesomeIcon icon={faUndo} />
      </button>
    );
  }

  render() {
    let cardContents;

    if (this.state.isEditing) {
      cardContents = (
        <form onSubmit={event => this.save(event)}>
          <textarea
            autoFocus={true}
            onChange={event => this.setState({text: event.target.value})}
            value={this.state.text}>
          </textarea>
          <div className="card--footer">
            <button type="submit">Save</button>
            <ButtonDelete
              id={this.props.id}
              handleClick={(event, id) => this.props.deleteCard(event, id as string)}
            />
          </div>
        </form>
      );
    } else {
      let editLink;
      if (this.props.editable) {
        editLink = (
          <a href="" onClick={event => this.toggleIsEditing(event)} className="edit-link">
            <FontAwesomeIcon icon={faPencilAlt} />
          </a>
        );
      }

      let textAndNonEditable = !this.props.editable && this.state.text === ""

      cardContents = (
        <div className={textAndNonEditable ? "blur" : undefined}>
          <p className="card--text">{this.state.text}{editLink}</p>

          <div className="card--footer">
            <span className="star-button" onClick={event => this.starUp(event)}>
              ⭐️
            </span>
            { this.props.showResults ? this.renderResults() : this.renderUserStars() }
            { this.state.userStars > 0 ? this.renderUndoButton() : null }
          </div>
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
