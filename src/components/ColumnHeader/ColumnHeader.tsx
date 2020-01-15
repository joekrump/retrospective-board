import React, { FormEvent, RefObject, MouseEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
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
        <button type="submit">Save</button>
        <button type="button" onClick={event => props.onEditToggle(event)}>Cancel</button>
        <ButtonDelete id={props.columnId} handleClick={(e, id) => props.onDeleteClick(e, id)}/>
      </form>
    );
  } else {
    return (
      <h2
        className="column-header column-header--text"
        onClick={event => props.onEditToggle(event)}
      >
        {props.name}&nbsp;<FontAwesomeIcon className="pencil-icon" icon={faPencilAlt} />
      </h2>
    );
  }
};
