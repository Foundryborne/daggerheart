import { getDamageLabel } from '../helpers/utils.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageReductionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve, reject, actor, damage) {
        super({});

        this.resolve = resolve;
        this.reject = reject;
        this.actor = actor;
        this.damage = damage;

        this.availableArmorMarks = {
            max: actor.system.rules.maxArmorMarked.total + (actor.system.rules.stressExtra ?? 0),
            maxUseable: actor.system.armorScore - actor.system.armor.system.marks.value,
            stressIndex:
                (actor.system.rules.stressExtra ?? 0) > 0 ? actor.system.rules.maxArmorMarked.total : undefined,
            selected: 0
        };
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
        context.availableArmorMarks = this.availableArmorMarks;

        context.damage = getDamageLabel(this.damage);
        context.reducedDamage =
            this.availableArmorMarks.selected > 0
                ? getDamageLabel(this.damage - this.availableArmorMarks.selected)
                : null;

        return context;
    }

    static updateData(event, _, formData) {
        const form = foundry.utils.expandObject(formData.object);
        this.render(true);
    }

    static setMarks(_, target) {
        const index = Number(target.dataset.index);
        if (index >= this.availableArmorMarks.maxUseable) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.DamageReduction.Notifications.NotEnoughArmor'));
            return;
        }

        const isDecreasing = index < this.availableArmorMarks.selected;
        if (!isDecreasing && this.damage - this.availableArmorMarks.selected === 0) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.DamageReduction.Notifications.DamageAlreadyNone'));
            return;
        }

        this.availableArmorMarks.selected = isDecreasing ? index : index + 1;
        this.render();
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
