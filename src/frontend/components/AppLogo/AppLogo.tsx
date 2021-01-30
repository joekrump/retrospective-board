import React from "react";
import "./app-logo.css";

const icon = require("./images/android-chrome-192x192.png");

export const AppLogo = () => {
  return <img className="app-icon--img" src={icon} alt="Pineapple Logo" />
};
