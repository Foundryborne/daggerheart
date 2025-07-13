import { damageKeyToNumber, getDamageLabel } from '../../helpers/utils.mjs';

const { DialogV2, ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageReductionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve, reject, actor, damage, damageType) {
        super({});

        this.resolve = resolve;
        this.reject = reject;
        this.actor = actor;
        this.damage = damage;

        const canApplyArmor = damageType.every(t => actor.system.armorApplicableDamageTypes[t] === true);
        const maxArmorMarks = canApplyArmor
            ? Math.min(
                  actor.system.armorScore - actor.system.armor.system.marks.value,
                  actor.system.rules.damageReduction.maxArmorMarked.total
              )
            : 0;

        const armor = [...Array(maxArmorMarks).keys()].reduce((acc, _) => {
            acc[foundry.utils.randomID()] = { selected: false };
            return acc;
        }, {});
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
                if (dr.enabled) {
                    if (acc === null) acc = {};

                    const damage = damageKeyToNumber(key);
                    acc[damage] = {
                        cost: dr.cost,
                        selected: false,
                        from: getDamageLabel(damage),
                        to: getDamageLabel(damage - 1)
                    };
                }

                return acc;
            },
            null
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.DamageReduction.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'damage-reduction'],
        position: {
            width: 240,
            height: 'auto'
        },
        actions: {
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

        const { selectedArmorMarks, selectedStressMarks, stressReductions, currentMarks, currentDamage } =
            this.getDamageInfo();

        context.armorScore = this.actor.system.armorScore;
        context.armorMarks = currentMarks;
        context.basicMarksUsed =
            selectedArmorMarks.length === this.actor.system.rules.damageReduction.maxArmorMarked.total;

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

        context.marks = this.marks;
        context.availableStressReductions = this.availableStressReductions;

        context.damage = getDamageLabel(this.damage);
        context.reducedDamage = currentDamage !== this.damage ? getDamageLabel(currentDamage) : null;
        context.currentDamage = context.reducedDamage ?? context.damage;

        return context;
    }

    static updateData(event, _, formData) {
        const form = foundry.utils.expandObject(formData.object);
        this.render(true);
    }

    getDamageInfo = () => {
        const selectedArmorMarks = Object.values(this.marks.armor).filter(x => x.selected);
        const selectedStressMarks = Object.values(this.marks.stress).filter(x => x.selected);
        const stressReductions = this.availableStressReductions
            ? Object.values(this.availableStressReductions).filter(red => red.selected)
            : [];
        const currentMarks =
            this.actor.system.armor.system.marks.value + selectedArmorMarks.length + selectedStressMarks.length;

        const armorMarkReduction =
            selectedArmorMarks.length * this.actor.system.rules.damageReduction.increasePerArmorMark;
        const currentDamage = this.damage - armorMarkReduction - selectedStressMarks.length - stressReductions.length;

        return { selectedArmorMarks, selectedStressMarks, stressReductions, currentMarks, currentDamage };
    };

    static setMarks(_, target) {
        const currentMark = this.marks[target.dataset.type][target.dataset.key];
        const { selectedStressMarks, stressReductions, currentMarks, currentDamage } = this.getDamageInfo();
        if (!currentMark.selected && currentDamage === 0) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.damageAlreadyNone'));
            return;
        }

        if (!currentMark.selected && currentMarks === this.actor.system.armorScore) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noAvailableArmorMarks'));
            return;
        }

        if (currentMark.selected) {
            const currentDamageLabel = getDamageLabel(currentDamage);
            for (let reduction of stressReductions) {
                if (reduction.selected && reduction.to === currentDamageLabel) {
                    reduction.selected = false;
                }
            }

            if (target.dataset.type === 'armor' && selectedStressMarks.length > 0) {
                selectedStressMarks.forEach(mark => (mark.selected = false));
            }
        }

        currentMark.selected = !currentMark.selected;
        this.render();
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

            if (stressReduction.from !== currentDamageLabel) return;

            stressReduction.selected = true;
            this.render();
        }
    }

    static async takeDamage() {
        const { selectedArmorMarks, selectedStressMarks, stressReductions, currentDamage } = this.getDamageInfo();
        const armorSpent = selectedArmorMarks.length + selectedStressMarks.length;
        const stressSpent = selectedStressMarks.length + stressReductions.reduce((acc, red) => acc + red.cost, 0);

        this.resolve({ modifiedDamage: currentDamage, armorSpent, stressSpent });
        await this.close(true);
    }

    async close(fromSave) {
        if (!fromSave) {
            this.resolve();
        }

        await super.close({});
    }

    static async armorStackQuery({ actorId, damage, type }) {
        return new Promise(async (resolve, reject) => {
            const actor = await fromUuid(actorId);
            if (!actor || !actor?.isOwner) reject();
            new DamageReductionDialog(resolve, reject, actor, damage, type).render({ force: true });
        });
    }
}
