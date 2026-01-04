/** -- Changes Type Priorities --
 *  - Base Number -
 *  Custom: 0
 *  Multiply: 10
 *  Add: 20
 *  Downgrade: 30
 *  Upgrade: 40
 *  Override: 50
 *
 *  - Changes Value Priorities -
 *  Standard: +0
 *  "Anything that uses another data model value as its value": +1 - Effects that increase traits have to be calculated first at Base priority. (EX: Raise evasion by half your agility)
 */

export default class BaseEffect extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            rangeDependence: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.GENERAL.enabled'
                }),
                type: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.rangeInclusion,
                    initial: CONFIG.DH.GENERAL.rangeInclusion.withinRange.id,
                    label: 'DAGGERHEART.GENERAL.type'
                }),
                target: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.otherTargetTypes,
                    initial: CONFIG.DH.GENERAL.otherTargetTypes.hostile.id,
                    label: 'DAGGERHEART.GENERAL.Target.single'
                }),
                range: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.range,
                    initial: CONFIG.DH.GENERAL.range.melee.id,
                    label: 'DAGGERHEART.GENERAL.range'
                })
            })
        };
    }

    static getDefaultObject() {
        return {
            name: 'New Effect',
            id: foundry.utils.randomID(),
            disabled: false,
            img: 'icons/magic/life/heart-cross-blue.webp',
            description: '',
            statuses: [],
            changes: [],
            system: {
                rangeDependence: {
                    enabled: false,
                    type: CONFIG.DH.GENERAL.rangeInclusion.withinRange.id,
                    target: CONFIG.DH.GENERAL.otherTargetTypes.hostile.id,
                    range: CONFIG.DH.GENERAL.range.melee.id
                }
            }
        };
    }
}
