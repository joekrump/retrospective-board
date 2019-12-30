import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPencilAlt, faThumbsUp, faThumbsDown, faThList } from "@fortawesome/free-solid-svg-icons";

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
  votesCount: number;
  netSentiment: number;
  showResults: boolean;
}

interface CardState {
  isEditing: boolean;
  text: string;
  votesCount: number;
  netSentiment: number;
  userSentiment: number;
}

export class Card extends React.Component<CardProps, CardState> {
  constructor(props: CardProps) {
    super(props);

    let stateToSet = {
      isEditing: true,
      votesCount: this.props.votesCount,
      netSentiment: this.props.netSentiment,
      text: this.props.text,
      userSentiment: 0,
    }

    if (!this.props.editable) {
      stateToSet.isEditing = false;
    }
    this.state = stateToSet;
  }

  componentDidMount() {
    this.props.socket.on(`card:updated:${this.props.id}`, (data: any) => {
      this.setState({
        text: data.text,
      });
    });

    this.props.socket.on(`card:voted:${this.props.id}`, (
      data: { netSentiment: number, votesCount: number, userSentiment: number }
    ) => {
      if(!!data) {
        this.setState({
          votesCount: data.votesCount,
          netSentiment: data.netSentiment,
          userSentiment: !!data.userSentiment ? data.userSentiment : this.state.userSentiment,
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

  renderUserSentiment() {
    return (
      <span className="sentiment">
        Your Vote: {this.state.userSentiment > 0 ? `+${this.state.userSentiment}` : this.state.userSentiment}
      </span>
    );
  }

  renderResults() {
    return (
      <>
        <span className="vote-count">Votes:{this.state.votesCount}</span>
        <span className="sentiment">
          Sentiment: {this.state.netSentiment > 0 ? `+${this.state.netSentiment}` : this.state.netSentiment}
        </span>
      </>
    );
  }

  render() {
    let cardContents;

    if (this.state.isEditing) {
      cardContents = (
        <div>
          <textarea
            autoFocus={true}
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
          <button onClick={event => this.voteUp(event)} className="vote-link">
            <FontAwesomeIcon icon={faThumbsUp} />
          </button>
          <button onClick={event => this.voteDown(event)} className="vote-link">
            <FontAwesomeIcon icon={faThumbsDown} />
          </button>
          { this.props.showResults ? this.renderResults() : this.renderUserSentiment() }
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
