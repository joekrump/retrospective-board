# Retrospective Board

[![CI](https://github.com/joekrump/retro-board/actions/workflows/main.yml/badge.svg)](https://github.com/joekrump/retro-board/actions/workflows/main.yml)

A tool for helping run [a retrospective meeting](https://www.softwaretestinghelp.com/agile-retrospective-meetings/).

## Features

1. Drag and drop cards between columns.
2. **Anonymity**
   - Each user has a session but no personal identifying information is required.
   - You only see your ⭐️s that you've given to cards while in "active" mode.
3. **Review mode**
   - See the total number of ⭐️ values given to each card
   - Quickly identify the cards with the most ⭐️s using sorting.
4. Markdown syntax support for `**bold**, _italic_, ![image](src)`, and `inline_code`.
5. Data stored in memory only. Once you stop the server, all data is erased.

![App Screenshot](https://user-images.githubusercontent.com/3317231/107178416-f57cd600-6988-11eb-884e-fff71f8c9e79.png)


## Setup

1. `yarn install` - Install package dependencies.

## Serve the app from your computer to others over HTTPS via NGROK

1. `yarn run prod`

## Development

- `yarn start` - Start the app
- `yarn run test` - Run tests

This app uses [OvermindJS](https://overmindjs.org/) as the state management library. If you use VS Code, install [the dev tool extension](https://marketplace.visualstudio.com/items?itemName=christianalfoni.overmind-devtools-vscode)
