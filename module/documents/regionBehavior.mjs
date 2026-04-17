export default class DhRegionBehavior extends RegionBehavior {
    /**@inheritDoc */
    async _handleRegionEvent(event) {
        if (!(this.system instanceof foundry.data.regionBehaviors.RegionBehaviorType)) return;

        // Optionally prevent event if not applicable
        // Currently only caring about statically registered events
        if (event.name in this.system.constructor.events) {
            if (this.isEventApplicable(event) === false) return; 
            super._handleRegionEvent(event);
        }
    }

    isEventApplicable(event) {
        switch(this.type) {
            case 'applyActiveEffect':
                /* If reworked to an area, we'll probably still have to override the onEnter/onExit methods to filter which effects apply */
                const effects = this.system.effects.map(effect => foundry.utils.fromUuidSync(effect)).filter(x => x);
                const applicableDispositions = effects.first().system.area?.targetDispositions??[];
                if(!applicableDispositions.size) return true;

                return event.data.token.disposition === CONST.TOKEN_DISPOSITIONS.SECRET || 
                    applicableDispositions.has(event.data.token.disposition);
            default: 
                return true;
        }
    } 
}