# Foundryborne Daggerheart

## Table of Contents

- [Overview](#overview)
- [User Install Guide](#user-install)
- [Documentation](#documentation)
- [Developer Setup](#development-setup)
- [Contribution Info](#contributing)

## Overview

This is the community repo for the Foundry VTT system _Foundryborne_ Daggerheart. It is not associated with Critical Role or Darrington Press.

## User Install

1. **Recommended** Searching for _Daggerheart_ or _Foundryborne_ in the System Installation dialogue of the FoundryVTT admin settings.
2. Pasting `https://raw.githubusercontent.com/Foundryborne/daggerheart/refs/heads/main/system.json` into the Install System dialog on the Setup menu of the application.
3. Downloading one of the .zip archives from the Releases page and extracting it into your foundry Data folder, under Data/systems/daggerheart.

## Documentation

You can find the documentation here: https://github.com/Foundryborne/daggerheart/wiki

## Development Setup

1. **Navigate to the repo directory:**

    ```bash
    cd <path>/<to>/<repo>
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure your Foundry paths:**

    ```bash
    npm run setup:dev -- --foundry-path="/path/to/foundry/main.js" --data-path="/path/to/data"
    ```

4. **Start developing:**
    ```bash
    npm start
    ```

### Available Scripts

- `npm run setup:dev -- --foundry-path="<path>" --data-path="<path>"` - Configure development environment
- `npm run build` - One-time build
- `npm start` - Start development with file watching, Foundry launching, and a dev proxy overlay (no symlink, no copy)

### Dev Notes

- No symlink or copying required: a dev proxy overlays `systems/daggerheart` assets from your repo at `http://localhost:30001` while the official install remains intact on the base Foundry port.
- Usage: start Foundry (served at `http://localhost:30000`) and the dev proxy (served at `http://localhost:30001`). Open `http://localhost:30001` to see your dev version; close it to return to the installed version at `http://localhost:30000`.
- Your `.env` file is ignored by git, so each developer can have their own configuration
  [Foundry VTT Website][1]

[1]: https://foundryvtt.com/

## Contributing

Looking to contribute to the project? Look no further, check out our [contributing guide](contributing.md), and keep the [Code of Conduct](coc.md) in mind when working on things.

## Disclaimer:

**Daggerheart System**
Daggerheart is a trademark of Darrington Press LLC. All original content, mechanics, and intellectual property related to the Daggerheart roleplaying game are © Darrington Press LLC.

This project is intended for personal or non-commercial use. All rights to Daggerheart’s original materials remain with their respective owners.

**Free Icons**
Some Icons used in this project are provided by https://game-icons.net and are licensed under the Creative Commons Attribution 3.0 Unported (CC BY 3.0).

This project is an unofficial fan creation and is not affiliated with or endorsed by Darrington Press or Critical Role.
