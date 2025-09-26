import { Router } from "express";
import compile from "lodash.template";
import React from "react";
import { renderToString } from "react-dom/server";
import { JssProvider, SheetsRegistry } from "react-jss";
import App from "../components/App";
import templateContent from "./index.ejs";

const template = compile(templateContent);

export default (chunks) => {
  const router = new Router();
  const sheets = new SheetsRegistry();
  const app = renderToString(
    <JssProvider registry={sheets}>
      <App />
    </JssProvider>,
  );
  router.use((req, res) => {
    res.status(200);
    res.send(
      template({
        chunks,
        app,
        css: sheets.toString(),
      }),
    );
  });
  return router;
};
