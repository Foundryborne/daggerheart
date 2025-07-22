export default async function DhEffectEnricher(match, _options) {
    const effect = await foundry.utils.fromUuid(match[1]);
    if (!effect) return match[0];

    const dualityElement = document.createElement('span');
    dualityElement.innerHTML = `
        <a class="flexrow enriched-effect" 
            data-link
            draggable="true"
            data-uuid="${match[1]}"
            data-tooltip="${game.i18n.localize('DAGGERHEART.UI.Tooltip.dragApplyEffect')}"
        >
            <img src="icons/svg/aura.svg" style="width: 24px;" />
            <span>${effect.name}</span>
        </a>
    `;

    return dualityElement;
}
