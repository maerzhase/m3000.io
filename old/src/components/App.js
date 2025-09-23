import React, { Component } from "react";
import { hot } from "react-hot-loader";
import { ThemeProvider } from "react-jss";

import Content from "./Content";

if (global.window) {
  const loadFont = async (config) => {
    const load = await require("webfontloader").load; // eslint-disable-line
    load(config);
  };
  loadFont({
    google: {
      families: ["IBM Plex Sans:400,700"],
    },
  });
}

const dark = {
  // eslint-disable-line
  color: "black",
};

const light = {
  background:
    "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(246,246,246,1) 47%, rgba(242,242,242,1) 100%)",
  color: "black",
  primary: "rgb(232,79,37)",
  fade: () => ({ transition: "color ease-in-out 300ms" }),
  spacing: {
    unit: "8",
  },
};

class App extends Component {
  // eslint-disable-line
  render() {
    return (
      <ThemeProvider theme={light}>
        <Content />
      </ThemeProvider>
    );
  }
}

export default hot(module)(App);
