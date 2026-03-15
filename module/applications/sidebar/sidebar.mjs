export default class DhSidebar extends foundry.applications.sidebar.Sidebar {
    static buildTabs() {
        const { settings, ...tabs } = super.TABS;
        return {
            ...tabs,
            daggerheartMenu: {
                tooltip: 'DAGGERHEART.UI.Sidebar.daggerheartMenu.title',
                img: 'systems/daggerheart/assets/logos/FoundryBorneLogoWhite.svg',
                gmOnly: true
            },
            settings
        };
    }

    /** @override */
    static TABS = DhSidebar.buildTabs();

    /** @override */
    static PARTS = {
        tabs: {
            id: 'tabs',
            template: 'systems/daggerheart/templates/sidebar/tabs.hbs'
        }
    };

    /** @override */
    async _prepareTabContext(context, options) {
        context.tabs = Object.entries(this.constructor.TABS).reduce((obj, [k, v]) => {
            let { documentName, gmOnly, tooltip, icon, img } = v;
            if (gmOnly && !game.user.isGM) return obj;
            if (documentName) {
                tooltip ??= getDocumentClass(documentName).metadata.labelPlural;
                icon ??= CONFIG[documentName]?.sidebarIcon;
            }
            obj[k] = { tooltip, icon, img };
            obj[k].active = this.tabGroups.primary === k;
            return obj;
        }, {});
    }
}
