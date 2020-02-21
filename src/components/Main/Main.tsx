import * as React from "react";
import { Column } from "../Column/Column";
import uuid = require("uuid");
import { BoardControls } from "../BoardControls/BoardControls";

import "./main.css";
import { faBorderNone } from "@fortawesome/free-solid-svg-icons";

interface MainProps {
  socket: SocketIOClient.Socket;
  boardId: string;
  showResults: boolean;
}

export enum SortDirection {
  "none",
  "asc",
  "desc",
};
interface MainState {
  columns: BoardColumn[];
  boardTitle: string;
  remainingStars?: number | undefined;
  sortDirection: SortDirection;
}

export class Main extends React.Component<MainProps, MainState> {
  constructor(props: any) {
    super(props);
    this.state = {
      columns: [],
      boardTitle: "",
      sortDirection: SortDirection.none,
    };
  }

  componentDidMount() {
    this.props.socket.on(`board:loaded:${this.props.boardId}`, (
      data: { board: Board, sessionId: string, remainingStars: number, showResults: boolean },
    ) => {
      this.setState({
        remainingStars: data.remainingStars,
        boardTitle: data.board.title,
      });
      sessionStorage.setItem("retroSessionId", data.sessionId);
      data.board.columns.forEach((column: {id: string}) => {
        this.addColumn(column);
      });
    });

    this.props.socket.on(`board:updated:${this.props.boardId}`, (data: any) => {
      this.setState({
        boardTitle: data.title,
      });
    });

    this.props.socket.on(`board:update-remaining-stars:${this.props.boardId}`, (data: any) => {
      this.setState({
        remainingStars: data.remainingStars,
      });
    })

    this.props.socket.on(`column:created:${this.props.boardId}`, (data: any) => {
      this.addColumn(data);
    });

    this.props.socket.on(`column:deleted:${this.props.boardId}`, (data: any) => {
      this.deleteColumn(null, data.id, true);
    });
  }

  componentWillUnmount() {
    this.props.socket.removeListener(`board:loaded:${this.props.boardId}`);
    this.props.socket.removeListener(`board:update-remaining-stars:${this.props.boardId}`);
    this.props.socket.removeListener(`column:deleted:${this.props.boardId}`);
    this.props.socket.removeListener(`column:created:${this.props.boardId}`);
  }

  sortColumnCardsByStars = () => {
    let newSortDirection = SortDirection.none;

    switch(this.state.sortDirection) {
      case SortDirection.none:
        newSortDirection = SortDirection.desc;
        break;
      case SortDirection.asc:
        newSortDirection = SortDirection.desc;
        break;
      case SortDirection.desc:
        newSortDirection = SortDirection.asc;
        break;
      default:
        break;
    }
    this.setState({ sortDirection: newSortDirection });
  }

  addColumn(column?: any) {
    let newColumns = this.state.columns.slice(0);
    if (column) {
      newColumns.push({ id: column.id, name: column.name, isEditing: false });
      this.props.socket.emit("column:loaded", {
        boardId: this.props.boardId,
        id: column.id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    } else {
      const newColumn = { id: uuid.v4(), name: "New Column", isEditing: true, new: true };

      newColumns.push(newColumn);
    }

    this.setState({columns: newColumns });
  }

  renderColumns() {
    let markup: JSX.Element[] = [];
    const oneHundredPercent = 100;
    const columnCount = this.state.columns.length;
    const maxWidthPercentage = oneHundredPercent / columnCount;

    for (let i = 0; i < columnCount; i++) {
      let name = this.state.columns[i].name;
      markup.push(
        <Column
          key={this.state.columns[i].id}
          id={this.state.columns[i].id}
          name={name}
          deleteColumn={(event) =>this.deleteColumn(event, this.state.columns[i].id)}
          socket={this.props.socket}
          boardId={this.props.boardId}
          maxWidthPercentage={maxWidthPercentage}
          isEditing={this.state.columns[i].isEditing}
          showResults={this.props.showResults}
          new={this.state.columns[i].new}
          sortDirection={this.state.sortDirection}
        >
        </Column>
      );
    }

    return markup;
  }

  deleteColumn(event: React.MouseEvent | null, id: string, fromSocket: boolean = false) {
    if (event) {
      event.preventDefault();
    }

    let newColumns = this.state.columns.filter((column: BoardColumn) => {
      return column.id !== id;
    });

    if (!fromSocket) {
      this.props.socket.emit(`column:deleted`, {
        boardId: this.props.boardId,
        id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    }

    this.setState({columns: newColumns});
  }

  render() {
    return (
      <main>
        <BoardControls
          sortColumnCardsByStars={this.sortColumnCardsByStars}
          showResults={this.props.showResults}
          addColumn={() => this.addColumn()}
          title={this.state.boardTitle}
          socket={this.props.socket}
          boardId={this.props.boardId}
          remainingStars={this.state.remainingStars}
          sortDirection={this.state.sortDirection}
        />
        <div id="columns">
          {this.renderColumns()}
        </div>
      </main>
    );
  }
}
