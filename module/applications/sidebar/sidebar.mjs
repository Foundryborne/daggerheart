export default class DhSidebar extends foundry.applications.sidebar.Sidebar {
    /** @override */
    static TABS = {
        chat: {
            documentName: 'ChatMessage'
        },
        combat: {
            documentName: 'Combat'
        },
        scenes: {
            documentName: 'Scene',
            gmOnly: true
        },
        actors: {
            documentName: 'Actor'
        },
        items: {
            documentName: 'Item'
        },
        journal: {
            documentName: 'JournalEntry',
            tooltip: 'SIDEBAR.TabJournal'
        },
        tables: {
            documentName: 'RollTable'
        },
        cards: {
            documentName: 'Cards'
        },
        macros: {
            documentName: 'Macro'
        },
        playlists: {
            documentName: 'Playlist'
        },
        compendium: {
            tooltip: 'SIDEBAR.TabCompendium',
            icon: 'fa-solid fa-book-atlas'
        },
        daggerheartMenu: {
            tooltip: 'DAGGERHEART.UI.Sidebar.daggerheartMenu.title',
            img: 'systems/daggerheart/assets/logos/FoundryBorneLogoWhite.svg'
        },
        settings: {
            tooltip: 'SIDEBAR.TabSettings',
            icon: 'fa-solid fa-gears'
        }
    };

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
