export default class DhTooltipManager extends foundry.helpers.interaction.TooltipManager {
    async activate(element, options = {}) {
        const { TextEditor } = foundry.applications.ux;

        let html = options.html;
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
                const downtimeOptions = shortRest
                    ? CONFIG.DH.GENERAL.defaultRestOptions.shortRest()
                    : CONFIG.DH.GENERAL.defaultRestOptions.longRest();

                const move = downtimeOptions[key];
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
}
