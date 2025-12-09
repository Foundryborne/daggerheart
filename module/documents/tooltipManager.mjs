import { AdversaryBPPerEncounter, BaseBPPerEncounter } from '../config/encounterConfig.mjs';

export default class DhTooltipManager extends foundry.helpers.interaction.TooltipManager {
    #wide = false;
    #bordered = false;

    async activate(element, options = {}) {
        const { TextEditor } = foundry.applications.ux;

        let html = options.html;
        if (element.dataset.tooltip?.startsWith('#battlepoints#')) {
            this.#wide = true;
            this.#bordered = true;

            html = await this.getBattlepointHTML(element.dataset.combatId);
            options.direction = this._determineItemTooltipDirection(element);
            super.activate(element, { ...options, html: html });

            const lockedTooltip = this.lockTooltip();
            lockedTooltip.querySelectorAll('.battlepoint-toggle-container input').forEach(element => {
                element.addEventListener('input', this.toggleModifier.bind(this));
            });
            return;
        } else {
            this.#wide = false;
            this.#bordered = false;
        }

        if (element.dataset.tooltip === '#effect-display#') {
            this.#bordered = true;
            let effect = {};
            if (element.dataset.uuid) {
                const effectData = (await foundry.utils.fromUuid(element.dataset.uuid)).toObject();
                effect = {
                    ...effectData,
                    name: game.i18n.localize(effectData.name),
                    description: game.i18n.localize(effectData.description ?? effectData.parent.system.description)
                };
            } else {
                const conditions = CONFIG.DH.GENERAL.conditions();
                const condition = conditions[element.dataset.condition];
                effect = {
                    ...condition,
                    name: game.i18n.localize(condition.name),
                    description: game.i18n.localize(condition.description),
                    appliedBy: element.dataset.appliedBy,
                    isLockedCondition: true
                };
            }

            html = await foundry.applications.handlebars.renderTemplate(
                `systems/daggerheart/templates/ui/tooltip/effect-display.hbs`,
                {
                    effect
                }
            );

            this.tooltip.innerHTML = html;
            options.direction = this._determineItemTooltipDirection(element);
        } else {
            this.#bordered = false;
        }

        if (element.dataset.tooltip?.startsWith('#item#')) {
            const itemUuid = element.dataset.tooltip.slice(6);
            const item = await foundry.utils.fromUuid(itemUuid);
            if (item) {
                const isAction = item instanceof game.system.api.models.actions.actionsTypes.base;
                const isEffect = item instanceof ActiveEffect;
                await this.enrichText(item, isAction || isEffect);

                const type = isAction ? 'action' : isEffect ? 'effect' : item.type;
                html = await foundry.applications.handlebars.renderTemplate(
                    `systems/daggerheart/templates/ui/tooltip/${type}.hbs`,
                    {
                        item: item,
                        description: item.system?.enrichedDescription ?? item.enrichedDescription,
                        config: CONFIG.DH
                    }
                );

                this.tooltip.innerHTML = html;
                options.direction = this._determineItemTooltipDirection(element);
            }
        } else {
            const attack = element.dataset.tooltip?.startsWith('#attack#');
            if (attack) {
                const actorUuid = element.dataset.tooltip.slice(8);
                const actor = await foundry.utils.fromUuid(actorUuid);
                const attack = actor.system.attack;

                const description = await TextEditor.enrichHTML(attack.description);
                html = await foundry.applications.handlebars.renderTemplate(
                    `systems/daggerheart/templates/ui/tooltip/attack.hbs`,
                    {
                        attack: attack,
                        description: description,
                        parent: actor,
                        config: CONFIG.DH
                    }
                );

                this.tooltip.innerHTML = html;
            }

            const shortRest = element.dataset.tooltip?.startsWith('#shortRest#');
            const longRest = element.dataset.tooltip?.startsWith('#longRest#');
            if (shortRest || longRest) {
                const key = element.dataset.tooltip.slice(shortRest ? 11 : 10);

                const moves = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).restMoves[
                    element.dataset.restType
                ].moves;
                const move = moves[key];
                const description = await TextEditor.enrichHTML(move.description);
                html = await foundry.applications.handlebars.renderTemplate(
                    `systems/daggerheart/templates/ui/tooltip/downtime.hbs`,
                    {
                        move: move,
                        description: description
                    }
                );

                this.tooltip.innerHTML = html;
                options.direction = this._determineItemTooltipDirection(
                    element,
                    this.constructor.TOOLTIP_DIRECTIONS.RIGHT
                );
            }

            const isAdvantage = element.dataset.tooltip?.startsWith('#advantage#');
            const isDisadvantage = element.dataset.tooltip?.startsWith('#disadvantage#');
            if (isAdvantage || isDisadvantage) {
                const actorUuid = element.dataset.tooltip.slice(isAdvantage ? 11 : 14);
                const actor = await foundry.utils.fromUuid(actorUuid);

                if (actor) {
                    html = await foundry.applications.handlebars.renderTemplate(
                        `systems/daggerheart/templates/ui/tooltip/advantage.hbs`,
                        {
                            sources: isAdvantage ? actor.system.advantageSources : actor.system.disadvantageSources
                        }
                    );

                    this.tooltip.innerHTML = html;
                }
            }

            const deathMove = element.dataset.tooltip?.startsWith('#deathMove#');
            if (deathMove) {
                const name = element.dataset.deathName;
                const img = element.dataset.deathImg;
                const description = element.dataset.deathDescription;

                html = await foundry.applications.handlebars.renderTemplate(
                    `systems/daggerheart/templates/ui/tooltip/death-move.hbs`,
                    {
                        move: { name: name, img: img, description: description }
                    }
                );

                this.tooltip.innerHTML = html;
                options.direction = this._determineItemTooltipDirection(
                    element,
                    this.constructor.TOOLTIP_DIRECTIONS.RIGHT
                );
            }
        }

