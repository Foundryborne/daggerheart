import { convertDamageToThreshold, damageKeyToNumber, getArmorSources, getDamageLabel, itemAbleRollParse } from '../../helpers/utils.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageReductionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve, reject, actor, action, damage, damageType) {
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
        const armor = orderedArmorSources.reduce((acc, { name, document }) => {
            const { current, max } = document.type === 'armor' ? document.system.armor : document.system.armorData;
            acc.push({
                name,
                effect: document,
                marks: [...Array(max).keys()].reduce((acc, _, index) => {
                    const spent = index < current;
                    acc[foundry.utils.randomID()] = { selected: false, disabled: spent, spent };
                    return acc;
                }, {})
            });

            return acc;
        }, []);

        const rules = this.#getRulesData(actor, action);
        this.marks = { armor, stress: rules.stress };
        this.maxArmorUsed = rules.maxArmorUsed;
        this.increasePerArmorMark = rules.increasePerArmorMark;
        this.availableStressReductions = rules.availableStressReductions;
        this.reduceSeverity = rules.reduceSeverity;
        this.thresholdImmunities = rules.thresholdImmunities;
        this.reductions = rules.reductions;
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
            takeDamage: this.takeDamage,
            toggleReduction: this.onToggleReduction,
            rollReductionDice: this.onRollReductionDice
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

    /**
     * @param {DhActor} baseActor 
     * @param {*} action 
     */
    #getRulesData(baseActor, action) {
        const targetActor = baseActor.getActionClone(action, { role: 'target' });
        const originActor = baseActor.getActionClone(action, { role: 'origin' });

        const maxArmorUsed = targetActor.system.rules.damageReduction.maxArmorMarked;
        const increasePerArmorMark = targetActor.system.rules.damageReduction.increasePerArmorMark;
        const reduceSeverity = targetActor.system.rules.damageReduction.reduceSeverity;

        const stress = [...Array(maxArmorUsed.stressExtra ?? 0).keys()].reduce(
            (acc, _) => {
                acc[foundry.utils.randomID()] = { selected: false };
                return acc;
            },
            {}
        );

        const availableStressReductions = Object.keys(targetActor.system.rules.damageReduction.stressDamageReduction)
            .reduce(
                (acc, key) => {
                    const dr = targetActor.system.rules.damageReduction.stressDamageReduction[key];
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

        const thresholdImmunities = Object.keys(targetActor.system.rules.damageReduction.thresholdImmunities).reduce(
            (acc, key) => {
                if (targetActor.system.rules.damageReduction.thresholdImmunities[key])
                    acc[damageKeyToNumber(key)] = game.i18n.format(`DAGGERHEART.GENERAL.DamageThresholds.with`, {
                        threshold: game.i18n.localize(`DAGGERHEART.GENERAL.DamageThresholds.${key}`)
                    });
                return acc;
            },
            {}
        );

        const reductions = Object.values(originActor.system.rules.damageReduction.reductions).map(x => ({
            ...x,
            label: _loc(x.label),
            value: itemAbleRollParse(x.value, originActor),
            enabled: false,
            isDeterministic: (new Roll(x.value)).isDeterministic
        }));

        return {
            stress,
            maxArmorUsed,
            increasePerArmorMark,
            availableStressReductions,
            reduceSeverity,
            thresholdImmunities,
            reductions
        }
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
        const stress = this.actor.system.resources.stress;
        context.stress =
            selectedStressMarks.length > 0 || this.availableStressReductions
                ? {
                    value: stress.value + selectedStressMarks.length + stressReductionStress,
                    max: stress.max
                }
                : null;

        context.maxArmorUsed = maxArmorUsed;
        context.availableArmor = availableArmor;
        context.basicMarksUsed = availableArmor === 0 || selectedStressMarks.length;

        const armorSources = [];
        for (const source of this.marks.armor) {
            armorSources.push({
                label: source.name,
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

        context.damage = this.damage;
        context.reducedDamage = this.getReducedDamage();
        const damageMarks = convertDamageToThreshold(context.damage, this.actor.system.damageThresholds);
        context.damageMarks = getDamageLabel(damageMarks);

        context.reducedDamageMarks = currentDamage !== damageMarks ? getDamageLabel(currentDamage) : null;
        context.currentDamageMarks = context.reducedDamageMarks ?? context.damageMarks;
        context.currentDamageMarksNr = currentDamage;

        context.reductions = this.reductions;

        return context;
    }

    static updateData(event, _, formData) {
        this.render(true);
    }

    getDamageInfo = () => {
        const selectedArmorMarks = this.marks.armor.flatMap(x => Object.values(x.marks).filter(x => x.selected));
        const selectedStressMarks = Object.values(this.marks.stress).filter(x => x.selected);
        const stressReductions = this.availableStressReductions
            ? Object.values(this.availableStressReductions).filter(red => red.selected)
            : [];
        const currentMarks = this.actor.system.armorScore.value + selectedArmorMarks.length;

        const maxArmorUsed = this.maxArmorUsed.value + selectedStressMarks.length;
        const availableArmor =
            maxArmorUsed -
            this.marks.armor.reduce((acc, source) => {
                acc += Object.values(source.marks).filter(x => x.selected).length;
                return acc;
            }, 0);

        const reducedDamage = this.getReducedDamage();
        const damageMarks = convertDamageToThreshold(reducedDamage ?? this.damage, this.actor.system.damageThresholds);
        const armorMarkReduction =
            selectedArmorMarks.length * this.increasePerArmorMark;
        let currentDamage = Math.max(damageMarks - armorMarkReduction - stressReductions.length, 0);
        if (this.reduceSeverity) {
            currentDamage = Math.max(currentDamage - this.reduceSeverity, 0);
        }

        if (this.thresholdImmunities[currentDamage]) currentDamage = 0;

        return { selectedStressMarks, stressReductions, currentMarks, currentDamage, maxArmorUsed, availableArmor };
    };

    getReducedDamage = () => {
        const activeReductions = this.reductions.filter(x => 
            x.enabled && 
            (x.isDeterministic || x.roll)
        );
        if (!activeReductions.length) return null;

        return activeReductions.reduce((acc, reduction) => {
            if (reduction.enabled) {
                if (reduction.isDeterministic) 
                    acc -= Number.parseInt(reduction.value);
                else 
                    acc -= reduction.roll.total;
            }

            return Math.max(acc, 0);
        }, this.damage);
    };

    static toggleRules() {
        this.rulesOn = !this.rulesOn;

        const maxArmor = this.maxArmorUsed.value;
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
        let stressMarkKey;
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

            const damageMarks = convertDamageToThreshold(this.damage, this.actor.system.damageThresholds);
            const reducedDamage = currentDamage !== damageMarks ? getDamageLabel(currentDamage) : null;
            const currentDamageLabel = reducedDamage ?? getDamageLabel(damageMarks);

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

        const resourceCosts = this.reductions.filter(x => x.enabled).reduce((acc, reduction) => {
            for (const [key, cost] of Object.entries(reduction.costs)) {
                const existing = acc.find(x => x.key === key);
                if (!existing) {
                    acc.push({ key, value: cost.value });    
                } else {
                    existing.value += cost.value;
                }
            }

            return acc;
        }, stressSpent ? [{ key: 'stress', value: stressSpent }] : []); 

        this.resolve({ modifiedDamage: currentDamage, armorChanges, resourceCosts });
        await this.close(true);
    }

    static onToggleReduction(_, target) {
        const reduction = this.reductions[target.dataset.reductionIndex];
        if (!reduction) return;

        reduction.enabled = !reduction.enabled;
        this.render();
    }

    static async onRollReductionDice(event, target) {
        event.stopPropagation();
        const element = target.closest('[data-reduction-index]');
        if (!element) return;

        const reduction = this.reductions[element.dataset.reductionIndex];
        if (!reduction) return;

        reduction.roll = await (new Roll(reduction.value)).evaluate();
        const message = await getDocumentClass('ChatMessage').create({
            user: game.user.id,
            title: reduction.label,
            rolls: [reduction.roll],
            flags: { daggerheart: { noButtons: true } }
        });

        if (game.dice3d) {
            await game.dice3d.waitFor3DAnimationByMessageID(message.id);
        }

        this.render();
    }

    async close(fromSave) {
        if (!fromSave) {
            this.resolve();
        }

        await super.close({});
    }

    static async armorSlotQuery({ actorId, actionUuid, damage, type }) {
        const actor = await fromUuid(actorId);
        if (!actor?.isOwner) throw new Error(`Actor [${actorId}] is not owned by the queried user.`);

        const action = await fromUuid(actionUuid);
        return new Promise((resolve, reject) => {
            new DamageReductionDialog(resolve, reject, actor, action, damage, type).render({ force: true });
        });
    }
}
