import DHApplicationMixin from './application-mixin.mjs';
const { DocumentSheetV2 } = foundry.applications.api;

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

/**
 * Base settings sheet for Daggerheart actors.
 * @extends {DHApplicationMixin<DocumentSheetV2>}
 */
export default class DHBaseActorSettings extends DHApplicationMixin(DocumentSheetV2) {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['dialog'],
        window: {
            icon: 'fa-solid fa-wrench',
            resizable: false,
            title: 'DAGGERHEART.GENERAL.Tabs.settings'
        },
        position: { width: 455, height: 'auto' },
        actions: {},
        form: {
            submitOnChange: true
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.tab.features' },
            { dragSelector: '.feature-item', dropSelector: null }
        ]
    };

    /** @inheritDoc */
    _initializeApplicationOptions(options) {
        options = super._initializeApplicationOptions(options);
        options.classes = options.classes.filter(c => c !== 'sheet');
        return options;
    }

    /**@returns {foundry.documents.Actor} */
    get actor() {
        return this.document;
    }

    /**@inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.isNPC = this.actor.isNPC;

        if (context.systemFields.attack) {
            context.systemFields.attack.fields = this.actor.system.attack.schema.fields;
        }

        // Create fake fields for actor configurable max resource value.
        const resourceConfig = CONFIG.DH.RESOURCE[this.actor.type]?.all;
        if (resourceConfig) {
            const relevant = ['hitPoints', 'stress'].filter(r => r in resourceConfig);
            context.resources = relevant.map(key => {
                const data = this.actor._source.system.resources[key];
                const config = resourceConfig[key];
                return {
                    label: config.label,
                    name: `system.resources.${key}.max`,
                    value: data.max ?? config.max,
                    tooltip: key === 'hitPoints' ? game.i18n.localize('DAGGERHEART.UI.Tooltip.maxHPClassBound') : null,
                    field: new foundry.data.fields.NumberField({
                        initial: config.max,
                        integer: true,
                        label: game.i18n.format('DAGGERHEART.GENERAL.maxWithThing', {
                            thing: game.i18n.localize(config.label)
                        })
                    })
                };
            });
        }

        return context;
    }
}
