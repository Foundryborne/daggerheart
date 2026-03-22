import { damageKeyToNumber, getArmorSources, getDamageLabel } from '../../helpers/utils.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageReductionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve, reject, actor, damage, damageType) {
        super({});

        this.resolve = resolve;
        this.reject = reject;
        this.actor = actor;
        this.damage = damage;

        this.damageType = damageType;
        this.rulesDefault = game.settings.get(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.Automation
        ).damageReductionRulesDefault;

        this.rulesOn = [CONFIG.DH.GENERAL.ruleChoice.on.id, CONFIG.DH.GENERAL.ruleChoice.onWithToggle.id].includes(
            this.rulesDefault
        );

        const orderedArmorSources = getArmorSources(actor).filter(s => !s.disabled);
        const armor = orderedArmorSources.reduce((acc, { document }) => {
            const { current, max } = document.type === 'armor' ? document.system.armor : document.system.armorData;
            acc.push({
                effect: document,
                marks: [...Array(max).keys()].reduce((acc, _, index) => {
                    const spent = index < current;
                    acc[foundry.utils.randomID()] = { selected: false, disabled: spent, spent };
                    return acc;
                }, {})
            });

            return acc;
        }, []);
        const stress = [...Array(actor.system.rules.damageReduction.maxArmorMarked.stressExtra ?? 0).keys()].reduce(
            (acc, _) => {
                acc[foundry.utils.randomID()] = { selected: false };
                return acc;
            },
            {}
        );
        this.marks = { armor, stress };

        this.availableStressReductions = Object.keys(actor.system.rules.damageReduction.stressDamageReduction).reduce(
            (acc, key) => {
                const dr = actor.system.rules.damageReduction.stressDamageReduction[key];
                if (dr.cost) {
                    if (acc === null) acc = {};

                    const damage = damageKeyToNumber(key);
                    acc[damage] = {
                        cost: dr.cost,
                        selected: false,
                        any: key === 'any',
                        from: getDamageLabel(damage),
                        to: getDamageLabel(damage - 1)
                    };
                }

                return acc;
            },
            null
        );

        this.reduceSeverity = this.damageType.reduce((value, curr) => {
            return Math.max(this.actor.system.rules.damageReduction.reduceSeverity[curr], value);
        }, 0);
        this.actor.system.rules.damageReduction.reduceSeverity[this.damageType];

        this.thresholdImmunities = Object.keys(actor.system.rules.damageReduction.thresholdImmunities).reduce(
            (acc, key) => {
                if (actor.system.rules.damageReduction.thresholdImmunities[key])
                    acc[damageKeyToNumber(key)] = game.i18n.format(`DAGGERHEART.GENERAL.DamageThresholds.with`, {
                        threshold: game.i18n.localize(`DAGGERHEART.GENERAL.DamageThresholds.${key}`)
                    });
                return acc;
            },
            {}
        );
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'damage-reduction'],
        position: {
            width: 280,
            height: 'auto'
        },
        actions: {
            toggleRules: this.toggleRules,
            setMarks: this.setMarks,
            useStressReduction: this.useStressReduction,
            takeDamage: this.takeDamage
        },
        form: {
            handler: this.updateData,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    /** @override */
    static PARTS = {
        damageSelection: {
            id: 'damageReduction',
            template: 'systems/daggerheart/templates/dialogs/damageReduction.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.DamageReduction.title');
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.rulesOn = this.rulesOn;
        context.rulesToggleable = [
            CONFIG.DH.GENERAL.ruleChoice.onWithToggle.id,
            CONFIG.DH.GENERAL.ruleChoice.offWithToggle.id
        ].includes(this.rulesDefault);
        context.reduceSeverity = this.reduceSeverity;
        context.thresholdImmunities =
            Object.keys(this.thresholdImmunities).length > 0 ? this.thresholdImmunities : null;

        const { selectedStressMarks, stressReductions, currentMarks, currentDamage, maxArmorUsed, availableArmor } =
            this.getDamageInfo();

        context.armorScore = this.actor.system.armorScore.max;
        context.armorMarks = currentMarks;

        const stressReductionStress = this.availableStressReductions
            ? stressReductions.reduce((acc, red) => acc + red.cost, 0)
            : 0;
        context.stress =
            selectedStressMarks.length > 0 || this.availableStressReductions
                ? {
                      value:
                          this.actor.system.resources.stress.value + selectedStressMarks.length + stressReductionStress,
                      max: this.actor.system.resources.stress.max
                  }
                : null;

        context.maxArmorUsed = maxArmorUsed;
        context.availableArmor = availableArmor;
        context.basicMarksUsed = availableArmor === 0 || selectedStressMarks.length;

        const armorSources = [];
        for (const source of this.marks.armor) {
            const parent = source.effect.origin
                ? await foundry.utils.fromUuid(source.effect.origin)
                : source.effect.parent;

            const useEffectName = parent.type === 'armor' || parent instanceof Actor;
            const label = useEffectName ? source.effect.name : parent.name;
            armorSources.push({
                label: label,
                uuid: source.effect.uuid,
                marks: source.marks
            });
        }
        context.marks = {
            armor: armorSources,
            stress: this.marks.stress
        };

        context.usesStressArmor = Object.keys(context.marks.stress).length;
        context.availableStressReductions = this.availableStressReductions;

        context.damage = getDamageLabel(this.damage);
        context.reducedDamage = currentDamage !== this.damage ? getDamageLabel(currentDamage) : null;
        context.currentDamage = context.reducedDamage ?? context.damage;
        context.currentDamageNr = currentDamage;

        return context;
    }

    static updateData(event, _, formData) {
        const form = foundry.utils.expandObject(formData.object);
        this.render(true);
    }

    getDamageInfo = () => {
        const selectedArmorMarks = this.marks.armor.flatMap(x => Object.values(x.marks).filter(x => x.selected));
        const selectedStressMarks = Object.values(this.marks.stress).filter(x => x.selected);
        const stressReductions = this.availableStressReductions
            ? Object.values(this.availableStressReductions).filter(red => red.selected)
            : [];
        const currentMarks = this.actor.system.armorScore.value + selectedArmorMarks.length;

        const maxArmorUsed = this.actor.system.rules.damageReduction.maxArmorMarked.value + selectedStressMarks.length;
        const availableArmor =
            maxArmorUsed -
            this.marks.armor.reduce((acc, source) => {
                acc += Object.values(source.marks).filter(x => x.selected).length;
                return acc;
            }, 0);

        const armorMarkReduction =
            selectedArmorMarks.length * this.actor.system.rules.damageReduction.increasePerArmorMark;
        let currentDamage = Math.max(this.damage - armorMarkReduction - stressReductions.length, 0);
        if (this.reduceSeverity) {
            currentDamage = Math.max(currentDamage - this.reduceSeverity, 0);
        }

        if (this.thresholdImmunities[currentDamage]) currentDamage = 0;

        return { selectedStressMarks, stressReductions, currentMarks, currentDamage, maxArmorUsed, availableArmor };
    };

    static toggleRules() {
        this.rulesOn = !this.rulesOn;

        const maxArmor = this.actor.system.rules.damageReduction.maxArmorMarked.value;
        this.marks = {
            armor: this.marks.armor.map((mark, index) => {
                const keepSelectValue = !this.rulesOn || index + 1 <= maxArmor;
                return { ...mark, selected: keepSelectValue ? mark.selected : false };
            }),
            stress: this.marks.stress
        };

        this.render();
    }

    static setMarks(_, target) {
        const currentMark = foundry.utils.getProperty(this.marks, target.dataset.path);
        const { selectedStressMarks, stressReductions, currentDamage, availableArmor } = this.getDamageInfo();

        if (!currentMark.selected && currentDamage === 0) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.damageAlreadyNone'));
            return;
        }

        if (this.rulesOn) {
            if (target.dataset.type === 'armor' && !currentMark.selected && !availableArmor) {
                ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noAvailableArmorMarks'));
                return;
            }
        }

        const stressUsed = selectedStressMarks.length;
        if (target.dataset.type === 'armor' && stressUsed) {
            const updateResult = this.updateStressArmor(target.dataset.id, !currentMark.selected);
            if (updateResult === false) return;
        }

        if (currentMark.selected) {
            const currentDamageLabel = getDamageLabel(currentDamage);
            for (let reduction of stressReductions) {
                if (reduction.selected && reduction.to === currentDamageLabel) {
                    reduction.selected = false;
                }
            }

            if (target.dataset.type === 'stress' && currentMark.armorMarkId) {
                for (const source of this.marks.armor) {
                    const match = Object.keys(source.marks).find(key => key === currentMark.armorMarkId);
                    if (match) {
                        source.marks[match].selected = false;
                        break;
                    }
                }

                currentMark.armorMarkId = null;
            }
        }

        currentMark.selected = !currentMark.selected;
        this.render();
    }

    updateStressArmor(armorMarkId, select) {
        let stressMarkKey = null;
        if (select) {
            stressMarkKey = Object.keys(this.marks.stress).find(
                key => this.marks.stress[key].selected && !this.marks.stress[key].armorMarkId
            );
        } else {
            stressMarkKey = Object.keys(this.marks.stress).find(
                key => this.marks.stress[key].armorMarkId === armorMarkId
            );
            if (!stressMarkKey)
                stressMarkKey = Object.keys(this.marks.stress).find(key => this.marks.stress[key].selected);
        }

        if (!stressMarkKey) return false;

        this.marks.stress[stressMarkKey].armorMarkId = select ? armorMarkId : null;
    }

    static useStressReduction(_, target) {
        const damageValue = Number(target.dataset.reduction);
        const stressReduction = this.availableStressReductions[damageValue];
        const { currentDamage, selectedStressMarks, stressReductions } = this.getDamageInfo();

        if (stressReduction.selected) {
            stressReduction.selected = false;

            const currentDamageLabel = getDamageLabel(currentDamage);
            for (let reduction of stressReductions) {
                if (reduction.selected && reduction.to === currentDamageLabel) {
                    reduction.selected = false;
                }
            }

            this.render();
        } else {
            const stressReductionStress = this.availableStressReductions
                ? stressReductions.reduce((acc, red) => acc + red.cost, 0)
                : 0;
            const currentStress =
                this.actor.system.resources.stress.value + selectedStressMarks.length + stressReductionStress;
            if (currentStress + stressReduction.cost > this.actor.system.resources.stress.max) {
                ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.notEnoughStress'));
                return;
            }

            const reducedDamage = currentDamage !== this.damage ? getDamageLabel(currentDamage) : null;
            const currentDamageLabel = reducedDamage ?? getDamageLabel(this.damage);

            if (!stressReduction.any && stressReduction.from !== currentDamageLabel) return;

            stressReduction.selected = true;
            this.render();
        }
    }

    static async takeDamage() {
        const { selectedStressMarks, stressReductions, currentDamage } = this.getDamageInfo();
        const armorChanges = this.marks.armor.reduce((acc, source) => {
            const amount = Object.values(source.marks).filter(x => x.selected).length;
            if (amount) acc.push({ uuid: source.effect.uuid, amount });

            return acc;
        }, []);
        const stressSpent =
            selectedStressMarks.filter(x => x.armorMarkId).length +
            stressReductions.reduce((acc, red) => acc + red.cost, 0);

        this.resolve({ modifiedDamage: currentDamage, armorChanges, stressSpent });
        await this.close(true);
    }

    async close(fromSave) {
        if (!fromSave) {
            this.resolve();
        }

        await super.close({});
    }

    static async armorSlotQuery({ actorId, damage, type }) {
        return new Promise(async (resolve, reject) => {
            const actor = await fromUuid(actorId);
            if (!actor || !actor?.isOwner) reject();
            new DamageReductionDialog(resolve, reject, actor, damage, type).render({ force: true });
        });
    }
}
