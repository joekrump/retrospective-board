import * as React from "react";

import "./app.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as faIcons from "@fortawesome/free-solid-svg-icons";
import { Column } from "../Column/Column";
import { Header } from "../Header/Header";
import { Main } from "../Main/Main";

export class App extends React.Component<{}, {}> {
  render() {
    return (
      <>
        <Header></Header>
        <Main></Main>
        <footer></footer>
      </>
    );
  }
}
