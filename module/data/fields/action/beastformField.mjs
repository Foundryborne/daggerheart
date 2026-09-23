import BeastformDialog from '../../../applications/dialogs/beastformDialog.mjs';
import { adjustDice } from '../../../helpers/utils.mjs';

const fields = foundry.data.fields;

export default class BeastformField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 90;

    constructor(options = {}, context = {}) {
        const beastformFields = {
            tierAccess: new fields.SchemaField({
                exact: new fields.NumberField({
                    integer: true,
                    nullable: true,
                    initial: null,
                    choices: () => {
                        const settingsTiers = game.settings.get(
                            CONFIG.DH.id,
                            CONFIG.DH.SETTINGS.gameSettings.LevelTiers
                        ).tiers;
                        return Object.values(settingsTiers).reduce(
                            (acc, tier) => {
                                acc[tier.tier] = game.i18n.localize(tier.name);
                                return acc;
                            },
                            { 1: game.i18n.localize('DAGGERHEART.GENERAL.Tiers.1') }
                        );
                    },
                    label: 'DAGGERHEART.ACTIONS.Config.beastform.exact.label',
                    hint: 'DAGGERHEART.ACTIONS.Config.beastform.exact.hint'
                })
            }),
            modifications: new fields.SchemaField({
                traitBonuses: new fields.ArrayField(
                    new fields.SchemaField({
                        bonus: new fields.NumberField({
                            integer: true,
                            initial: 1,
                            min: 1,
                            label: 'DAGGERHEART.ACTIONS.Config.beastform.modifications.traitBonuses.bonus'
                        })
                    })
                )
            })
        };
        super(beastformFields, options, context);
    }

    /**
     * Beastform Transformation Action Workflow part.
     * Must be called within Action context or similar.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    static async execute(config) {
        const { selected, evolved, hybrid } = await BeastformDialog.configure(config, this.item);
        if (!selected) return false;

        return await BeastformField.transform.call(this, selected, evolved, hybrid);
    }

    /**
     * Update Action Workflow config object.
     * Must be called within Action context.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    prepareConfig(config) {
        if (this.actor.effects.find(x => x.type === 'beastform')) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.beastformAlreadyApplied'));
            return false;
        }

        const settingsTiers = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers).tiers;
        const actorLevel = this.actor.system.levelData.level.current;
        const actorTier =
            Object.values(settingsTiers).find(
                tier => actorLevel >= tier.levels.start && actorLevel <= tier.levels.end
            ) ?? 1;

        config.tierLimit = this.beastform.tierAccess.exact ?? actorTier;
        config.modifications = this.beastform.modifications;
    }

    static async transform(selectedForm, evolvedData, hybridData) {
        const formData = evolvedData?.form ?? selectedForm;
        const beastformEffect = formData.effects.find(x => x.type === 'beastform');
        if (!beastformEffect) {
            ui.notifications.error('DAGGERHEART.UI.Notifications.beastformMissingEffect');
            return false;
        }

        if (evolvedData?.form) {
            const { tokenSize, evolved } = selectedForm.system;
            const evolvedForm = selectedForm.effects.find(x => x.type === 'beastform');
            if (!evolvedForm) {
                ui.notifications.error('DAGGERHEART.UI.Notifications.beastformMissingEffect');
                return false;
            }

            if (evolved.mainTraitBonus) {
                const traitChange = 
                    beastformEffect.changes.find(x => x.key === `system.traits.${formData.system.mainTrait}.value`);
                if (traitChange) {
                    traitChange.value += evolved.mainTraitBonus;
                } else {
                    beastformEffect.changes.push({ 
                        key: `system.traits.${formData.system.mainTrait}.value`, 
                        value: evolved.mainTraitBonus,
                        type: 'add',
                        priority: 20,
                        phase: 'initial' 
                    });
                }
            }

            if (evolved.evasionBonus) {
                const evasionChange = beastformEffect.changes.find(x => x.key === `system.evasion`);
                if (evasionChange) {
                    evasionChange.value += evolved.evasionBonus;
                } else {
                    beastformEffect.changes.push({ 
                        key: 'system.evasion', 
                        value: evolved.evasionBonus,
                        type: 'add',
                        priority: 20,
                        phase: 'initial' 
                    });
                }
            }

            const standardAttack = beastformEffect.changes.find(x => x.type === 'standardAttack');
            if (standardAttack) {
                if (evolved.damageBonus) {
                    standardAttack.value.damageFormula = `${standardAttack.value.damageFormula} + ${evolved.damageBonus}`; 
                }
                
                if (evolved.increaseDamageDice) {
                    const diceDenomination = standardAttack.value.damageFormula.match(/d\d/)[0];
                    if (diceDenomination) {
                        const adjustedDice = adjustDice(diceDenomination);
                        standardAttack.value.damageFormula = standardAttack.value.damageFormula.replace(/d\d/, adjustedDice);
                    }
                }
            }

            beastformEffect.changes = [...beastformEffect.changes, ...evolvedForm.changes];
            formData.system.features = [...formData.system.features, ...selectedForm.system.features.map(x => x.uuid)];

            const baseSize = tokenSize.size;
            const evolvedSize =
                baseSize === 'custom'
                    ? 'custom'
                    : (Object.keys(CONFIG.DH.ACTOR.tokenSize).find(
                        x => CONFIG.DH.ACTOR.tokenSize[x].value === CONFIG.DH.ACTOR.tokenSize[baseSize].value + 1
                    ) ?? baseSize);
            formData.system.tokenSize = {
                ...tokenSize,
                size: evolvedSize
            };
        }

        if (selectedForm.system.beastformType === CONFIG.DH.ITEM.beastformTypes.hybrid.id) {
            formData.system.advantageOn = Object.values(hybridData.advantages).reduce((advantages, formCategory) => {
                Object.keys(formCategory).forEach(advantageKey => {
                    advantages[advantageKey] = formCategory[advantageKey];
                });
                return advantages;
            }, {});
            formData.system.features = [
                ...formData.system.features,
                ...Object.values(hybridData.features).flatMap(x => Object.keys(x))
            ];
        }

        this.actor.createEmbeddedDocuments('Item', [formData]);
    }

    /**
     * Remove existing beastform effect and return true if there was one
     * @returns {boolean}
     */
    static async handleActiveTransformations() {
        const beastformEffects = this.actor.effects.filter(x => x.type === 'beastform');
        const existingEffects = beastformEffects.length > 0;
        await this.actor.deleteEmbeddedDocuments(
            'ActiveEffect',
            beastformEffects.map(x => x.id)
        );
        return existingEffects;
    }
}
