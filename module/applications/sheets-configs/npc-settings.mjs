import DHBaseActorSettings from '../sheets/api/actor-setting.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DHNPCSettings extends DHBaseActorSettings {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['npc-settings'],
        position: { width: 455, height: 'auto' },
        actions: {},
        dragDrop: [
            { dragSelector: null, dropSelector: '.tab.features' },
            { dragSelector: '.feature-item', dropSelector: null }
        ]
    };

    /**@override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/npc-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/npc-settings/details.hbs'
        },
        features: {
            id: 'features',
            template: 'systems/daggerheart/templates/sheets-settings/npc-settings/features.hbs',
            scrollable: ['']
        }
    };

    /** @override */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'features' }],
            initial: 'details',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Get feature groups. Uncategorized go to actions
        const featureFormsTypes = ['passive', 'action', 'reaction'];
        const features = this.document.system.features.sort((a, b) => a.sort - b.sort);
        const featureGroups = featureFormsTypes.map(t => ({
            featureForm: t,
            label: _loc(CONFIG.DH.ITEM.featureForm[t]),
            features: features.filter(f => f.system.featureForm === t)
        }));
        featureGroups[1].features.push(...features.filter(f => !featureFormsTypes.includes(f.system.featureForm)));
        context.featureGroups = featureGroups;

        return context;
    }
}
