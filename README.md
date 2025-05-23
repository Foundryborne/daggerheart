# Daggerheart

#### For Foundry VTT

This is a repo for a Foundry VTT implementation of daggerheart. It is not associated with critical role
or darrington press.

# Table Of Contents

- [Overview](#overview)
- [Developer Guide](#developer-guide)

# Overview

# Developer Guide

#### Coding Practises

##### Branches And Pull Requests

During pre-release development, we are making use of `main` as the development branch. Once release is getting closer we will instead be making a `dev` branch to base development from to make `main` more stable.

When you work on an issue or feature, start from `main` and make a new branch. Branches should be topically named and with the associated Issue number if it relates to an Issue. EX: `#6/Level-Up-Bugginess`.

---

Once you're finished with an issue or feature, open a Pull Request on Github for that branch.

The Reviewers Team will be approving submissions. This is mainly since we have a wide spread of experience with system building and the system itself, and we do want the system to become something great. As time goes on, more collaborators are likely to be added as reviewers.

#### Setup

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
