import { resetAndRerenderActors } from '../../helpers/utils.mjs';

export default class DhAppearance extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.SETTINGS.Appearance'];

    static defineSchema() {
        const { StringField, BooleanField, SchemaField } = foundry.data.fields;

        return {
            useResourcePips: new BooleanField({ initial: false }),
            displayFear: new StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.fearDisplay,
                initial: CONFIG.DH.GENERAL.fearDisplay.token.value
            }),
            fearPosition: new StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.fearPosition,
                initial: CONFIG.DH.GENERAL.fearPosition.topCenter.value
            }),
            displayCountdownUI: new BooleanField({ initial: true }),
            extendCharacterDescriptions: new BooleanField(),
            extendAdversaryDescriptions: new BooleanField(),
            extendEnvironmentDescriptions: new BooleanField(),
            extendItemDescriptions: new BooleanField(),
            expandRollMessage: new SchemaField({
                desc: new BooleanField({ initial: true }),
                roll: new BooleanField(),
                damage: new BooleanField()
            }),
            showTokenDistance: new StringField({
                required: true,
                choices: {
                    always: {
                        value: 'always',
                        label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.showTokenDistance.choices.always'
                    },
                    encounters: {
                        value: 'encounters',
                        label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.showTokenDistance.choices.encounters'
                    },
                    never: {
                        value: 'never',
                        label: 'DAGGERHEART.SETTINGS.Appearance.FIELDS.showTokenDistance.choices.never'
                    }
                },
                nullable: false,
                initial: 'always'
            }),
            showGenericStatusEffects: new BooleanField({ initial: true }),
            tooltipCardTheme: new StringField({
                required: true,
                nullable: false, 
                initial: 'light',
                choices: {
                    dark: 'SETTINGS.UI.FIELDS.colorScheme.choices.dark',
                    light: 'SETTINGS.UI.FIELDS.colorScheme.choices.light'
                }
            })
        };
    }

    /** Invoked by the setting when data changes */
    handleChange() {
        if (ui.resources) {
            if (this.displayFear === 'hide') {
                ui.resources.close({ allowed: true });
            } else {
                ui.resources.render({ force: true }).then(() => ui.resources.handleOffset());
            }
        }

        resetAndRerenderActors();
    }
}
