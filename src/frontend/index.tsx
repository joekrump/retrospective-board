import React from "react";
import { render } from "react-dom";
import { Provider as AppStateProvider} from "overmind-react";
import { overmind } from "./overmind";
import { App } from "./components/App/App";

render(
  <AppStateProvider value={overmind}>
    <App />
  </AppStateProvider>,
  document.getElementById("react-root"),
);
