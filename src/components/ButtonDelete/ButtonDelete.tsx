import React, { MouseEvent, ReactText } from "react";
import "./button-delete.css";
interface ButtonDeleteProps {
  id: ReactText;
  handleClick: (event: MouseEvent, id: ReactText) => void;
}

export const ButtonDelete = (props: ButtonDeleteProps) => (
  <span className="button--delete" onClick={event => props.handleClick(event, props.id)}>🗑️</span>
);
