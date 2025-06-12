export default class DhActiveEffectConfig extends ActiveEffectConfig {
    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'sheet', 'dh-style']
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/activeEffect/header.hbs' },
        tabs: { template: 'templates/generic/tab-navigation.hbs' },
        details: { template: 'systems/daggerheart/templates/sheets/activeEffect/details.hbs', scrollable: [''] },
        duration: { template: 'systems/daggerheart/templates/sheets/activeEffect/duration.hbs' },
        changes: {
            template: 'systems/daggerheart/templates/sheets/activeEffect/changes.hbs',
            scrollable: ['ol[data-changes]']
        },
        footer: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-form-footer.hbs' }
    };

    static TABS = {
        sheet: {
            tabs: [
                { id: 'details', icon: 'fa-solid fa-book' },
                { id: 'duration', icon: 'fa-solid fa-clock' },
                { id: 'changes', icon: 'fa-solid fa-gears' }
            ],
            initial: 'details',
            labelPrefix: 'EFFECT.TABS'
        }
    };

    async _preparePartContext(partId, context) {
        const partContext = await super._preparePartContext(partId, context);
        switch (partId) {
            case 'changes':
                const fieldPaths = [];
                const validFieldPath = fieldPath => this.validFieldPath(fieldPath, this.#unapplicablePaths);
                context.document.parent.system.schema.apply(function () {
                    if (!(this instanceof foundry.data.fields.SchemaField)) {
                        if (validFieldPath(this.fieldPath)) {
                            fieldPaths.push(this.fieldPath);
                        }
                    }
                });

                context.fieldPaths = fieldPaths;

                break;
        }

        return partContext;
    }

    #unapplicablePaths = ['story', 'pronouns', 'description'];
    validFieldPath(fieldPath, unapplicablePaths) {
        const splitPath = fieldPath.split('.');
        if (splitPath.length > 1 && unapplicablePaths.includes(splitPath[1])) return false;

        /* The current value of a resource should not be modified */
        if (new RegExp(/resources.*\.value/).exec(fieldPath)) return false;

        return true;
    }
}
