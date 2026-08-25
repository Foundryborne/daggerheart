const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * @import { DhCountdown } from "../../data/countdowns.mjs";
 */

/** A dialog for ownership selection */
export class CountdownPermissionsDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    /**
     * Creates a new dialog for ownership selection
     * @param {DhCountdown} countdown
     */
    constructor(countdown) {
        super({});
        this.countdown = countdown;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'dialog', 'dh-style', 'countdown-permissions'],
        window: {
            icon: 'fa-solid fa-users'
        },
        position: {
            width: 450,
            height: 'auto'
        },
        form: { handler: this.updateData }
    };

    static PARTS = {
        selection: {
            template: 'systems/daggerheart/templates/dialogs/countdownPermissions.hbs'
        }
    };

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.CountdownPermissions.title', { name: this.countdown.name });
    }

    getOwnershipData(id) {
        return this.countdown.ownership[id] ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.countdown = this.countdown;
        
        // Get ownership options. becuase of the use of numbers, the base collection is not correctly ordered.
        // So we have to redefine it ourselves in the correct order.
        const levels = CONST.DOCUMENT_OWNERSHIP_LEVELS;
        context.ownershipLevels = [levels.INHERIT, levels.OBSERVER, levels.OWNER].map(value => ({
            value, 
            label: CONFIG.DH.GENERAL.countdownOwnershipLevels[value].label
        }));
        context.ownershipLevels[0].label = this.#getBaseLabel();
        context.defaultOwnershipLevels = [
            { value: true, label: 'DAGGERHEART.APPLICATIONS.CountdownPermissions.HiddenOptions.true' },    
            { value: false, label: 'DAGGERHEART.APPLICATIONS.CountdownPermissions.HiddenOptions.false' }
        ];
        context.ownership = game.users.reduce((acc, user) => {
            if (!user.isGM) {
                acc[user.id] = {
                    ...user,
                    img: user.character?.img ?? 'icons/svg/cowled.svg',
                    ownership: this.getOwnershipData(user.id)
                };
            }

            return acc;
        }, {});

        return context;
    }

    /** @inheritdoc */
    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        const hiddenEl = htmlElement?.querySelector('[name=hidden]');
        hiddenEl?.addEventListener('change', () => {
            for (const option of htmlElement.querySelectorAll('option[value="-1"]')) {
                option.textContent = this.#getBaseLabel(hiddenEl.value !== 'false');
            }
        })
    }

    static async updateData(event, _, formData) {
        const data = foundry.utils.expandObject(formData.object);
        this.close(data);
    }

    async close(data) {
        if (data) {
            this.saveData = data;
        }

        await super.close();
    }

    /**
     * Creates a ownership selection dialog returns the result when resolved
     * @param {DhCountdown} countdown 
     * @returns {Promise<{ ownership: Record<string, number>; hidden: boolean }>}
     */
    static async configure(countdown) {
        return new Promise(resolve => {
            const app = new this(countdown);
            app.addEventListener('close', () => resolve(app.saveData), { once: true });
            app.render({ force: true });
        });
    }

    /** Returns the complete base label for an ownership option */
    #getBaseLabel(hidden = this.countdown.hidden) {
        const base = _loc(`DAGGERHEART.APPLICATIONS.CountdownPermissions.HiddenOptions.${String(Boolean(hidden))}`);
        return _loc('DAGGERHEART.APPLICATIONS.CountdownPermissions.inheritLabeled', { base });
    }
}
