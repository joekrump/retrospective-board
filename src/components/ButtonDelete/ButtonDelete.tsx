import React, { MouseEvent, ReactText } from "react";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./button-delete.css";
interface ButtonDeleteProps {
  id: ReactText;
  handleClick: (event: MouseEvent, id: ReactText) => void;
}

export const ButtonDelete = (props: ButtonDeleteProps) => (
  <FontAwesomeIcon tabIndex={0} className="button--delete" icon={faTrash} onClick={event => props.handleClick(event, props.id)} />
);
