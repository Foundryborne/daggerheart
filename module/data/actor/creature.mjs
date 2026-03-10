import { resourceField } from '../fields/actorField.mjs';
import BaseDataActor from './base.mjs';

export default class DhCreature extends BaseDataActor {
    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            resources: new fields.SchemaField({
                ...Object.values(CONFIG.DH.ACTOR[`${this.metadata.type}Resources`]).reduce((acc, resource) => {
                    if (resource.max !== undefined) {
                        acc[resource.id] = resourceField(
                            resource.max,
                            resource.initial,
                            resource.label,
                            resource.maxLabel
                        );
                    } else {
                        acc[resource.id] = new fields.SchemaField(
                            {
                                value: new fields.NumberField({
                                    initial: resource.initial,
                                    min: resource.min,
                                    integer: true,
                                    label: resource.label
                                }),
                                isReversed: new fields.BooleanField({ initial: resource.reverse })
                            },
                            { label: resource.label }
                        );
                    }

                    return acc;
                }, {})
            }),
            advantageSources: new fields.ArrayField(new fields.StringField(), {
                label: 'DAGGERHEART.ACTORS.Character.advantageSources.label',
                hint: 'DAGGERHEART.ACTORS.Character.advantageSources.hint'
            }),
            disadvantageSources: new fields.ArrayField(new fields.StringField(), {
                label: 'DAGGERHEART.ACTORS.Character.disadvantageSources.label',
                hint: 'DAGGERHEART.ACTORS.Character.disadvantageSources.hint'
            })
        };
    }

    get isAutoVulnerableActive() {
        const vulnerableAppliedByOther = this.parent.effects.some(
            x => x.statuses.has('vulnerable') && !x.flags.daggerheart?.autoApplyFlagId
        );
        return !vulnerableAppliedByOther;
    }

    prepareDerivedData() {
        super.prepareDerivedData();
        const resources = CONFIG.DH.ACTOR[`${this.parent.type}Resources`];
        if (resources) {
            for (const [key, value] of Object.entries(this.resources)) {
                value.label = resources[key]?.label;
                value.isReversed = resources[key]?.reverse;
            }
        }
    }

    async _preUpdate(changes, options, userId) {
        const allowed = await super._preUpdate(changes, options, userId);
        if (allowed === false) return;

        const automationSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        if (
            automationSettings.vulnerableAutomation &&
            this.parent.type !== 'companion' &&
            changes.system?.resources?.stress?.value
        ) {
            const { name, description, img, autoApplyFlagId } = CONFIG.DH.GENERAL.conditions().vulnerable;
            const autoEffects = this.parent.effects.filter(
                x => x.flags.daggerheart?.autoApplyFlagId === autoApplyFlagId
            );
            if (changes.system.resources.stress.value >= this.resources.stress.max) {
                if (!autoEffects.length)
                    this.parent.createEmbeddedDocuments('ActiveEffect', [
                        {
                            name: game.i18n.localize(name),
                            description: game.i18n.localize(description),
                            img: img,
                            statuses: ['vulnerable'],
                            flags: { daggerheart: { autoApplyFlagId } }
                        }
                    ]);
            } else if (this.resources.stress.value >= this.resources.stress.max) {
                this.parent.deleteEmbeddedDocuments(
                    'ActiveEffect',
                    autoEffects.map(x => x.id)
                );
            }
        }
    }
}