        super.activate(element, { ...options, html: html });
    }

    _determineItemTooltipDirection(element, prefered = this.constructor.TOOLTIP_DIRECTIONS.LEFT) {
        const pos = element.getBoundingClientRect();
        const dirs = this.constructor.TOOLTIP_DIRECTIONS;
        switch (prefered) {
            case this.constructor.TOOLTIP_DIRECTIONS.LEFT:
                return dirs[
                    pos.x - this.tooltip.offsetWidth < 0
                        ? this.constructor.TOOLTIP_DIRECTIONS.DOWN
                        : this.constructor.TOOLTIP_DIRECTIONS.LEFT
                ];
            case this.constructor.TOOLTIP_DIRECTIONS.UP:
                return dirs[
                    pos.y - this.tooltip.offsetHeight < 0
                        ? this.constructor.TOOLTIP_DIRECTIONS.RIGHT
                        : this.constructor.TOOLTIP_DIRECTIONS.UP
                ];
            case this.constructor.TOOLTIP_DIRECTIONS.RIGHT:
                return dirs[
                    pos.x + this.tooltip.offsetWidth > document.body.clientWidth
                        ? this.constructor.TOOLTIP_DIRECTIONS.DOWN
                        : this.constructor.TOOLTIP_DIRECTIONS.RIGHT
                ];
            case this.constructor.TOOLTIP_DIRECTIONS.DOWN:
                return dirs[
                    pos.y + this.tooltip.offsetHeight > document.body.clientHeight
                        ? this.constructor.TOOLTIP_DIRECTIONS.LEFT
                        : this.constructor.TOOLTIP_DIRECTIONS.DOWN
                ];
        }
    }

    async enrichText(item, flatStructure) {
        const { TextEditor } = foundry.applications.ux;
        const enrichPaths = [
            { path: flatStructure ? '' : 'system', name: 'description' },
            { path: 'system', name: 'features' },
            { path: 'system', name: 'actions' },
            { path: 'system', name: 'customActions' }
        ];

        for (let data of enrichPaths) {
            const basePath = `${data.path ? `${data.path}.` : ''}${data.name}`;
            const pathValue = foundry.utils.getProperty(item, basePath);
            if (!pathValue) continue;

            if (Array.isArray(pathValue) || pathValue.size) {
                for (const [index, itemValue] of pathValue.entries()) {
                    const itemIsAction = itemValue instanceof game.system.api.models.actions.actionsTypes.base;
                    const value = itemIsAction || !itemValue?.item ? itemValue : itemValue.item;
                    const enrichedValue = await TextEditor.enrichHTML(value.system?.description ?? value.description);
                    if (itemIsAction) value.enrichedDescription = enrichedValue;
                    else foundry.utils.setProperty(item, `${basePath}.${index}.enrichedDescription`, enrichedValue);
                }
            } else {
                const enrichedValue = await TextEditor.enrichHTML(pathValue);
                foundry.utils.setProperty(
                    item,
                    `${data.path ? `${data.path}.` : ''}enriched${data.name.capitalize()}`,
                    enrichedValue
                );
            }
        }
    }

    /**@inheritdoc */
    _setStyle(position = {}) {
        super._setStyle(position);

        if (this.#wide) {
            this.tooltip.classList.add('wide');
        }

        if (this.#bordered) {
            this.tooltip.classList.add('bordered-tooltip');
        }
    }

    /**@inheritdoc */
    lockTooltip() {
        const clone = super.lockTooltip();
        if (this.#wide) clone.classList.add('wide');
        if (this.#bordered) clone.classList.add('bordered-tooltip');

        return clone;
    }

    /** Get HTML for Battlepoints tooltip */
    async getBattlepointHTML(combatId) {
        const combat = game.combats.get(combatId);
        const adversaries =
            combat.turns?.filter(x => x.actor?.isNPC)?.map(x => ({ ...x.actor, type: x.actor.system.type })) ?? [];
        const characters = combat.turns?.filter(x => !x.isNPC) ?? [];

        const nrCharacters = characters.length;
        const currentBP = AdversaryBPPerEncounter(adversaries, characters);
        const maxBP = combat.system.extendedBattleToggles.reduce(
            (acc, toggle) => acc + toggle.category,
            BaseBPPerEncounter(nrCharacters)
        );

        const categories = combat.combatants.reduce((acc, combatant) => {
            if (combatant.actor.type === 'adversary') {
                const keyData = Object.keys(acc).reduce((identifiers, categoryKey) => {
                    if (identifiers) return identifiers;
                    const category = acc[categoryKey];
                    const groupingIndex = category.findIndex(grouping =>
                        grouping.types.includes(combatant.actor.system.type)
                    );
                    if (groupingIndex !== -1) identifiers = { categoryKey, groupingIndex };

                    return identifiers;
                }, null);
                if (keyData) {
                    const { categoryKey, groupingIndex } = keyData;
                    const grouping = acc[categoryKey][groupingIndex];
                    const partyAmount = CONFIG.DH.ACTOR.adversaryTypes[combatant.actor.system.type].partyAmountPerBP;
                    grouping.individuals = (grouping.individuals ?? 0) + 1;

                    const currentNr = grouping.nr ?? 0;
                    grouping.nr = partyAmount ? Math.ceil(grouping.individuals / (nrCharacters ?? 0)) : currentNr + 1;
                }
            }

            return acc;
        }, foundry.utils.deepClone(CONFIG.DH.ENCOUNTER.adversaryTypeCostBrackets));

        const extendedBattleToggles = combat.system.extendedBattleToggles;
        const toggles = Object.keys(CONFIG.DH.ENCOUNTER.BPModifiers)
            .reduce((acc, categoryKey) => {
                const category = CONFIG.DH.ENCOUNTER.BPModifiers[categoryKey];
                acc.push(
                    ...Object.keys(category).reduce((acc, toggleKey) => {
                        const grouping = category[toggleKey];
                        acc.push({
                            ...grouping,
                            categoryKey: Number(categoryKey),
                            toggleKey,
                            checked: extendedBattleToggles.find(
                                x => x.category == categoryKey && x.grouping === toggleKey
                            ),
                            disabled: grouping.automatic
                        });

                        return acc;
                    }, [])
                );
                return acc;
            }, [])
            .sort((a, b) => {
                if (a.categoryKey < b.categoryKey) return -1;
                if (a.categoryKey > b.categoryKey) return 1;
                else return a.toggleKey.localeCompare(b.toggleKey);
            });

        return await foundry.applications.handlebars.renderTemplate(
            `systems/daggerheart/templates/ui/tooltip/battlepoints.hbs`,
            {
                combatId: combat.id,
                nrCharacters,
                currentBP,
                maxBP,
                categories,
                toggles
            }
        );
    }

    /** Enable/disable a BP modifier */
    async toggleModifier(event) {
        const { combatId, category, grouping } = event.target.dataset;
        const combat = game.combats.get(combatId);
        await combat.update({
            system: {
                battleToggles: combat.system.battleToggles.some(x => x.category == category && x.grouping === grouping)
                    ? combat.system.battleToggles.filter(x => x.category != category && x.grouping !== grouping)
                    : [...combat.system.battleToggles, { category: Number(category), grouping }]
            }
        });

        await combat.toggleModifierEffects(
            event.target.checked,
            combat.combatants.filter(x => x.actor.type === 'adversary').map(x => x.actor),
            category,
            grouping
        );

        this.tooltip.innerHTML = await this.getBattlepointHTML(combatId);
        const lockedTooltip = this.lockTooltip();
        lockedTooltip.querySelectorAll('.battlepoint-toggle-container input').forEach(element => {
            element.addEventListener('input', this.toggleModifier.bind(this));
        });
    }
}
