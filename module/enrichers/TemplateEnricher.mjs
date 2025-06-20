import { range as configRange } from '../config/generalConfig.mjs';

export default function DhTemplateEnricher(match, _options) {
    const parts = match[1].split('|').map(x => x.trim());

    let type = null,
        range = null;

    parts.forEach(part => {
        const split = part.split(':').map(x => x.toLowerCase().trim());
        if (split.length === 2) {
            switch (split[0]) {
                case 'type':
                    const matchedType = Object.values(CONST.MEASURED_TEMPLATE_TYPES).find(
                        x => x.toLowerCase() === split[1]
                    );
                    type = matchedType;
                    break;
                case 'range':
                    const matchedRange = Object.values(configRange).find(
                        x => x.id.toLowerCase() === split[1] || x.short === split[1]
                    );
                    range = matchedRange?.id;
                    break;
            }
        }
    });

    if (!type || !range) return match[0];

    const templateElement = document.createElement('span');
    templateElement.innerHTML = `
        <button class="measured-template-button" data-type="${type}" data-range="${range}">
            ${game.i18n.localize(`TEMPLATE.TYPES.${type}`)} - ${game.i18n.localize(`DAGGERHEART.Range.${range}.name`)}
        </button>
    `;

    return templateElement;
}

export const renderMeasuredTemplate = async event => {
    const button = event.currentTarget,
        type = button.dataset.type,
        range = button.dataset.range;

    if (!type || !range || !game.canvas.scene) return;

    const distance = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.RangeMeasurement)[range];
    const { width, height } = game.canvas.scene.dimensions;
    canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [
        {
            x: width / 2,
            y: height / 2,
            t: type,
            distance: distance,
            width: type === CONST.MEASURED_TEMPLATE_TYPES.RAY ? 5 : undefined,
            angle: type === CONST.MEASURED_TEMPLATE_TYPES.CONE ? CONFIG.MeasuredTemplate.defaults.angle : undefined
        }
    ]);
};
