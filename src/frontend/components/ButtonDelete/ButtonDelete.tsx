import React, { MouseEvent } from "react";
import "./button-delete.css";
interface ButtonDeleteProps {
  id: string;
  handleClick: (event: MouseEvent, id: string) => void;
}

export const ButtonDelete = (props: ButtonDeleteProps) => (
  <button title="Delete" tabIndex={0} className="button--delete" onClick={event => props.handleClick(event, props.id)} >
    <span className="gg-trash"></span>
  </button>
);
