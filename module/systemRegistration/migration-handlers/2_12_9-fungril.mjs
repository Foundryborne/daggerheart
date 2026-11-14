import { MigrationHandlerBase } from './base.mjs';

/** 
 * Fungril had the galapa description
 */
export class Migration_2_12_9_Fungril extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.12.9';

    async updateItemSource(item) {
        if (item.type !== 'ancestry') return;

        const originalDescription = PREVIOUS_DESCRIPTIONS[item._stats?.compendiumSource];
        if (!originalDescription) return;
        const testDescription = this.#normalizeDescription(item.system.description);
        if (testDescription === this.#normalizeDescription(originalDescription)) {
            const updatedItem = await fromUuid(item._stats.compendiumSource);
            if (updatedItem) {
                const updates = { description: updatedItem.system.description };
                if (!item.system.loreReference) updates.loreReference = updatedItem.system.loreReference;
                return {
                    _id: item._id,
                    system: updates
                }
            }
        }
    }

    /** Recently, certain quirks were removed from data. We normalize the input string so that we can treat it as the same item */
    #normalizeDescription(description) {
        if (!description) return null;
        return description
            .replaceAll(' class="green Body-Styles_Body"', '')
            .replaceAll('’', '\'')
            .replaceAll('“', '"')
            .replaceAll('”', '"')
            .replaceAll('−', '-')
            .replaceAll('<p></p>', '');
    }
}

const PREVIOUS_DESCRIPTIONS = {
    // fungril
    'Compendium.daggerheart.ancestries.Item.J1hX7nBBc5jQiHli': `<p>Galapa resemble anthropomorphic turtles with large, domed shells into which they can retract.</p>`
}