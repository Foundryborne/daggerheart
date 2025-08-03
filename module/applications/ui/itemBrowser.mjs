
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * A UI element which displays the Users defined for this world.
 * Currently active users are always displayed, while inactive users can be displayed on toggle.
 *
 * @extends ApplicationV2
 * @mixes HandlebarsApplication
 */

export default class ItemBrowser extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'itemBrowser',
        classes: [],
        tag: 'div',
        // window: {
        //     frame: true,
        //     title: 'Item Browser',
        //     positioned: true,
        //     resizable: true
        // },
        actions: {
            // setFear: FearTracker.setFear,
            // increaseFear: FearTracker.increaseFear
        },
        /* position: {
            width: 222,
            height: 222
            // top: "200px",
            // left: "120px"
        } */
    };

    /** @override */
    static PARTS = {
        resources: {
            root: true,
            template: 'systems/daggerheart/templates/ui/itemBrowser.hbs'
        }
    };

    /* -------------------------------------------- */
    /*  Rendering                                   */
    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const data = await super._prepareContext(options);
        return data;
    }
}