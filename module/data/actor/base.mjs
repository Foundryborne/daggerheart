import DHBaseActorSettings from '../../applications/sheets/api/actor-setting.mjs';
import { createScrollText, getScrollTextData } from '../../helpers/utils.mjs';

const resistanceField = (resistanceLabel, immunityLabel, reductionLabel) =>
    new foundry.data.fields.SchemaField({
        resistance: new foundry.data.fields.BooleanField({
            initial: false,
            label: `${resistanceLabel}.label`,
            hint: `${resistanceLabel}.hint`,
            isAttributeChoice: true
        }),
        immunity: new foundry.data.fields.BooleanField({
            initial: false,
            label: `${immunityLabel}.label`,
            hint: `${immunityLabel}.hint`,
            isAttributeChoice: true
        }),
        reduction: new foundry.data.fields.NumberField({
            integer: true,
            initial: 0,
            label: `${reductionLabel}.label`,
            hint: `${reductionLabel}.hint`
        })
    });

/**
 * Describes metadata about the actor data model type
 * @typedef {Object} ActorDataModelMetadata
 * @property {string} label - A localizable label used on application.
 * @property {string} type - The system type that this data model represents.
 * @property {Boolean} isNPC - This data model represents a NPC?
 * @property {typeof DHBaseActorSettings} settingSheet - The sheet class used to render the settings UI for this actor type.
 */
export default class BaseDataActor extends foundry.abstract.TypeDataModel {
    /** @returns {ActorDataModelMetadata}*/
    static get metadata() {
        return {
            label: 'Base Actor',
            type: 'base',
            isNPC: true,
            settingSheet: null,
            hasResistances: true
        };
    }

    /**@returns {ActorDataModelMetadata}*/
    get metadata() {
        return this.constructor.metadata;
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = {};

        if (this.metadata.isNPC) schema.description = new fields.HTMLField({ required: true, nullable: true });
        if (this.metadata.hasResistances)
            schema.resistance = new fields.SchemaField({
                physical: resistanceField(
                    'DAGGERHEART.GENERAL.DamageResistance.physicalResistance',
                    'DAGGERHEART.GENERAL.DamageResistance.physicalImmunity',
                    'DAGGERHEART.GENERAL.DamageResistance.physicalReduction'
                ),
                magical: resistanceField(
                    'DAGGERHEART.GENERAL.DamageResistance.magicalResistance',
                    'DAGGERHEART.GENERAL.DamageResistance.magicalImmunity',
                    'DAGGERHEART.GENERAL.DamageResistance.magicalReduction'
                )
            });
        return schema;
    }

    /* -------------------------------------------- */

    /**
     * The default icon used for newly created Actors documents
     * @type {string}
     */
    static DEFAULT_ICON = null;

    /* -------------------------------------------- */

    /**
     * Obtain a data object used to evaluate any dice rolls associated with this Item Type
     * @param {object} [options] - Options which modify the getRollData method.
     * @returns {object}
     */
    getRollData() {
        const data = { ...this };
        return data;
    }

    async _preUpdate(changes, options, userId) {
        const allowed = await super._preUpdate(changes, options, userId);
        if (allowed === false) return;

        const autoSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        if (changes.system?.resources && autoSettings.resourceScrollTexts) {
            const textData = Object.keys(changes.system.resources).reduce((acc, key) => {
                const resource = changes.system.resources[key];
                if (resource.value !== undefined && resource.value !== this.resources[key].value) {
                    acc.push(getScrollTextData(this.resources, resource, key));
                }

                return acc;
            }, []);
            options.scrollingTextData = textData;
        }

        if (changes.system?.resources) {
            const defeatedSettings = game.settings.get(
                CONFIG.DH.id,
                CONFIG.DH.SETTINGS.gameSettings.Automation
            ).defeated;
            const typeForDefeated = ['character', 'adversary', 'companion'].find(x => x === this.parent.type);
            if (defeatedSettings.enabled && typeForDefeated) {
                const resource = typeForDefeated === 'companion' ? 'stress' : 'hitPoints';
                if (changes.system.resources[resource]) {
                    const becameMax = changes.system.resources[resource].value === this.resources[resource].max;
                    const wasMax =
                        this.resources[resource].value === this.resources[resource].max &&
                        this.resources[resource].value !== changes.system.resources[resource].value;
                    if (becameMax) {
                        this.parent.toggleDefeated(true);
                    } else if (wasMax) {
                        this.parent.toggleDefeated(false);
                    }
                }
            }
        }
    }

    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);

        createScrollText(this.parent, options.scrollingTextData);
    }
}
