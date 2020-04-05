import React, { FormEvent, RefObject, MouseEvent } from "react";
import { ButtonDelete } from "../ButtonDelete/ButtonDelete";

import "./column-header.css";

interface ColumnHeaderProps {
  columnId: string;
  isEditing: boolean;
  name?: string;
  nameInputRef: RefObject<HTMLInputElement>
  onSubmit: (e: FormEvent) => void;
  onEditToggle: (e: MouseEvent) => void;
  onDeleteClick: (e: MouseEvent, id: string) => void;
}

export const ColumnHeader = (props: ColumnHeaderProps) => {
  if(props.isEditing) {
    return (
      <form
        className="column-header column-header--editing"
        onSubmit={event => props.onSubmit(event)}
      >
        <input
          className="column-header--text"
          type="text"
          defaultValue={props.name}
          ref={props.nameInputRef}
          autoFocus={true}
        />
        <div className="column-header--controls">
          <div className="column--header--controls--primary">
            <button type="submit">
              <span className="gg-check"></span>
            </button>
            <button type="button" onClick={event => props.onEditToggle(event)}>
              <span className="gg-close"></span>
            </button>
          </div>
          <ButtonDelete id={props.columnId} handleClick={(e, id) => props.onDeleteClick(e, id)}/>
        </div>
      </form>
    );
  } else {
    return (
      <h2
        className="column-header column-header--text"
        onClick={event => props.onEditToggle(event)}
      >
        {props.name}
      </h2>
    );
  }
};
