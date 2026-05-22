const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
export default class DhCampaignFrames extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.CampaignFrames.title');
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dh-style', 'campaign-frame'],
        position: { width: 640, height: 'auto' },
        window: { icon: 'fa-solid fa-globe' },
        actions: {}
    };

    static PARTS = {
        application: {
            id: 'campaign-frames',
            template: 'systems/daggerheart/templates/campaignFrames/campaign-frames.hbs'
        }
    };

    getCampaignFrameTabs(frames) {
        for (const v of Object.values(frames)) {
            v.active = this.tabGroups[v.group]
                ? this.tabGroups[v.group] === v.id
                : this.tabGroups.primary !== 'equipment'
                  ? v.active
                  : false;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.campaignFrames = game.system.campaignFrames.frames;
        // context.campaignFrameTabs = this.getCampaignFrameTabs(context.campaignFrames);

        return context;
    }
}
