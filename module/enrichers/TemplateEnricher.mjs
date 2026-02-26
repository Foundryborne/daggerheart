import { parseInlineParams } from './parser.mjs';

export default function DhTemplateEnricher(match, _options) {
    const params = parseInlineParams(match[1]);
    const { type, angle = CONFIG.MeasuredTemplate.defaults.angle, inline = false } = params;
    const direction = Number(params.direction) || 0;
    params.range = params.range?.toLowerCase();
    const range =
        params.range && Number.isNaN(Number(params.range))
            ? Object.values(CONFIG.DH.GENERAL.templateRanges).find(
                  x => x.id.toLowerCase() === params.range || x.short === params.range
              )?.id
            : params.range;

    if (!Object.values(CONFIG.DH.GENERAL.templateTypes).find(x => x === type) || !range) return match[0];

    const label = game.i18n.localize(`DAGGERHEART.CONFIG.TemplateTypes.${type}`);
    const rangeDisplay = Number.isNaN(Number(range))
        ? game.i18n.localize(`DAGGERHEART.CONFIG.Range.${range}.name`)
        : range;

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
        baseDistance = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules).rangeMeasurement[
            range
        ];
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
