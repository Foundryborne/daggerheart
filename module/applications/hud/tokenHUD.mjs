import { shuffleArray } from '../../helpers/utils.mjs';

export default class DHTokenHUD extends foundry.applications.hud.TokenHUD {
    static DEFAULT_OPTIONS = {
        classes: ['daggerheart'],
        actions: {
            combat: DHTokenHUD.#onToggleCombat,
            togglePartyTokens: DHTokenHUD.#togglePartyTokens
        }
    };

    /** @override */
    static PARTS = {
        hud: {
            root: true,
            template: 'systems/daggerheart/templates/hud/tokenHUD.hbs'
        }
    };

    static #nonCombatTypes = ['environment', 'companion', 'party'];

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.partyOnCanvas =
            this.actor.type === 'party' &&
            this.actor.system.partyMembers.some(member => member.getActiveTokens().length > 0);
        context.icons.toggleParty = 'systems/daggerheart/assets/icons/arrow-dunk.png';
        context.actorType = this.actor.type;
        context.usesEffects = this.actor.type !== 'party';
        context.canToggleCombat = DHTokenHUD.#nonCombatTypes.includes(this.actor.type)
            ? false
            : context.canToggleCombat;

        context.systemStatusEffects = Object.keys(context.statusEffects).reduce((acc, key) => {
            const effect = context.statusEffects[key];
            if (effect.systemEffect) {
                const disabled = !effect.isActive && this.actor.system.rules?.conditionImmunities?.[key];
                acc[key] = { ...effect, disabled };
            }

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

    static async #togglePartyTokens(_, button) {
        const icon = button.querySelector('img');
        icon.classList.toggle('flipped');
        button.dataset.tooltip = game.i18n.localize(
            icon.classList.contains('flipped')
                ? 'DAGGERHEART.APPLICATIONS.HUD.tokenHUD.retrievePartyTokens'
                : 'DAGGERHEART.APPLICATIONS.HUD.tokenHUD.depositPartyTokens'
        );

        const animationDuration = 500;
        const activeTokens = this.actor.system.partyMembers.flatMap(member => member.getActiveTokens());
        const { x: actorX, y: actorY } = this.document;
        if (activeTokens.length > 0) {
            for (let token of activeTokens) {
                await token.document.update(
                    { x: actorX, y: actorY, alpha: 0 },
                    { animation: { duration: animationDuration } }
                );
                setTimeout(() => token.document.delete(), animationDuration);
            }
        } else {
            const activeScene = game.scenes.find(x => x.id === game.user.viewedScene);
            const partyTokenData = [];
            for (let member of this.actor.system.partyMembers) {
                const data = await member.getTokenDocument();
                partyTokenData.push(data.toObject());
            }
            const newTokens = await activeScene.createEmbeddedDocuments(
                'Token',
                partyTokenData.map(tokenData => ({
                    ...tokenData,
                    alpha: 0,
                    x: actorX,
                    y: actorY
                }))
            );

            const { sizeX, sizeY } = activeScene.grid;
            const nrRandomPositions = Math.ceil(newTokens.length / 8) * 8;
            /* This is an overcomplicated mess, but I'm stupid */
            const positions = shuffleArray(
                [...Array(nrRandomPositions).keys()].map((_, index) => {
                    const nonZeroIndex = index + 1;
                    const indexFloor = Math.floor(index / 8);
                    const distanceCoefficient = indexFloor + 1;
                    const side = 3 + indexFloor * 2;
                    const sideMiddle = Math.ceil(side / 2);
                    const inbetween = 1 + indexFloor * 2;
                    const inbetweenMiddle = Math.ceil(inbetween / 2);

                    if (index < side) {
                        const distance =
                            nonZeroIndex === sideMiddle
                                ? 0
                                : nonZeroIndex < sideMiddle
                                  ? -nonZeroIndex
                                  : nonZeroIndex - sideMiddle;
                        return { x: actorX - sizeX * distance, y: actorY - sizeY * distanceCoefficient };
                    } else if (index < side + inbetween) {
                        const inbetweenIndex = nonZeroIndex - side;
                        const distance =
                            inbetweenIndex === inbetweenMiddle
                                ? 0
                                : inbetweenIndex < inbetweenMiddle
                                  ? -inbetweenIndex
                                  : inbetweenIndex - inbetweenMiddle;
                        return { x: actorX + sizeX * distanceCoefficient, y: actorY + sizeY * distance };
                    } else if (index < 2 * side + inbetween) {
                        const sideIndex = nonZeroIndex - side - inbetween;
                        const distance =
                            sideIndex === sideMiddle
                                ? 0
                                : sideIndex < sideMiddle
                                  ? sideIndex
                                  : -(sideIndex - sideMiddle);
                        return { x: actorX + sizeX * distance, y: actorY + sizeY * distanceCoefficient };
                    } else {
                        const inbetweenIndex = nonZeroIndex - 2 * side - inbetween;
                        const distance =
                            inbetweenIndex === inbetweenMiddle
                                ? 0
                                : inbetweenIndex < inbetweenMiddle
                                  ? inbetweenIndex
                                  : -(inbetweenIndex - inbetweenMiddle);
                        return { x: actorX - sizeX * distanceCoefficient, y: actorY + sizeY * distance };
                    }
                })
            );

            for (let token of newTokens) {
                const position = positions.pop();
                token.update(
                    { x: position.x, y: position.y, alpha: 1 },
                    { animation: { duration: animationDuration } }
                );
            }
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
        const activeEffects = this.actor?.getActiveEffects() || [];
        for (const effect of activeEffects) {
            for (const statusId of effect.statuses) {
                const status = choices[statusId];
                status.instances = 1 + (status.instances ?? 0);
                status.locked = status.locked || effect.condition || status.instances > 1;
                if (!status) continue;
                if (status._id) {
                    if (status._id !== effect.id) continue;
                }
                status.isActive = true;
                if (effect.getFlag?.('core', 'overlay')) status.isOverlay = true;
            }
        }

        // Flag status CSS class
        for (const status of Object.values(choices)) {
            status.cssClass = [status.isActive ? 'active' : null, status.isOverlay ? 'overlay' : null].filterJoin(' ');
        }
        return choices;
    }
}
