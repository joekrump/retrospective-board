import React, { MouseEvent, ReactText } from "react";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ButtonDeleteProps {
  id: ReactText;
  handleClick: (event: MouseEvent, id: ReactText) => void;
}

export const ButtonDelete = (props: ButtonDeleteProps) => {
  return (
    <a
      href=""
      onClick={event => props.handleClick(event, props.id)}
    >
      <FontAwesomeIcon icon={faTrash} />
    </a>
  );
};
