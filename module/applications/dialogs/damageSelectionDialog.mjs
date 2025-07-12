const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(rollString, bonusDamage, resolve, hope = 0) {
        super({});

        this.data = {
            rollString,
            bonusDamage: bonusDamage.reduce((acc, x) => {
                if (x.appliesOn === CONFIG.DH.EFFECTS.applyLocations.damageRoll.id) {
                    acc.push({
                        ...x,
                        hopeUses: 0
                    });
                }

                return acc;
            }, []),
            hope
        };
        this.resolve = resolve;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'damage-selection'],
        position: {
            width: 400,
            height: 'auto'
        },
        actions: {
            decreaseHopeUse: this.decreaseHopeUse,
            increaseHopeUse: this.increaseHopeUse,
            rollDamage: this.rollDamage
        },
        form: {
            handler: this.updateSelection,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    /** @override */
    static PARTS = {
        damageSelection: {
            id: 'damageSelection',
            template: 'systems/daggerheart/templates/dialogs/dice-roll/damageSelection.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    get title() {
        return `Damage Options`;
    }

    async _prepareContext(_options) {
        return {
            rollString: this.getRollString(),
            bonusDamage: this.data.bonusDamage,
            hope: this.data.hope + 1,
            hopeUsed: this.getHopeUsed()
        };
    }

    static updateSelection(event, _, formData) {
        const { bonusDamage, ...rest } = foundry.utils.expandObject(formData.object);

        for (var index in bonusDamage) {
            this.data.bonusDamage[index].initiallySelected = bonusDamage[index].initiallySelected;
            if (bonusDamage[index].hopeUses) {
                const value = Number.parseInt(bonusDamage[index].hopeUses);
                if (!Number.isNaN(value)) this.data.bonusDamage[index].hopeUses = value;
            }
        }

        this.data = foundry.utils.mergeObject(this.data, rest);
        this.render(true);
    }

    getRollString() {
        return this.data.rollString.concat(
            this.data.bonusDamage.reduce((acc, x) => {
                if (x.initiallySelected) {
                    const nr = 1 + x.hopeUses;
                    const baseDamage = x.value;
                    return acc.concat(` + ${nr}${baseDamage}`);
                }

                return acc;
            }, '')
        );
    }

    getHopeUsed() {
        return this.data.bonusDamage.reduce((acc, x) => acc + x.hopeUses, 0);
    }

    static decreaseHopeUse(_, button) {
        const index = Number.parseInt(button.dataset.index);
        if (this.data.bonusDamage[index].hopeUses - 1 >= 0) {
            this.data.bonusDamage[index].hopeUses -= 1;
            this.render(true);
        }
    }

    static increaseHopeUse(_, button) {
        const index = Number.parseInt(button.dataset.index);
        if (this.data.bonusDamage[index].hopeUses <= this.data.hope + 1) {
            this.data.bonusDamage[index].hopeUses += 1;
            this.render(true);
        }
    }

    static rollDamage(event) {
        event.preventDefault();

        this.resolve({
            rollString: this.getRollString(),
            bonusDamage: this.data.bonusDamage,
            hopeUsed: this.getHopeUsed()
        });
        this.close();
    }
}
