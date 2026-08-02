const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
export default class DHEphemeralSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(item, ephemeralId) {
        super({});

        this.item = item;

        this.ephemeral = this.item.system.ephemeralEffects.find(x => x.id === ephemeralId);
        this.ephemeralIndex = this.item.system.ephemeralEffects.indexOf(this.ephemeral);
    }

    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'dh-style', 'ephemeral-config'],
        window: {
            icon: 'fa-solid fa-sliders',
            title: 'DAGGERHEART.EPHEMERAL.configTitle'
        },
        position: { width: 455, height: 'auto' },
        actions: {
            editImage: DHEphemeralSettings.#onEditImage,
            addCost: DHEphemeralSettings.#onAddCost,
            removeCost: DHEphemeralSettings.#onRemoveCost,
            addEffect: DHEphemeralSettings.#onAddEffect,
            removeEffect: DHEphemeralSettings.#onRemoveEffect,
            editEffect: DHEphemeralSettings.#onEditEffect
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true
        }
    };

    /**@override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/ephemeral-settings/header.hbs'
        },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/ephemeral-settings/details.hbs'
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext();
        context.item = this.item;
        context.fields = this.item.system.schema.fields.ephemeralEffects.element.fields;
        context.ephemeral = this.ephemeral;
        context.updatePath = `system.ephemeralEffects.${this.ephemeralIndex}.`;
        
        context.availableEffects = this.item.effects.filter(x => 
            !this.ephemeral.effectData.effects.some(data => data.id === x.id));
        context.effects = this.ephemeral.effectData.effects.map(x => this.item.effects.get(x.id));

        return context;
    }

    async _preparePartContext(partId, context) {
        const partContext = await super._preparePartContext(partId, context);
        switch (partId) {
            case 'details':

                break;
        }

        return partContext;
    }

    async updateItem(update) {
        const updateData = foundry.utils.mergeObject({ 
            system: {
                ephemeralEffects: this.item.toObject().system.ephemeralEffects.reduce((acc, curr, index) => {
                    acc[index] = {
                        ...curr,
                        costs: curr.costs.reduce((acc, cost, index) => {
                            acc[index] = cost;
                            return acc;
                        }, {})
                    };
                    return acc;
                }, {})
            }  
        }, update);
        await this.item.update(updateData);
        this.ephemeral = this.item.system.ephemeralEffects[this.ephemeralIndex];

        this.render();
    } 

    static async updateForm(_event, _, formData) {
        const update = foundry.utils.expandObject(formData.object);
        this.updateItem(update);
    }

    static #onEditImage() {
        const current = this.ephemeral.img;
        const fp = new foundry.applications.apps.FilePicker.implementation({
            current,
            type: 'image',
            redirectToRoot: current ? [current] : [],
            callback: async path => {
                this.updateItem({  
                    system: {
                        ephemeralEffects: {
                            [this.ephemeralIndex]: { img: path }
                        }
                    }                    
                });
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    static #onAddCost() {
        const pickedTypes = this.ephemeral.costs.map(x => x.type);
        const remainingTypes = Object.keys(CONFIG.DH.GENERAL.healingTypes).filter(x => !pickedTypes.includes(x));
        
        const choices = remainingTypes.map(k => ({ value: k, label: _loc(CONFIG.DH.GENERAL.healingTypes[k].label) }));
        const content = new foundry.data.fields.StringField({
            label: _loc('DAGGERHEART.GENERAL.Cost.single'),
            choices,
            required: true
        }).toFormGroup({}, {
            name: 'type',
            localize: true,
            nameAttr: 'value',
            labelAttr: 'label'
        }).outerHTML;

        const callback = (_, button) => {
            const type = choices[button.form.elements.type.value].value;

            const updatePath = `system.ephemeralEffects.${this.ephemeralIndex}.costs`;
            this.updateItem({ [updatePath]:  
                [
                    ...this.ephemeral.costs,
                    {
                        ...this.item.system.schema.fields.ephemeralEffects.element.fields.costs.element
                            .getInitialValue(),
                        type: type
                    }
                ]
            })
        };

        const typeDialog = new foundry.applications.api.DialogV2({
            buttons: [
                {
                    action: 'ok',
                    label: 'Confirm',
                    icon: 'fas fa-check',
                    default: true,
                    callback
                }
            ],
            content: content,
            rejectClose: false,
            modal: false,
            window: {
                title: _loc('DAGGERHEART.EPHEMERAL.addNewCostTitle')
            },
            position: { width: 300 }
        });

        typeDialog.render(true);
    }

    static #onRemoveCost(_, button) {
        const updatePath = `system.ephemeralEffects.${this.ephemeralIndex}.costs`;
        this.updateItem({ [updatePath]:
            this.ephemeral.costs.filter((_, index) => index !== Number(button.dataset.index))
        });
    }

    static async #onAddEffect() {
        const created = await this.item.createEmbeddedDocuments('ActiveEffect', [
            game.system.api.data.activeEffects.BaseEffect.getDefaultObject({ transfer: false })
        ]);

        const updatePath = `system.ephemeralEffects.${this.ephemeralIndex}.effectData.effects`;
        this.updateItem({ [updatePath]: [
            ...this.ephemeral.effectData.effects, 
            { id: created[0].id, uuid: created[0].uuid }
        ]});
    }

    static #onRemoveEffect(_, button) {
        const effectId = button.closest('[data-effect-id]').dataset.effectId;
        const updatePath = `system.ephemeralEffects.${this.ephemeralIndex}.effectData.effects`;

        this.updateItem({ [updatePath]: this.ephemeral.effectData.effects.filter(x => x.id !== effectId) });
        this.item.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
    }

    static #onEditEffect(_, button) {
        const effectId = button.closest('[data-effect-id]').dataset.effectId;
        this.item.effects.get(effectId).sheet.render(true);
    }
}