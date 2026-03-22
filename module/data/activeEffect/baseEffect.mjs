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

import { getScrollTextData } from '../../helpers/utils.mjs';
import { changeTypes } from './_module.mjs';

export default class BaseEffect extends foundry.data.ActiveEffectTypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        const baseChanges = Object.keys(CONFIG.DH.GENERAL.baseActiveEffectModes).reduce((r, type) => {
            r[type] = new fields.SchemaField({
                key: new fields.StringField({ required: true }),
                type: new fields.StringField({
                    required: true,
                    choices: [type],
                    initial: type,
                    validate: BaseEffect.#validateType
                }),
                value: new fields.AnyField({
                    required: true,
                    nullable: true,
                    serializable: true,
                    initial: ''
                }),
                phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
                priority: new fields.NumberField()
            });
            return r;
        }, {});

        return {
            ...super.defineSchema(),
            changes: new fields.ArrayField(
                new fields.TypedSchemaField(
                    { ...changeTypes, ...baseChanges },
                    { initial: baseChanges.add.getInitialValue() }
                )
            ),
            duration: new fields.SchemaField({
                type: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.activeEffectDurations,
                    blank: true,
                    label: 'DAGGERHEART.GENERAL.type'
                }),
                description: new fields.HTMLField({ label: 'DAGGERHEART.GENERAL.description' })
            }),
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

    /**
     * Validate that an {@link EffectChangeData#type} string is well-formed.
     * @param {string} type The string to be validated
     * @returns {true}
     * @throws {Error} An error if the type string is malformed
     */
    static #validateType(type) {
        if (type.length < 3) throw new Error('must be at least three characters long');
        if (!/^custom\.-?\d+$/.test(type) && !type.split('.').every(s => /^[a-z0-9]+$/i.test(s))) {
            throw new Error(
                'A change type must either be a sequence of dot-delimited, alpha-numeric substrings or of the form' +
                    ' "custom.{number}"'
            );
        }
        return true;
    }

    get isSuppressed() {
        for (const change of this.changes) {
            if (change.isSuppressed) return true;
        }
    }

    get armorChange() {
        return this.changes.find(x => x.type === CONFIG.DH.GENERAL.activeEffectModes.armor.id);
    }

    get armorData() {
        const armorChange = this.armorChange;
        if (!armorChange) return null;

        return armorChange.getArmorData();
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

    async _preUpdate(changed, options, userId) {
        const allowed = await super._preUpdate(changed, options, userId);
        if (allowed === false) return false;

        const autoSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        if (
            autoSettings.resourceScrollTexts &&
            this.parent.actor?.type === 'character' &&
            this.parent.actor.system.resources.armor
        ) {
            const newArmorTotal = (changed.system?.changes ?? []).reduce((acc, change) => {
                if (change.type === 'armor') acc += change.value.current;
                return acc;
            }, this.parent.actor.system.armor?.system?.armor?.current ?? 0);

            const armorData = getScrollTextData(this.parent.actor, { value: newArmorTotal }, 'armor');
            options.scrollingTextData = [armorData];
        }
    }

    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        if (this.parent.actor && options.scrollingTextData)
            this.parent.actor.queueScrollText(options.scrollingTextData);
    }
}
