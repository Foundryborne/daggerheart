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
     * Cost Consumption Action Workflow part.
     * Consume configured action resources.
     * Must be called within Action context or similar.
     * @param {object} config                   Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @param {boolean} [successCost=false]     Consume only resources configured as "On Success only" if not already consumed.
     */
    static async execute(config, successCost = false) {
        const actor = this.actor.system.partner ?? this.actor,
            usefulResources = {
                ...foundry.utils.deepClone(actor.system.resources),
                fear: {
                    value: game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear),
                    max: game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxFear,
                    reversed: false
                }
            };

        if (this.parent?.parent) {
            for (var cost of config.costs) {
                if (cost.itemId) {
                    usefulResources[cost.key] = {
                        value: cost.value,
                        target: this.parent.parent,
                        itemId: cost.itemId
                    };
                }
            }
        }

        const resources = CostField.getRealCosts(config.costs)
            .filter(
                c =>
                    (!successCost && (!c.consumeOnSuccess || config.roll?.success)) ||
                    (successCost && c.consumeOnSuccess)
            )
            .reduce((a, c) => {
                const resource = usefulResources[c.key];
                if (resource) {
                    a.push({
                        key: c.key,
                        value: (c.total ?? c.value) * (resource.isReversed ? 1 : -1),
                        target: resource.target,
                        itemId: resource.itemId
                    });
                    return a;
                }
            }, []);

        await actor.modifyResource(resources);
    }

    /**
     * Update Action Workflow config object.
     * Must be called within Action context or similar.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     * @returns {boolean}       Return false if fast-forwarded and no more uses.
     */
    prepareConfig(config) {
        const costs = this.cost?.length ? foundry.utils.deepClone(this.cost) : [];
        config.costs = CostField.calcCosts.call(this, costs);
        const hasCost = CostField.hasCost.call(this, config.costs);
        if (config.dialog.configure === false && !hasCost) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.insufficientResources'));
            return hasCost;
        }
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
        if (this.parent?.metadata.isQuantifiable && this.parent.consumeOnUse === false) {
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
     * Check if the current Actor currently has all needed resources.
     * Must be called within Action context.
     * @param {*} costs
     * @returns {boolean}
     */
    static hasCost(costs) {
        const realCosts = CostField.getRealCosts.call(this, costs),
            hasFearCost = realCosts.findIndex(c => c.key === 'fear');

        if (hasFearCost > -1) {
            const fearCost = realCosts.splice(hasFearCost, 1)[0];
            if (
                !game.user.isGM ||
                fearCost.total > game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear)
            )
                return false;
        }

        /* isReversed is a sign that the resource is inverted, IE it counts upwards instead of down */
        const resources = CostField.getResources.call(this, realCosts);
        return realCosts.reduce(
            (a, c) =>
                !resources[c.key]
                    ? a
                    : a && resources[c.key].isReversed
                      ? resources[c.key].value + (c.total ?? c.value) <= resources[c.key].max
                      : resources[c.key]?.value >= (c.total ?? c.value),
            true
        );
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
            case CONFIG.DH.GENERAL.itemAbilityCosts.resource.id:
                return {
                    path: 'system.resource.value',
                    value: r.target.system.resource.value + r.value
                };
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
