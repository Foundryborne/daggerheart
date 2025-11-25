export default class DhActorDirectory extends foundry.applications.sidebar.tabs.ActorDirectory {
    static DEFAULT_OPTIONS = {
        renderUpdateKeys: [
            "system.levelData.level.current",
            "system.partner",
            "system.tier"
        ]
    }

    static _entryPartial = "systems/daggerheart/templates/ui/sidebar/actor-document-partial.hbs";
}