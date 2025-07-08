export default class DhTooltipManager extends foundry.helpers.interaction.TooltipManager {
    async activate(element, options = {}) {
        let html = options.html;
        if (element.dataset.tooltip?.startsWith('#item#')) {
            const item = await foundry.utils.fromUuid(element.dataset.tooltip.slice(6));
            if (item) {
                html = await foundry.applications.handlebars.renderTemplate(
                    `systems/daggerheart/templates/ui/tooltip/${item.type}.hbs`,
                    item
                );
            }
        }

        super.activate(element, { ...options, html: html });
    }
}
