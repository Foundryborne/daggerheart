const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DHSummonDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(summonData) {
        super(summonData);
        // Initialize summons and index
        this.summons = summonData.summons || [];
    }

    static PARTS = {
        main: { template: 'systems/daggerheart/templates/dialogs/summon/summonDialog.hbs' }
    };


    static DEFAULT_OPTIONS= {
        tag: 'form',
        window: {
            title: "DAGGERHEART.APPLICATIONS.Summon.title",
            resizable: false
        },
        position: { 
            width: 400,
            height: 'auto'
        },
        classes: ['daggerheart', 'dialog', 'summon-dialog'],
        dragDrop: [{dragSelector: '.summon-token'}],
    };

    async _prepareContext() {
        const context = await super._prepareContext();
        context.summons=await Promise.all(this.summons.map(async(entry)=>{
            const actor = await fromUuid(entry.actorUUID);
            return {
                ...entry,
                name: actor?.name || game.i18n.localize("DAGGERHEART.GENERAL.Unknown"),
                img: actor?.img || 'icons/svg/mystery-man.svg',
            };
        }));
        return context;
    }

    _onDragStart(event) {
        const uuid = event.currentTarget.dataset.uuid;
        if(!uuid) return;
        const dragData = { type: 'Actor', uuid: uuid };
        event.dataTransfer.effectAllowed = 'all';
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

}