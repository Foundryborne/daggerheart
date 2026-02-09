import DHBaseActorSettings from '../../applications/sheets/api/actor-setting.mjs';
import DHItem from '../../documents/item.mjs';
import { getScrollTextData } from '../../helpers/utils.mjs';

const fields = foundry.data.fields;

const resistanceField = (resistanceLabel, immunityLabel, reductionLabel) =>
    new fields.SchemaField({
        resistance: new fields.BooleanField({
            initial: false,
            label: `${resistanceLabel}.label`,
            hint: `${resistanceLabel}.hint`,
            isAttributeChoice: true
        }),
        immunity: new fields.BooleanField({
            initial: false,
            label: `${immunityLabel}.label`,
            hint: `${immunityLabel}.hint`,
            isAttributeChoice: true
        }),
        reduction: new fields.NumberField({
            integer: true,
            initial: 0,
            label: `${reductionLabel}.label`,
            hint: `${reductionLabel}.hint`
        })
    });

/* Common rules applying to Characters and Adversaries */
export const commonActorRules = (extendedData = { damageReduction: {}, attack: { damage: {} } }) => ({
    conditionImmunities: new fields.SchemaField({
        hidden: new fields.BooleanField({
            initial: false,
            label: 'DAGGERHEART.GENERAL.Rules.conditionImmunities.hidden'
        }),
        restrained: new fields.BooleanField({
            initial: false,
            label: 'DAGGERHEART.GENERAL.Rules.conditionImmunities.restrained'
        }),
        vulnerable: new fields.BooleanField({
            initial: false,
            label: 'DAGGERHEART.GENERAL.Rules.conditionImmunities.vulnerable'
        })
    }),
    damageReduction: new fields.SchemaField({
        thresholdImmunities: new fields.SchemaField({
            minor: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.GENERAL.Rules.damageReduction.thresholdImmunities.minor.label',
                hint: 'DAGGERHEART.GENERAL.Rules.damageReduction.thresholdImmunities.minor.hint'
            })
        }),
        reduceSeverity: new fields.SchemaField({
            magical: new fields.NumberField({
                initial: 0,
                min: 0,
                label: 'DAGGERHEART.GENERAL.Rules.damageReduction.reduceSeverity.magical.label',
                hint: 'DAGGERHEART.GENERAL.Rules.damageReduction.reduceSeverity.magical.hint'
            }),
            physical: new fields.NumberField({
                initial: 0,
                min: 0,
                label: 'DAGGERHEART.GENERAL.Rules.damageReduction.reduceSeverity.physical.label',
                hint: 'DAGGERHEART.GENERAL.Rules.damageReduction.reduceSeverity.physical.hint'
            })
        }),
        ...(extendedData.damageReduction ?? {})
    }),
    attack: new fields.SchemaField({
        ...extendedData.attack,
        damage: new fields.SchemaField({
            hpDamageMultiplier: new fields.NumberField({
                required: true,
                nullable: false,
                initial: 1,
                label: 'DAGGERHEART.GENERAL.Attack.hpDamageMultiplier.label',
                hint: 'DAGGERHEART.GENERAL.Attack.hpDamageMultiplier.hint'
            }),
            hpDamageTakenMultiplier: new fields.NumberField({
                required: true,
                nullable: false,
                initial: 1,
                label: 'DAGGERHEART.GENERAL.Attack.hpDamageTakenMultiplier.label',
                hint: 'DAGGERHEART.GENERAL.Attack.hpDamageTakenMultiplier.hint'
            }),
            ...(extendedData.attack?.damage ?? {})
        })
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
            hasResistances: true,
            hasAttribution: false,
            hasLimitedView: true,
            usesSize: false
        };
    }

    /**@returns {ActorDataModelMetadata}*/
    get metadata() {
        return this.constructor.metadata;
    }

    /** @inheritDoc */
    static defineSchema() {
        const schema = {};

        if (this.metadata.hasAttribution) {
            schema.attribution = new fields.SchemaField({
                source: new fields.StringField(),
                page: new fields.NumberField(),
                artist: new fields.StringField()
            });
        }
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
        if (this.metadata.usesSize)
            schema.size = new fields.StringField({
                required: true,
                nullable: false,
                choices: CONFIG.DH.ACTOR.tokenSize,
                initial: CONFIG.DH.ACTOR.tokenSize.custom.id
            });
        return schema;
    }

    /* -------------------------------------------- */

    /**
     * The default icon used for newly created Actors documents
     * @type {string}
     */
    static DEFAULT_ICON = null;

    get attributionLabel() {
        if (!this.attribution) return;

        const { source, page } = this.attribution;
        return [source, page ? `pg ${page}.` : null].filter(x => x).join('. ');
    }

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

    /**
     * Checks if an item is available for use, such as multiclass features being disabled
     * on a character.
     *
     * @param {DHItem} item The item being checked for availability
     * @return {boolean} whether the item is available
     */
    isItemAvailable(item) {
        return true;
    }

    async _preDelete() {
        /* Clear all partyMembers from tagTeam setting.*/
        /* Revisit this when tagTeam is improved for many parties */
        if (this.parent.parties.size > 0) {
            const tagTeam = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll);
            await tagTeam.updateSource({
                initiator: this.parent.id === tagTeam.initiator ? null : tagTeam.initiator,
                members: Object.keys(tagTeam.members).find(x => x === this.parent.id)
                    ? { [`-=${this.parent.id}`]: null }
                    : {}
            });
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll, tagTeam);
        }
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
                const resourceValue = changes.system.resources[resource];
                if (
                    resourceValue &&
                    this.resources[resource].max &&
                    resourceValue.value !== this.resources[resource].value
                ) {
                    const becameMax = resourceValue.value === this.resources[resource].max;
                    const wasMax =
                        this.resources[resource].value === this.resources[resource].max &&
                        this.resources[resource].value !== resourceValue.value;
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

        if (options.scrollingTextData) this.parent.queueScrollText(options.scrollingTextData);
    }
}
