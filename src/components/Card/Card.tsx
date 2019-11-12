import * as React from "react";

interface CardProps {
  key: string;
  id: string;
}

export class Card extends React.Component<CardProps, {}> {
  render() {
    return (<div>I'm a card!</div>);
  }
}