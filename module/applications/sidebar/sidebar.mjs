export default class DhSidebar extends Sidebar {
    static TABS = {
        ...super.TABS,
        daggerheartMenu: {
            tooltip: 'DAGGERHEART.UI.Sidebar.daggerheartMenu.title',
            icon: 'fa-solid fa-bars'
        }
    };
}
