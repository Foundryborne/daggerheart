import DHBaseItemSheet from '../api/base-item.mjs';

const { TextEditor } = foundry.applications.ux;

export default class ClassSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['class'],
        position: { width: 700 },
        actions: {
            removeLinkedItem: ClassSheet.#removeLinkedItem
        },
        tagifyConfigs: [
            {
                selector: '.domain-input',
                options: () => CONFIG.DH.DOMAIN.domains,
                callback: ClassSheet.#onDomainSelect
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
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'features' }, { id: 'settings' }, { id: 'effects' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.domains = this.document.system.domains;
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
    /*  Application Drag/Drop                       */
    /* -------------------------------------------- */
    async linkedItemUpdate(item, property, replace) {
        const removedLinkedItems = [];
        const existing = Object.values(item.system.itemLinks).some(x => x.some(uuid => uuid === this.document.uuid));
        if (replace) {
            const toRemove = this.document.system.linkedItems.find(
                x => x.uuid !== item.uuid && x.system.itemLinks[property]?.has(this.document.uuid)
            );
            if (toRemove) {
                removedLinkedItems.push(toRemove.uuid);
                await toRemove.update({
                    [`system.itemLinks.${property}`]: toRemove.system.itemLinks[property].filter(
                        x => x !== this.document.uuid
                    )
                });
            }
        }

        await item.addItemLink(this.document.uuid, property, true);

        if (!existing) {
            await this.document.update({
                'system.linkedItems': [
                    ...this.document.system.linkedItems
                        .filter(x => !removedLinkedItems.includes(x.uuid))
                        .map(x => x.uuid),
                    item.uuid
                ]
            });
        } else {
            this.render();
        }
    }

    async _onDrop(event) {
        event.stopPropagation();
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        const target = event.target.closest('fieldset.drop-section');
        if (item.type === 'subclass') {
            const existing = await item.addItemLink(this.document.uuid, CONFIG.DH.ITEM.itemLinkTypes.subclass, true);

            if (existing) {
                this.render();
            } else {
                await this.document.update({
                    'system.subclasses': [...this.document.system.subclasses.map(x => x.uuid), item.uuid]
                });
            }
        } else if (item.type === 'feature') {
            super._onDrop(event);
        } else if (item.type === 'weapon') {
            if (target.classList.contains('primary-weapon-section')) {
                if (!item.system.secondary) {
                    await this.linkedItemUpdate(item, CONFIG.DH.ITEM.itemLinkTypes.primaryWeapon, true);
                }
            } else if (target.classList.contains('secondary-weapon-section')) {
                if (item.system.secondary) {
                    await this.linkedItemUpdate(item, CONFIG.DH.ITEM.itemLinkTypes.secondaryWeapon, true);
                }
            }
        } else if (item.type === 'armor') {
            if (target.classList.contains('armor-section')) {
                await this.linkedItemUpdate(item, CONFIG.DH.ITEM.itemLinkTypes.armor, true);
            }
        } else if (target.classList.contains('choice-a-section')) {
            if (item.type === 'miscellaneous' || item.type === 'consumable') {
                if (this.document.system.choiceA.length < 2)
                    await this.linkedItemUpdate(item, CONFIG.DH.ITEM.itemLinkTypes.choiceA);
            }
        } else if (item.type === 'miscellaneous') {
            if (target.classList.contains('take-section')) {
                if (this.document.system.take.length < 3)
                    await this.linkedItemUpdate(item, CONFIG.DH.ITEM.itemLinkTypes.take);
            } else if (target.classList.contains('choice-b-section')) {
                if (this.document.system.choiceB.length < 2)
                    await this.linkedItemUpdate(item, CONFIG.DH.ITEM.itemLinkTypes.choiceB);
            }
        }
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Removes an item from class LinkedItems by uuid.
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} element - The capturing HTML element which defines the [data-action="removeLinkedItem"]
     */
    static async #removeLinkedItem(_event, element) {
        const { uuid, target } = element.dataset;
        const prop = target === 'subclass' ? 'subclasses' : 'linkedItems';
        const item = this.document.system[prop].find(x => x.uuid === uuid);
        if (!item) return;

        await this.document.update({
            [`system.${prop}`]: this.document.system[prop].filter(x => x.uuid !== uuid).map(x => x.uuid)
        });
        await item.update({
            [`system.itemLinks.${target}`]: item.system.itemLinks[target].filter(x => x !== this.document.uuid)
        });
    }
}
