const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhpDowntime extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, shortrest) {
        super({});

        this.actor = actor;
        this.selectedActivity = null;
        this.shortrest = shortrest;

        this.customActivity = SYSTEM.GENERAL.downtime.custom;
    }

    get title() {
        return `${this.actor.name} - ${this.shortrest ? 'Short Rest' : 'Long Rest'}`;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'downtime'],
        position: { width: 800, height: 'auto' },
        actions: {
            selectActivity: this.selectActivity,
            takeDowntime: this.takeDowntime
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        application: {
            id: 'downtime',
            template: 'systems/daggerheart/templates/views/downtime.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.selectedActivity = this.selectedActivity;
        context.options = this.shortrest ? SYSTEM.GENERAL.downtime.shortRest : SYSTEM.GENERAL.downtime.longRest;
        context.customActivity = this.customActivity;

        context.disabledDowntime =
            !this.selectedActivity ||
            (this.selectedActivity.id === this.customActivity.id &&
                (!this.customActivity.name || !this.customActivity.description));

        return context;
    }

    static selectActivity(_, button) {
        const activity = button.dataset.activity;
        this.selectedActivity =
            activity === this.customActivity.id
                ? this.customActivity
                : this.shortrest
                  ? SYSTEM.GENERAL.downtime.shortRest[activity]
                  : SYSTEM.GENERAL.downtime.longRest[activity];

        this.render();
    }

    static async takeDowntime() {
        const refreshedFeatures = this.shortrest
            ? this.actor.system.refreshableFeatures.shortRest
            : [...this.actor.system.refreshableFeatures.shortRest, ...this.actor.system.refreshableFeatures.longRest];
        for (var feature of refreshedFeatures) {
            await feature.system.refresh();
        }

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/downtime.hbs',
                {
                    player: this.actor.name,
                    title: game.i18n.localize(this.selectedActivity.name),
                    img: this.selectedActivity.img,
                    description: game.i18n.localize(this.selectedActivity.description),
                    refreshedFeatures: refreshedFeatures
                }
            )
        });

        cls.create(msg.toObject());

        this.close();
    }

    static async updateData(event, element, formData) {
        this.customActivity = foundry.utils.mergeObject(this.customActivity, formData.object);
        this.render();
    }
}
