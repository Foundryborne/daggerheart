const fields = foundry.data.fields;

/**
 * A configurable item feature for things like weapons and armor.
 * In this context, "item" is a daggerheart item, which are effectively physical items
 */
export class ConfigurableItemFeature extends fields.SchemaField {
    #featureFn = null;

    constructor({ itemType }) {
        super({
            value: new fields.StringField({ required: true }),
            effectIds: new fields.ArrayField(new fields.StringField({ required: true })),
            actionIds: new fields.ArrayField(new fields.StringField({ required: true })),
            rollModifiers: new fields.ArrayField(new fields.StringField()),
            config: new fields.ObjectField()
        });
        this.#featureFn = itemType === 'weapon'
            ? CONFIG.DH.ITEM.allWeaponFeatures
            : itemType === 'armor'
                ? CONFIG.DH.ITEM.allArmorFeatures
                : null;
        if (!this.#featureFn) throw new Error('Item Type is required');
    }
    
    initialize(value, model, options) {
        value = super.initialize(value, model, options);
        if (value) {
            const configField = this.#featureFn()[value?.value]?.config;
            try {
                value.config = configField?.initialize(value.config ?? configField?.getInitialValue()) ?? {};
            } catch (ex) {
                console.error(ex);
                value.config = configField?.initialize(configField?.getInitialValue()) ?? {};
            }
        }
        return value;
    }

    _cleanType(data, options, state) {
        const hadNoConfig = !data?.config; // check data.config BEFORE it becomes empty object
        data = super._cleanType(data, options, state);
        
        // Clean data for correctness, but do not destroy data if configField is missing
        // If that happens, it is likely a module being turned off or a homebrew feature removed, and we don't want to lose data
        const configField = this.#featureFn()[data?.value ?? state.source?.value]?.config;
        if (data && configField) {
            const innerState = { ...state, source: data.config };
            if (hadNoConfig && foundry.utils.isEmpty(data.config)) {
                data.config = configField.getInitialValue();
            }
            data.config = configField.clean(data.config, options, innerState);
        }
        return data;
    }
}