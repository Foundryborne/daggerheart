import DHDamageAction from './damageAction.mjs';

export default class DHAttackAction extends DHDamageAction {
    static extraSchemas = [...super.extraSchemas, 'roll', 'save'];

    static getRollType(parent) {
        return parent.parent.type === 'weapon' ? 'attack' : 'spellcast';
    }

    prepareData() {
        super.prepareData();
        if (!!this.item?.system?.attack) {
            if (this.damage.includeBase) {
                const baseDamage = this.getParentHitPointDamage();
                if (baseDamage) {
                    if (!this.damage.main) {
                        this.damage.main = baseDamage;
                    } else {
                        for (const type of baseDamage.type) this.damage.main.type.add(type);

                        this.damage.main.value.custom = {
                            enabled: true,
                            formula: `${baseDamage.value.getFormula()} + ${this.damage.main.value.getFormula()}`
                        };
                    }
                }
            }
            
            if (this.roll.useDefault) {
                this.roll.trait = this.item.system.attack.roll.trait;
                this.roll.type = 'attack';
            }
        }
    }

    getParentHitPointDamage() {
        return this.item?.system?.attack.damage.main;
    }

    get damageFormula() {
        const hitPointsPart = this.damage.main;
        if (!hitPointsPart) return '0';

        return hitPointsPart.value.getFormula();
    }

    get altDamageFormula() {
        const hitPointsPart = this.damage.main;
        if (!hitPointsPart) return '0';

        return hitPointsPart.valueAlt.getFormula();
    }

    async use(event, options) {
        if (this.item?.system.needsReload) {
            return ui.notifications.error(_loc('DAGGERHEART.UI.Notifications.reloadRequired', { weapon: this.item.name }));
        }

        const result = await super.use(event, options);

        if (result?.message?.system.action?.roll?.type === 'attack') {
            const { updateCountdowns } = game.system.api.applications.ui.DhCountdowns;
            await updateCountdowns(CONFIG.DH.GENERAL.countdownProgressionTypes.characterAttack.id);
        }

        return result;
    }

    async handleReload(options = { awaitRoll: false }) {
        const roll = await new Roll('1d6').evaluate();
        if (game.modules.get('dice-so-nice')?.active) {
            if (options.awaitRoll)
                await game.dice3d.showForRoll(roll, game.user, true);
            else
                game.dice3d.showForRoll(roll, game.user, true);    
        }
        
        const needsReload = roll.total === 1;
        if (needsReload) {
            this.item.update({ 'system.resource.value': 0 });
        }

        return { needsReload, rollValue: roll.total };
    }

    /**
     * Generate a localized label array for this item subtype.
     * @returns {(string | { value: string, icons: string[] })[]} An array of localized strings and damage label objects.
     */
    _getLabels() {
        const labels = [];
        const { roll, range, damage } = this;

        if (roll.trait) labels.push(game.i18n.localize(`DAGGERHEART.CONFIG.Traits.${roll.trait}.short`));
        if (range) labels.push(game.i18n.localize(`DAGGERHEART.CONFIG.Range.${range}.short`));

        const useAltDamage = this.actor?.effects?.find(x => x.type === 'horde')?.active;
        for (const { value, valueAlt, type } of [damage.main, ...damage.resources].filter(d => !!d)) {
            const usedValue = useAltDamage ? valueAlt : value;
            const damageString = Roll.replaceFormulaData(usedValue.getFormula(), this.actor?.getRollData() ?? {});
            const str = damageString
                ? damageString
                : game.i18n.format('DAGGERHEART.GENERAL.missingX', {
                    x: game.i18n.localize('DAGGERHEART.GENERAL.damage')
                });

            const icons = Array.from(type ?? [])
                .map(t => CONFIG.DH.GENERAL.damageTypes[t]?.icon)
                .filter(Boolean);

            if (icons.length === 0) {
                labels.push(str);
            } else {
                labels.push({ value: str, icons });
            }
        }

        return labels;
    }
}
