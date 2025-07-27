
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ReactionRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve, reject, actor, trait) {
        super({});

        this.resolve = resolve;
        this.reject = reject;
        this.actor = actor;
        this.trait = trait;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views'],
        position: {
            width: 240,
            height: 'auto'
        },
        actions: {
            // setMarks: this.setMarks,
            // useStressReduction: this.useStressReduction,
            // takeDamage: this.takeDamage
        },
        form: {
            handler: this.updateData,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    /** @override */
    static PARTS = {
        reactionRoll: {
            id: 'reactionRoll',
            template: 'systems/daggerheart/templates/dialogs/reactionRoll.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.ReactionRoll.title', { trait: game.i18n.localize(`DAGGERHEART.CONFIG.Traits.${this.trait}.name`) });
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        

        return context;
    }

    static updateData(event, _, formData) {
        const form = foundry.utils.expandObject(formData.object);
        this.render(true);
    }

    static async reactionRollQuery({ action, token, event, message }) {
        return new Promise(async (resolve, reject) => {
            // const actor = await fromUuid(actorId);
            // if (!actor || !actor?.isOwner) reject();
            action.rollSave(token, event, message).then(result => resolve(result));
            // new ReactionRollDialog(resolve, reject, actor, trait).render({ force: true });
        });
    }

}