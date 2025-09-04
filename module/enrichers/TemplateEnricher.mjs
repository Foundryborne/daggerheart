export default function DhTemplateEnricher(match, _options) {
    const parts = match[1].split('|').map(x => x.trim());

    let type = null,
        range = null,
        angle = CONFIG.MeasuredTemplate.defaults.angle,
        direction = 0,
        inline = false;

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
                    if (Number.isNaN(Number(split[1]))) {
                        const matchedRange = Object.values(CONFIG.DH.GENERAL.templateRanges).find(
                            x => x.id.toLowerCase() === split[1] || x.short === split[1]
                        );
                        range = matchedRange?.id;
                    } else {
                        range = split[1];
                    }
                    break;
                case 'inline':
                    inline = true;
                    break;
                case 'angle':
                    angle = split[1];
                    break;
                case 'direction':
                    direction = split[1];
                    break;
            }
        }
    });

    if (!type || !range) return match[0];

    const label = game.i18n.localize(`DAGGERHEART.CONFIG.TemplateTypes.${type}`);

    const rangeDisplay = Number.isNaN(Number(range)) ? game.i18n.localize(`DAGGERHEART.CONFIG.Range.${range}.name`) : range;

    let angleDisplay = '';
    if (angle != CONFIG.MeasuredTemplate.defaults.angle) {
        angleDisplay = 'angle:' + angle;

    }
    let directionDisplay = '';
    if (direction != 0) {
        directionDisplay = 'direction:' + direction;
    }

    let extraDisplay = '';
    if (angleDisplay != '' && directionDisplay != '') {
        extraDisplay = ' (' + angleDisplay + '|' + directionDisplay + ')';
    } else if (angleDisplay != '') {
        extraDisplay = ' (' + angleDisplay + ')';
    } else if (directionDisplay != '') {
        extraDisplay = ' (' + directionDisplay + ')';
    }

    const templateElement = document.createElement('span');
    templateElement.innerHTML = `
        <button type="button" class="measured-template-button${inline ? ' inline' : ''}" 
            data-type="${type}" data-range="${range}" data-angle="${angle}" data-direction="${direction}">
            ${label} - ${rangeDisplay}${extraDisplay}
        </button>
    `;

    return templateElement;
}

export const renderMeasuredTemplate = async event => {
    const button = event.currentTarget,
        type = button.dataset.type,
        range = button.dataset.range,
        angle = button.dataset.angle,
        direction = button.dataset.direction;

    if (!type || !range || !game.canvas.scene) return;

    const usedType = type === 'inFront' ? 'cone' : type === 'emanation' ? 'circle' : type;
    const usedAngle =
        type === CONST.MEASURED_TEMPLATE_TYPES.CONE
            ? (angle ?? CONFIG.MeasuredTemplate.defaults.angle)
            : type === CONFIG.DH.GENERAL.templateTypes.INFRONT
              ? '180'
              : undefined;

    let baseDistance = range;
    if (Number.isNaN(Number(range))) {
        baseDistance = 
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules).rangeMeasurement[range];
    }
    const distance = type === CONFIG.DH.GENERAL.templateTypes.EMANATION ? baseDistance + 2.5 : baseDistance;

    const { width, height } = game.canvas.scene.dimensions;
    const data = {
        x: width / 2,
        y: height / 2,
        t: usedType,
        distance: distance,
        width: type === CONST.MEASURED_TEMPLATE_TYPES.RAY ? 5 : undefined,
        angle: usedAngle,
        direction: direction
    };

    CONFIG.ux.TemplateManager.createPreview(data);
};
