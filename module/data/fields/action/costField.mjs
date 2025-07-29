const fields = foundry.data.fields;

export default class CostField extends fields.ArrayField {
    constructor(options = {}, context = {}) {
        const element = new fields.SchemaField({
            key: new fields.StringField({
                nullable: false,
                required: true,
                initial: 'hope'
            }),
            keyIsID: new fields.BooleanField(),
            value: new fields.NumberField({ nullable: true, initial: 1 }),
            scalable: new fields.BooleanField({ initial: false }),
            step: new fields.NumberField({ nullable: true, initial: null })
        });
        super(element, options, context);
    }

    static prepareConfig(config) {
        const costs = this.cost?.length ? foundry.utils.deepClone(this.cost) : [];
        config.costs = CostField.calcCosts.call(this, costs);
        const hasCost = CostField.hasCost.call(this, config.costs);
        if (config.isFastForward && !hasCost)
            return ui.notifications.warn("You don't have the resources to use that action.");
        return hasCost;
    }

    static calcCosts(costs) {
        console.log(costs, CostField.getResources.call(this, costs));
        const resources = CostField.getResources.call(this, costs);
        return costs.map(c => {
            c.scale = c.scale ?? 1;
            c.step = c.step ?? 1;
            c.total = c.value + (c.scale - 1) * c.step;
            c.enabled = c.hasOwnProperty('enabled') ? c.enabled : true;
            c.max =
                c.key === 'fear'
                    ? game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear)
                    : resources[c.key].isReversed
                      ? resources[c.key].max
                      : resources[c.key].value;
            if (c.scalable) c.maxStep = Math.floor(c.max / c.step);
            return c;
        });
    }

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

    static getResources(costs) {
        const actorResources = this.actor.system.resources;
        const itemResources = {};
        for (let itemResource of costs) {
            if (itemResource.keyIsID) {
                itemResources[itemResource.key] = {
                    value: this.parent.resource.value ?? 0,
                    max: CostField.formatMax.call(this, this.parent?.resource?.max)
                };
            }
        }

        return {
            ...actorResources,
            ...itemResources
        };
    }

    static getRealCosts(costs) {
        const realCosts = costs?.length ? costs.filter(c => c.enabled) : [];
        return realCosts;
    }

    static formatMax(max) {
        max ??= 0;
        if (isNaN(max)) {
            const roll = Roll.replaceFormulaData(max, this.getRollData());
            max = roll.total;
        }
        return Number(max);
    }
}
