import DHNPCSettings from '../../applications/sheets-configs/npc-settings.mjs';
import BaseDataActor from './base.mjs';

export default class DhpNPC extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.NPC'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.npc',
            type: 'npc',
            settingSheet: DHNPCSettings,
            hasResistances: false,
            hasAttribution: true
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            difficulty: new fields.NumberField({
                nullable: true,
                initial: null,
                integer: true,
                label: 'DAGGERHEART.GENERAL.difficulty'
            }),
            description: new fields.HTMLField({ label: 'DAGGERHEART.GENERAL.description' }),
            motives: new fields.StringField(),
            notes: new fields.HTMLField()
        };
    }

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/drama-masks.svg';

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }

    isItemValid(source) {
        return super.isItemValid(source) || source.type === 'feature';
    }
}
