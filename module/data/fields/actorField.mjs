const fields = foundry.data.fields;

const attributeField = label =>
    new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, label }),
        tierMarked: new fields.BooleanField({ initial: false })
    });

const stressDamageReductionRule = localizationPath =>
    new fields.SchemaField({
        cost: new fields.NumberField({
            integer: true,
            label: `${localizationPath}.label`,
            hint: `${localizationPath}.hint`
        })
    });

const bonusField = label =>
    new fields.SchemaField({
        bonus: new fields.NumberField({ integer: true, initial: 0, label: `${game.i18n.localize(label)} Value` }),
        dice: new fields.ArrayField(new fields.StringField(), { label: `${game.i18n.localize(label)} Dice` })
    });

/** 
 * Field used for actor resources. It is a resource that validates dynamically based on the config.
 * Because "max" may be defined during runtime, we don't attempt to clamp the maximum value.
 */
class ResourcesField extends fields.TypedObjectField {
    constructor(actorType) {
        super(
            new fields.SchemaField({
                value: new fields.NumberField({ min: 0, initial: 0, integer: true }),
                // Some resources allow changing max. A null max means its the default
                max: new fields.NumberField({ initial: null, integer: true, nullable: true })
            })
        );
        this.actorType = actorType;
    }

    getInitialValue() {
        const resources = CONFIG.DH.RESOURCE[this.actorType].all;
        return Object.values(resources).reduce((result, resource) => {
            result[resource.id] = {
                value: resource.initial,
                max: null
            };
            return result;
        }, {});
    }

    _validateKey(key) {
        return key in CONFIG.DH.RESOURCE[this.actorType].all;
    }

    _cleanType(value, options) {
        value = super._cleanType(value, options);

        // If not partial, ensure all data exists
        if (!options.partial) {
            value = foundry.utils.mergeObject(this.getInitialValue(), value);
        }

        return value;
    }

    /** Initializes the original source data, returning prepared data */
    initialize(...args) {
        const data = super.initialize(...args);
        const resources = CONFIG.DH.RESOURCE[this.actorType].all;
        for (const [key, value] of Object.entries(data)) {
            // TypedObjectField only calls _validateKey when persisting, so we also call it here
            if (!this._validateKey(key)) {
                delete value[key];
                continue;
            }

            // Add basic prepared data.
            const resource = resources[key];
            value.label = resource.label;
            value.isReversed = resources[key].reverse;
            value.max = typeof resource.max === 'number' ? value.max ?? resource.max : null;
        }
        return data;
    }
}

export { attributeField, ResourcesField, stressDamageReductionRule, bonusField };
