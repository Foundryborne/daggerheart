# Foundryborne Daggerheart

## Table of Contents

- [Overview](#overview)
- [User Install Guide](#user-install)
- [Documentation](#documentation)
- [Developer Setup](#development-setup)
- [Contribution Info](#contributing)

## Overview

This is the community repo for the Foundry VTT system *Foundryborne* Daggerheart. It is not associated with Critical Role or Darrington Press.

## User Install

1. **recommended** Searching for *Daggerheart* or *Foundryborne* in the System Instalaltion dialgoe of the FoundryVTT admin settings.
2. Pasting `https://raw.githubusercontent.com/Foundryborne/daggerheart/refs/heads/main/system.json` into the Install System dialog on the Setup menu of the application.
3. Downloading one of the .zip archives from the Releases page and extracting it into your foundry Data folder, under Data/systems/daggerheart.

## Documentation

You can find the documentation here: https://github.com/Foundryborne/daggerheart/wiki

## Development Setup

- Open a terminal in the directory with the repo `cd <path>/<to>/<repo>`
- NOTE: The repo should be placed in the system files are or somewhere else and a link (if on linux) is placed in the system directory
- NOTE: Linux link can be made using `ln -snf <path to development folder> daggerheart` inside the system folder
- Install npm `npm install`
- Update package.json to match your profile

```
"start": "concurrently \"rollup -c --watch\" \"node C:/FoundryDev/resources/app/main.js --dataPath=C:/FoundryDevFiles  --noupnp\"  \"gulp\"",
"start-test": "node C:/FoundryDev/resources/app/main.js --dataPath=C:/FoundryDevFiles && rollup -c --watch && gulp",

```

- Replace `C:/FoundryDev/resources/app/main.js` with `<your>/<path>/<to>/<foundry>/<main.js>`
- The main is likely in `<Foundry Install Location>/resouces/app/main.js`
- Replace `--dataPath=C:/FoundryDevFiles` with `<your>/<path>/<to>/<foundry>/<data>`

Now you should be able to build the app using `npm start`
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
