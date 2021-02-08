# Retro

A tool for running retros.

![App Screenshot](https://user-images.githubusercontent.com/3317231/107178416-f57cd600-6988-11eb-884e-fff71f8c9e79.png)

## Features

1. Drag and drop cards between columns.
2. **Anonymity**
   - Each user has a session but no personal identifying information is required.
   - You only see your ⭐️s that you've given to cards while in voting mode.
3. **Review mode**
   - See the total number of ⭐️ values given to each card
   - Quickly identify the cards with the most ⭐️s using sorting.
4. Markdown syntax support for `**bold**, _italic_, ![image](src)`, and `inline_code`.
5. Data stored in memory only. Once you stop the server, all data is erased.

## Setup

1. `npm install` - Install package dependencies.

## Serve the app from your computer to others over HTTPS via NGROK

1. `npm run prod`

## Development

- `npm start` - Start the app
- `npm run test` - Run tests

This app uses [OvermindJS](https://overmindjs.org/) as the state management library. If you use VS Code, install [the dev tool extension](https://marketplace.visualstudio.com/items?itemName=christianalfoni.overmind-devtools-vscode)
