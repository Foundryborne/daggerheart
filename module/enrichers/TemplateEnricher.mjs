export default function DhTemplateEnricher(match, _options) {
    const parts = match[1].split('|').map(x => x.trim());

    let type = null,
        range = null;

    parts.forEach(part => {
        const split = part.split(':').map(x => x.toLowerCase().trim());
        if (split.length === 2) {
            switch (split[0]) {
                case 'type':
                    const matchedType = Object.values(CONFIG.DH.GENERAL.templateTypes).find(
                        x => x.toLowerCase() === split[1]
                    );
                    type = matchedType;
                    break;
                case 'range':
                    const matchedRange = Object.values(CONFIG.DH.GENERAL.templateRanges).find(
                        x => x.id.toLowerCase() === split[1] || x.short === split[1]
                    );
                    range = matchedRange?.id;
                    break;
            }
        }
    });

    if (!type || !range) return match[0];

    const label = game.i18n.localize(`DAGGERHEART.CONFIG.TemplateTypes.${type}`);

    const templateElement = document.createElement('span');
    templateElement.innerHTML = `
        <button class="measured-template-button" data-type="${type}" data-range="${range}">
            ${label} - ${game.i18n.localize(`DAGGERHEART.CONFIG.Range.${range}.name`)}
        </button>
    `;

    return templateElement;
}

export const renderMeasuredTemplate = async event => {
    const button = event.currentTarget,
        type = button.dataset.type,
        range = button.dataset.range;

    if (!type || !range || !game.canvas.scene) return;

    const usedType = type === 'inFront' ? 'cone' : type === 'emanation' ? 'circle' : type;
    const angle =
        type === CONST.MEASURED_TEMPLATE_TYPES.CONE
            ? CONFIG.MeasuredTemplate.defaults.angle
            : type === CONFIG.DH.GENERAL.templateTypes.INFRONT
              ? '180'
              : undefined;

    const baseDistance = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules).rangeMeasurement[
        range
    ];
    const distance = type === CONFIG.DH.GENERAL.templateTypes.EMANATION ? baseDistance + 2.5 : baseDistance;

    const { width, height } = game.canvas.scene.dimensions;
    const data = {
        x: width / 2,
        y: height / 2,
        t: usedType,
        distance: distance,
        width: type === CONST.MEASURED_TEMPLATE_TYPES.RAY ? 5 : undefined,
        angle: angle
    };

    CONFIG.ux.TemplateManager.createPreview(data);
};
