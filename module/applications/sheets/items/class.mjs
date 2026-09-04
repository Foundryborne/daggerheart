import DHBaseItemSheet from '../api/base-item.mjs';

export default class ClassSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['class'],
        position: { width: 700 },
        actions: {
            removeItemFromCollection: ClassSheet.#removeItemFromCollection,
            removeSuggestedItem: ClassSheet.#removeSuggestedItem
        },
        tagifyConfigs: [
            {
                selector: '.domain-input',
                options: () => CONFIG.DH.DOMAIN.orderedDomains(),
                callback: ClassSheet.#onDomainSelect,
                tagifyOptions: {
                    maxTags: () => game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxDomains
                }
            }
        ],
        dragDrop: [
            { dragSelector: '.suggested-item', dropSelector: null },
            { dragSelector: null, dropSelector: '.take-section' },
            { dragSelector: null, dropSelector: '.choice-a-section' },
            { dragSelector: null, dropSelector: '.choice-b-section' },
            { dragSelector: null, dropSelector: '.primary-weapon-section' },
            { dragSelector: null, dropSelector: '.secondary-weapon-section' },
            { dragSelector: null, dropSelector: '.armor-section' },
            { dragSelector: null, dropSelector: null }
        ]
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/class/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/items/class/features.hbs',
            scrollable: ['.features']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/class/settings.hbs',
            scrollable: ['.settings']
        },
        questions: {
            template: 'systems/daggerheart/templates/sheets/items/class/questions.hbs',
            scrollable: ['.questions']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [
                { id: 'description' },
                { id: 'features' },
                { id: 'settings' },
                { id: 'questions' },
                { id: 'effects' }
            ],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /**@inheritdoc */
    get relatedDocs() {
        return this.document.system.features.map(x => x.item);
    }

    /**@inheritdoc */
    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);

        const paths = [
            'subclasses',
            'characterGuide.suggestedPrimaryWeapon',
            'characterGuide.suggestedSecondaryWeapon',
            'characterGuide.suggestedArmor',
            'inventory.take',
            'inventory.choiceA',
            'inventory.choiceB'
        ];

        for (let path of paths) {
            const docDatas = [].concat(foundry.utils.getProperty(this.document, `system.${path}`) ?? []);

            const docs = [];
            for (var docData of docDatas) {
                const doc = await foundry.utils.fromUuid(docData.uuid);
                docs.push(doc);
            }

            docs.filter(doc => doc).forEach(doc => (doc.apps[this.id] = this));
        }
    }

    /**@inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.domains = this.document.system.domains;
        context.subclasses = await this.document.system.fetchSubclasses();
        return context;
    }

    /* -------------------------------------------- */

    /**
     * Callback function used by `tagifyElement`.
     * @param {Array<Object>} selectedOptions - The currently selected tag objects.
     */
    static async #onDomainSelect(selectedOptions) {
        await this.document.update({ 'system.domains': selectedOptions.map(x => x.value) });
    }

    /* -------------------------------------------- */

    async _onDropItem(event, item) {
        const target = event.target.closest('fieldset.drop-section');
        if (target && this.document.parent?.type !== 'character') {
            if (item.type === 'weapon') {
                if (target.classList.contains('primary-weapon-section')) {
                    if (!item.system.secondary)
                        return await this.document.update({
                            'system.characterGuide.suggestedPrimaryWeapon': item.uuid
                        });
                } else if (target.classList.contains('secondary-weapon-section')) {
                    if (item.system.secondary)
                        return await this.document.update({
                            'system.characterGuide.suggestedSecondaryWeapon': item.uuid
                        });
                }
            } else if (item.type === 'armor') {
                if (target.classList.contains('armor-section')) {
                    return await this.document.update({
                        'system.characterGuide.suggestedArmor': item.uuid
                    });
                }
            } else if (target.classList.contains('choice-a-section')) {
                if (item.type === 'loot' || item.type === 'consumable') {
                    const filteredChoiceA = this.document.system.inventory.choiceA;
                    if (filteredChoiceA.length < 2)
                        return await this.document.update({
                            'system.inventory.choiceA': [...filteredChoiceA.map(x => x.uuid), item.uuid]
                        });
                }
            } else if (item.type === 'loot') {
                if (target.classList.contains('take-section')) {
                    const filteredTake = this.document.system.inventory.take.filter(x => x);
                    if (filteredTake.length < 3)
                        return await this.document.update({
                            'system.inventory.take': [...filteredTake.map(x => x.uuid), item.uuid]
                        });
                } else if (target.classList.contains('choice-b-section')) {
                    const filteredChoiceB = this.document.system.inventory.choiceB.filter(x => x);
                    if (filteredChoiceB.length < 2)
                        return await this.document.update({
                            'system.inventory.choiceB': [...filteredChoiceB.map(x => x.uuid), item.uuid]
                        });
                }
            }
        }

        return super._onDropItem(event, item);
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Removes an item from an class collection by UUID.
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} element - The capturing HTML element which defines the [data-action="removeItemFromCollection"]
     */
    static async #removeItemFromCollection(_event, element) {
        const { uuid, target } = element.dataset;
        const prop = foundry.utils.getProperty(this.document.system, target);
        await this.document.update({ [`system.${target}`]: prop.filter(i => i && i.uuid !== uuid).map(x => x.uuid) });
    }

    /**
     * Removes an suggested item from the class.
     * @param {PointerEvent} _event - The originating click event
     * @param {HTMLElement} element - The capturing HTML element which defines the [data-action="removeSuggestedItem"]
     */
    static async #removeSuggestedItem(_event, element) {
        const { target } = element.dataset;
        await this.document.update({ [`system.characterGuide.${target}`]: null });
    }
}
