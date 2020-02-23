import React from "react";
import "./app-icon.css";

const icon = require("./images/android-chrome-192x192.png");

export const AppIcon = () => {
  return <img className="app-icon--img" src={icon} alt="Pineapple Logo" />
};
