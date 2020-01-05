import React, { MouseEvent, ReactText } from "react";

interface ButtonDeleteProps {
  id: ReactText;
  handleClick: (event: MouseEvent, id: ReactText) => void;
}

export const ButtonDelete = (props: ButtonDeleteProps) => (
  <span onClick={event => props.handleClick(event, props.id)}>🗑️</span>
);
