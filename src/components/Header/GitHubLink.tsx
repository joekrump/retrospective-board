import React from "react";
const packageDetails = require("../../../package.json");
const githubLogo = require("./github_light.png").default;

type Props = {
  width: number | string;
  height: number | string;
};

export const GitHubLink = ({ width, height }: Props): JSX.Element => {
  return (
    <a href={packageDetails.homepage} title="GitHub Repo" target="_blank" style={{ width, height }}>
      <img src={githubLogo} alt="GitHub Logo" width={width} height={height} />
    </a>
  );
};
