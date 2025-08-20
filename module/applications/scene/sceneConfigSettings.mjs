export default class DhSceneConfigSettings extends foundry.applications.sheets.SceneConfig {
  constructor(options, ...args) {
    super(options, ...args);
  }

  /** @override */
  static PARTS = {
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    basics: { template: "templates/scene/config/basics.hbs" },
    grid: { template: "templates/scene/config/grid.hbs" },
    lighting: { template: "templates/scene/config/lighting.hbs", scrollable: [""] },
    ambience: { template: "templates/scene/config/ambience.hbs", scrollable: ["div.tab[data-tab=environment]"] },
    dh: { template: "systems/daggerheart/templates/scene/dh-config.hbs" },
    footer: { template: "templates/generic/form-footer.hbs" }
  };

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        { id: "basics", icon: "fa-solid fa-image" },
        { id: "grid", icon: "fa-solid fa-grid" },
        { id: "lighting", icon: "fa-solid fa-lightbulb" },
        { id: "ambience", icon: "fa-solid fa-cloud-sun" },
        { id: "dh", icon: "fa-solid" }
      ],
      initial: "basics",
      labelPrefix: "SCENE.TABS.SHEET"
    },
    ambience: {
      tabs: [
        { id: "basic", icon: "fa-solid fa-table-list" },
        { id: "environment", icon: "fa-solid fa-cloud-sun" }
      ],
      initial: "basic",
      labelPrefix: "SCENE.TABS.AMBIENCE"
    }
  };

}