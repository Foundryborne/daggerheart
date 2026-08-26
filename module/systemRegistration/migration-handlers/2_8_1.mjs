import { MigrationHandlerBase } from './base.mjs';

/** Replace in world actors and items that still have their original descriptions with their new ones */
export class Migration_2_8_1 extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.8.1';

    async updateItemSource(item) {
        if (!['ancestry'].includes(item.type)) return;

        const originalDescription = PREVIOUS_DESCRIPTIONS[item._stats?.compendiumSource];
        if (!originalDescription) return;
        const testDescription = this.#normalizeDescription(item.system.description);
        if (testDescription === this.#normalizeDescription(originalDescription)) {
            const updatedItem = await fromUuid(item._stats.compendiumSource);
            if (updatedItem) {
                item.system.description = updatedItem.system.description;
                item.system.loreReference ??= updatedItem.system.loreReference;
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
    // clank
    'Compendium.daggerheart.ancestries.Item.ed8BoLR4SHOpeV00': `<p>Clanks are sentient mechanical beings built from a variety of materials, including metal, wood, and stone. They can resemble humanoids, animals, or even inanimate objects. Like organic beings, their bodies come in a wide array of sizes. Because of their bespoke construction, many clanks have highly specialized physical configurations. Examples include clawed hands for grasping, wheels for movement, or built-in weaponry.</p>
<p>Many clanks embrace body modifications for style as well as function, and members of other ancestries often turn to clank artisans to construct customized mobility aids and physical adornments. Other ancestries can create clanks, even using their own physical characteristics as inspiration, but it's also common for clanks to build one another. A clank's lifespan extends as long as they're able to acquire or craft new parts, making their physical form effectively immortal. That said, their minds are subject to the effects of time, and deteriorate as the magic that powers them loses potency.</p>`,
    // drakona
    'Compendium.daggerheart.ancestries.Item.VLeOEqkLS0RbF0tB': `<p>Drakona resemble wingless dragons in humanoid form and possess a powerful elemental breath. All drakona have thick scales that provide excellent natural armor against both attacks and the forces of nature. They are large in size, ranging from 5 feet to 7 feet on average, with long sharp teeth. New teeth grow throughout a Drakona's approximately 350-year lifespan, so they are never in danger of permanently losing an incisor. Unlike their dragon ancestors, drakona don't have wings and can't fly without magical aid. Members of this ancestry pass down the element of their breath through generations, though in rare cases, a drakona's elemental power will differ from the rest of their family's.</p>`
}