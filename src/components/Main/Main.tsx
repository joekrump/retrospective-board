import React, { useEffect, useMemo } from "react";
import { Column } from "../Column/Column";
import uuid = require("uuid");
import { BoardControls } from "../BoardControls/BoardControls";
import { useOvermind } from "../../overmind";

import "./main.css";
import { AppMode } from "../../overmind/state";

interface MainProps {
  socket: SocketIOClient.Socket;
  boardId: string;
}

export enum SortDirection {
  "none",
  "asc",
  "desc",
};

export const Main = (props: MainProps) => {
  const { state: { columns }, actions } = useOvermind();
  const [boardTitle, updateBoardTitle] = React.useState("" as string);
  const [sortDirection, updateSortDirection] = React.useState(SortDirection.desc);
  const [remainingStars, updateRemainingStars] = React.useState(null as unknown as number);
  let { state: { mode } } = useOvermind();

  useEffect(function onMount() {
    props.socket.on(`board:loaded:${props.boardId}`, (
      data: { board: Board, sessionId: string, remainingStars: number, showResults: boolean },
    ) => {
      updateBoardTitle(data.board.title);
      updateRemainingStars(data.remainingStars);
      sessionStorage.setItem("retroSessionId", data.sessionId);

      const initialColumns = data.board.columns.map((column: { id: string; name: string; }) => ({
        ...column,
        isEditing: false
      }));
      actions.setColumns(initialColumns);

      props.socket.on(`board:update-remaining-stars:${props.boardId}:${data.sessionId}`, (data: any) => {
        updateRemainingStars(data.remainingStars);
      });
    });

    props.socket.on(`board:updated:${props.boardId}`, (data: any) => {
      updateBoardTitle(data.title);
    });

    props.socket.on(`column:created:${props.boardId}`, (data: any) => {
      addColumn(data);
    });

    props.socket.on(`column:deleted:${props.boardId}`, (data: any) => {
      deleteColumn(null, data.id, true);
    });

    return function cleanup() {
      props.socket.removeListener(`board:loaded:${props.boardId}`);
      props.socket.removeListener(`board:update-remaining-stars:${props.boardId}`);
      props.socket.removeListener(`column:deleted:${props.boardId}`);
      props.socket.removeListener(`column:created:${props.boardId}`);
    };
  }, [columns]);

  const sortColumnCardsByStars = () => {
    let newSortDirection = SortDirection.none;

    switch(sortDirection as SortDirection) {
      case SortDirection.asc:
        newSortDirection = SortDirection.desc;
        break;
      case SortDirection.desc:
        newSortDirection = SortDirection.asc;
        break;
      default:
        break;
    }
    updateSortDirection(newSortDirection);
  }

  function addColumn(column?: any) {
    let boardColumn: BoardColumn;

    if (column) {
      boardColumn = { id: column.id, name: column.name, isEditing: false };
      props.socket.emit("column:loaded", {
        boardId: props.boardId,
        id: column.id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    } else {
      boardColumn = { id: uuid.v4(), name: "New Column", isEditing: true, new: true };
    }

    actions.addColumn(boardColumn);
  }

  function renderColumns() {
    let markup: JSX.Element[] = [];
    const oneHundredPercent = 100;
    const columnCount = columns.length;
    const maxWidthPercentage = oneHundredPercent / columnCount;

    for (let i = 0; i < columnCount; i++) {
      let name = columns[i].name;
      markup.push(
        <Column
          key={columns[i].id}
          id={columns[i].id}
          name={name}
          deleteColumn={(event) => deleteColumn(event, columns[i].id)}
          socket={props.socket}
          boardId={props.boardId}
          maxWidthPercentage={maxWidthPercentage}
          isEditing={columns[i].isEditing}
          new={columns[i].new}
          sortDirection={sortDirection}
        />
      );
    }

    if (mode !== AppMode.review) {
      markup.push(
        <div className="column" key="add-new-column">
          <div className="add-column--button-filler">

          </div>
          <button
            title="Add Column"
            className="button button--add-column"
            onClick={() => addColumn()}
          >
            +
          </button>
        </div>
      );
    }

    return markup;
  }

  function deleteColumn(event: React.MouseEvent | null, id: string, fromSocket: boolean = false) {
    if (event) {
      event.preventDefault();
    }

    for (let i = 0; i < columns.length; i++) {
      if (columns[i].id === id) {
        actions.deleteColumn(columns[i]);
        break;
      }
    }

    if (!fromSocket) {
      props.socket.emit(`column:deleted`, {
        boardId: props.boardId,
        id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    }
  }

  const memoizedColumns = useMemo(() => {
    return renderColumns();
  }, [columns]);

  return (
    <main>
      <BoardControls
        sortColumnCardsByStars={sortColumnCardsByStars}
        title={boardTitle}
        socket={props.socket}
        boardId={props.boardId}
        remainingStars={remainingStars}
        sortDirection={sortDirection}
      />
      <div id="columns">
        { memoizedColumns }
      </div>
    </main>
  );
}
