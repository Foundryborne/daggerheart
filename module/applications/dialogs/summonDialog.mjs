const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DHSummonDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(summonData) {
        super(summonData);
        // Initialize summons and index
        this.summons = summonData.summons || [];
        this.index = 0;
    }

    get_title() {
        return game.i18n.localize("DAGGERHEART.DIALOGS.SUMMON.title");
    }

    static DEFAULT_OPTIONS= {
        ...super.DEFAULT_OPTIONS,
        template: 'systems/daggerheart/module/applications/dialogs/summon/summonDialog.hbs',
        width: 400,
        height: 'auto',
        classes: ['daggerheart', 'dialog', 'summon-dialog'],
        dragDrop: [{ dragSelector: '.summon-token', dropSelector: null, handler:'onDrop'}]
    };

    async _prepareContext() {
        const context = await super._prepareContext();
        context.summons=this.summons;
        context.index=this.index;
        return context;
    }

    getData(options={}) {
        const data = super.getData(options);
        data.summons=this.summons;
        data.index=this.index;
        return data;
    }
    async prepareContext() {
        const context = await super.prepareContext();
        return context;
    }

    async onDrop(event) {//add to canvas
        event.preventDefault();
        const tokenData = JSON.parse(event.dataTransfer.getData('text/plain'));
        const position = { x: event.clientX, y: event.clientY };
        await canvas.scene.createEmbeddedDocuments("Token", [tokenData], { temporary: false, x: position.x, y: position.y });
    }
}