# Daggerheart

This is a repo for a Foundry VTT implementation of daggerheart. It is not associated with Critical Role or Darrington Press.

## Setup

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