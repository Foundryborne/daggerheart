import { MigrationHandlerBase } from './base.mjs';

export class Migration_2_13_0_Attribution extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.13.0';
    
    /** @inheritdoc */
    migrateCompendiums = true;

    #REMAP = {
        'Daggerheart SRD': 'Core Rulebook',
        'Daggerheart SRD H&F': 'Daggerheart: Hope & Fear'
    };

    updateItemSource(item) {
        return this.#updateAttributionSource(item);
    }

    updateActorSource(actor) {
        return this.#updateAttributionSource(actor);
    }

    #updateAttributionSource(document) {
        const source = document.system?.attribution?.source;
        const campaignFrame = document.system?.attribution?.campaignFrame;
        const remap = this.#REMAP[source];
        if (!remap) return null;

        return {
            _id: document._id,
            system: {
                attribution: {
                    source: remap,
                    srd: !campaignFrame && document.pack !== `daggerheart-core.campaign-frame-items`
                }
            }
        };
    }
}