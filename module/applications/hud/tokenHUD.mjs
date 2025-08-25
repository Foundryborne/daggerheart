export default class DHTokenHUD extends foundry.applications.hud.TokenHUD {
    static DEFAULT_OPTIONS = {
        classes: ['daggerheart'],
        actions: {
            combat: DHTokenHUD.#onToggleCombat
        }
    };

    /** @override */
    static PARTS = {
        hud: {
            root: true,
            template: 'systems/daggerheart/templates/hud/tokenHUD.hbs'
        }
    };

    static #nonCombatTypes = ['environment', 'companion'];

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.canToggleCombat = DHTokenHUD.#nonCombatTypes.includes(this.actor.type)
            ? false
            : context.canToggleCombat;
        context.systemStatusEffects = Object.keys(context.statusEffects).reduce((acc, key) => {
            const effect = context.statusEffects[key];
            if (effect.systemEffect) acc[key] = effect;

            return acc;
        }, {});

        const useGeneric = game.settings.get(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.appearance
        ).showGenericStatusEffects;
        context.genericStatusEffects = useGeneric
            ? Object.keys(context.statusEffects).reduce((acc, key) => {
                  const effect = context.statusEffects[key];
                  if (!effect.systemEffect) acc[key] = effect;

                  return acc;
              }, {})
            : null;

        return context;
    }

    static async #onToggleCombat() {
        const tokens = canvas.tokens.controlled
            .filter(t => !t.actor || !DHTokenHUD.#nonCombatTypes.includes(t.actor.type))
            .map(t => t.document);
        if (!this.object.controlled) tokens.push(this.document);

        try {
            if (this.document.inCombat) await TokenDocument.implementation.deleteCombatants(tokens);
            else await TokenDocument.implementation.createCombatants(tokens);
        } catch (err) {
            ui.notifications.warn(err.message);
        }
    }

    _getStatusEffectChoices() {
        // Include all HUD-enabled status effects
        const choices = {};
        for (const status of CONFIG.statusEffects) {
            if (
                status.hud === false ||
                (foundry.utils.getType(status.hud) === 'Object' &&
                    status.hud.actorTypes?.includes(this.document.actor.type) === false)
            ) {
                continue;
            }
            choices[status.id] = {
                _id: status._id,
                id: status.id,
                systemEffect: status.systemEffect,
                title: game.i18n.localize(status.name ?? /** @deprecated since v12 */ status.label),
                src: status.img ?? /** @deprecated since v12 */ status.icon,
                isActive: false,
                isOverlay: false
            };
        }

        // Update the status of effects which are active for the token actor
        const activeEffects = this.actor?.effects || [];
        for (const effect of activeEffects) {
            for (const statusId of effect.statuses) {
                const status = choices[statusId];
                if (!status) continue;
                if (status._id) {
                    if (status._id !== effect.id) continue;
                }
                status.isActive = true;
                if (effect.getFlag('core', 'overlay')) status.isOverlay = true;
            }
        }

        // Flag status CSS class
        for (const status of Object.values(choices)) {
            status.cssClass = [status.isActive ? 'active' : null, status.isOverlay ? 'overlay' : null].filterJoin(' ');
        }
        return choices;
    }
}
