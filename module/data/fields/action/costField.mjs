const fields = foundry.data.fields;

export default class CostField extends fields.ArrayField {
    /**
     * Action Workflow order
     */
    static order = 150;

    /** @inheritDoc */
    constructor(options = {}, context = {}) {
        const element = new fields.SchemaField({
            key: new fields.StringField({
                nullable: false,
                required: true,
                initial: 'hope'
            }),
            itemId: new fields.StringField({ nullable: true, initial: null }),
            value: new fields.NumberField({ nullable: true, initial: 1, min: 0 }),
            scalable: new fields.BooleanField({ initial: false }),
            step: new fields.NumberField({ nullable: true, initial: null }),
            consumeOnSuccess: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.ACTIONS.Settings.consumeOnSuccess.label'
            })
        });
        super(element, options, context);
    }

    /**
     * Update Action Workflow config object.
     * Must be called within Action context or similar.
     * @param {MoveContext} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @returns {boolean} returns true
     */
    prepareConfig(config) {
        config.costs = CostField.calcCosts.call(this, this.cost?.length ? foundry.utils.deepClone(this.cost) : []);
        return true;
    }

    /**
     *
     * Must be called within Action context.
     * @param {*} costs
     * @returns
     */
    static calcCosts(costs) {
        const resources = CostField.getResources.call(this, costs);
        let filteredCosts = costs;
        if (this.parent?.isInventoryItem && this.parent.consumeOnUse === false) {
            filteredCosts = filteredCosts.filter(c => c.key !== 'quantity');
        }

        return filteredCosts.map(c => {
            c.scale = c.scale ?? 0;
            c.step = c.step ?? 1;
            c.total = c.value + c.scale * c.step;
            c.enabled = c.hasOwnProperty('enabled') ? c.enabled : true;
            c.max =
                c.key === 'fear'
                    ? game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear)
                    : resources[c.key].isReversed
                        ? resources[c.key].max - resources[c.key].value
                        : resources[c.key].value;
            if (c.scalable) c.maxStep = Math.floor((c.max - c.value) / c.step);
            return c;
        });
    }

    /**
     * Get all Actor resources + parent Item potential one.
     * Must be called within Action context.
     * @param {*} costs
     * @returns
     */
    static getResources(costs) {
        const actorResources = foundry.utils.deepClone(this.actor.system.resources);
        if (this.actor.system.partner)
            actorResources.hope = foundry.utils.deepClone(this.actor.system.partner.system.resources.hope);
        const itemResources = {};
        for (let itemResource of costs) {
            if (itemResource.itemId) {
                itemResources[itemResource.key] = CostField.getItemIdCostResource.bind(this)(itemResource);
            }
        }

        return {
            ...actorResources,
            ...itemResources
        };
    }

    static getItemIdCostResource(itemResource) {
        switch (itemResource.key) {
            case CONFIG.DH.GENERAL.itemAbilityCosts.resource.id:
                return {
                    value: this.parent.resource.value ?? 0,
                    max: CostField.formatMax.call(this, this.parent?.resource?.max)
                };
            case CONFIG.DH.GENERAL.itemAbilityCosts.quantity.id:
                return {
                    value: this.parent.quantity ?? 0,
                    max: this.parent.quantity ?? 0
                };
            default:
                return { value: 0, max: 0 };
        }
    }

    static getItemIdCostUpdate(r) {
        switch (r.key) {
            case CONFIG.DH.GENERAL.itemAbilityCosts.resource.id: {
                const resource = r.target.system.resource;
                let max = Number(resource.max);
                if (!Number.isFinite(max) && resource.max) {
                    try {
                        max = Roll.safeEval(Roll.replaceFormulaData(resource.max, r.target.getRollData()));
                    } catch {
                        max = null;
                    }
                }
                const hasMax = Number.isFinite(max) && max > 0;
                if (r.clear) {
                    return {
                        path: 'system.resource.value',
                        value: hasMax ? max : resource.value
                    };
                }
                const newValue = resource.value + r.value;
                return {
                    path: 'system.resource.value',
                    value: Math.max(hasMax ? Math.min(newValue, max) : newValue, 0)
                };
            }
            case CONFIG.DH.GENERAL.itemAbilityCosts.quantity.id:
                return {
                    path: 'system.quantity',
                    value: r.target.system.quantity + r.value
                };
            default:
                return { path: '', value: undefined };
        }
    }

    /**
     *
     * @param {*} costs
     * @returns
     */
    static getRealCosts(costs) {
        const cloneCosts = foundry.utils.deepClone(costs),
            realCosts = cloneCosts?.length ? cloneCosts.filter(c => c.enabled) : [];
        let mergedCosts = [];
        realCosts.forEach(c => {
            const getCost = Object.values(mergedCosts).find(gc => gc.key === c.key);
            if (getCost) getCost.total += c.total;
            else mergedCosts.push(c);
        });
        return mergedCosts;
    }

    /**
     * Format scalable max cost, inject Action datas if it's a formula.
     * Must be called within Action context.
     * @param {number|string} max   Configured maximum for that resource.
     * @returns {number}            The max cost value.
     */
    static formatMax(max) {
        max ??= 0;
        if (isNaN(max)) {
            const roll = Roll.replaceFormulaData(max, this.getRollData());
            max = roll.total;
        }
        return Number(max);
    }
}
