import { damageKeyToNumber, getDamageLabel } from '../helpers/utils.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageReductionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve, reject, actor, damage) {
        super({});

        this.resolve = resolve;
        this.reject = reject;
        this.actor = actor;
        this.damage = damage;

        const maxUseable = actor.system.armorScore - actor.system.armor.system.marks.value;
        this.availableArmorMarks = {
            max: Math.min(
                maxUseable,
                actor.system.rules.maxArmorMarked.total + (actor.system.rules.maxArmorMarked.stressExtra ?? 0)
            ),
            stressIndex: actor.system.rules.maxArmorMarked.total,
            selected: 0
        };

        this.availableStressReductions = Object.keys(actor.system.rules.stressDamageReduction).reduce((acc, key) => {
            const dr = actor.system.rules.stressDamageReduction[key];
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
        }, null);
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.DamageReduction.Title');
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
            template: 'systems/daggerheart/templates/views/damageReduction.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    get title() {
        return `Damage Options`;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.armorScore = this.actor.system.armorScore;
        context.armorMarks = this.actor.system.armor.system.marks.value + this.availableArmorMarks.selected;

        const selectedStressReductions = Object.values(this.availableStressReductions).filter(red => red.selected);
        const stressReductionStress = this.availableStressReductions
            ? selectedStressReductions.reduce((acc, red) => acc + red.cost, 0)
            : 0;
        context.stress =
            this.availableArmorMarks.stressIndex || this.availableStressReductions
                ? {
                      value:
                          this.actor.system.resources.stress.value +
                          (Math.max(this.availableArmorMarks.selected - this.availableArmorMarks.stressIndex, 0) +
                              stressReductionStress),
                      maxTotal: this.actor.system.resources.stress.maxTotal
                  }
                : null;

        context.availableArmorMarks = this.availableArmorMarks;
        context.availableStressReductions = this.availableStressReductions;

        context.damage = getDamageLabel(this.damage);
        context.reducedDamage =
            this.availableArmorMarks.selected > 0 || selectedStressReductions.length > 0
                ? getDamageLabel(this.damage - this.availableArmorMarks.selected - selectedStressReductions.length)
                : null;
        context.currentDamage = context.reducedDamage ?? context.damage;

        return context;
    }

    static updateData(event, _, formData) {
        const form = foundry.utils.expandObject(formData.object);
        this.render(true);
    }

    static setMarks(_, target) {
        const index = Number(target.dataset.index);
        const isDecreasing = index < this.availableArmorMarks.selected;
        if (!isDecreasing && this.damage - this.availableArmorMarks.selected === 0) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.DamageReduction.Notifications.DamageAlreadyNone'));
            return;
        }

        if (isDecreasing) {
            const selectedStressReductions = Object.values(this.availableStressReductions).filter(red => red.selected);
            const reducedDamage =
                this.availableArmorMarks.selected > 0 || selectedStressReductions.length > 0
                    ? getDamageLabel(this.damage - this.availableArmorMarks.selected - selectedStressReductions.length)
                    : null;
            const currentDamage = reducedDamage ?? getDamageLabel(this.damage);
            for (let reduction of selectedStressReductions) {
                if (reduction.selected && reduction.to === currentDamage) {
                    reduction.selected = false;
                }
            }
        }

        this.availableArmorMarks.selected = isDecreasing ? index : index + 1;
        this.render();
    }

    static useStressReduction(_, target) {
        const damageValue = Number(target.dataset.reduction);
        const stressReduction = this.availableStressReductions[damageValue];
        if (stressReduction.selected) {
            stressReduction.selected = false;
            this.render();
        } else {
            const selectedStressReductions = Object.values(this.availableStressReductions).filter(red => red.selected);
            const reducedDamage =
                this.availableArmorMarks.selected > 0 || selectedStressReductions.length > 0
                    ? getDamageLabel(this.damage - this.availableArmorMarks.selected - selectedStressReductions.length)
                    : null;
            const currentDamage = reducedDamage ?? getDamageLabel(this.damage);

            if (stressReduction.from !== currentDamage) return;

            stressReduction.selected = true;
            this.render();
        }
    }

    static async takeDamage() {
        const armorSpent = this.availableArmorMarks.selected;
        const modifiedDamage = this.damage - armorSpent;

        this.resolve({ modifiedDamage, armorSpent });
        await this.close(true);
    }

    async close(fromSave) {
        if (!fromSave) {
            this.reject();
        }

        await super.close({});
    }
}
