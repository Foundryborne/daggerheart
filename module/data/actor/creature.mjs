import { pickBy } from '../../helpers/functional.mjs';
import { ResourcesField } from '../fields/actorField.mjs';
import BaseDataActor from './base.mjs';

export default class DhCreature extends BaseDataActor {
    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            resources: new ResourcesField(this.metadata.type),
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

    /** 
     * The set of all available optional resources added by features
     * @type {Set<string>}
     */
    availableOptionalResourceKeys = new Set();

    get isAutoVulnerableActive() {
        const vulnerableAppliedByOther = this.parent.effects.some(
            x => x.statuses.has('vulnerable') && !x.flags.daggerheart?.autoApplyFlagId
        );
        return !vulnerableAppliedByOther;
    }

    get availableExtraResources() {
        const homebrewResources = 
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).toObject();
        const applicableHomebrewResources = homebrewResources.resources[this.metadata.type]?.resources ?? {};
        
        return {
            ...applicableHomebrewResources,
            ...pickBy(this.resources, v => v.isExtra)
        };
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

    prepareBaseData() {
        // Initialize the set of feature granted resources
        this.availableOptionalResourceKeys.clear();
        for (const feature of this.parent.itemTypes.feature) {
            for (const resource of feature.system.actorResources) {
                this.availableOptionalResourceKeys.add(resource);
            }
        }

        /** Initializes the original source data for this.resources */
        const resources = Object.entries(CONFIG.DH.RESOURCE.optionalResources).reduce((acc, [key, data]) => {
            if (this.availableOptionalResourceKeys.has(key)) {
                acc[key] = data;
            }
            
            return acc;
        }, foundry.utils.deepClone(CONFIG.DH.RESOURCE[this.metadata.type].all));

        for (const [key, data] of Object.entries(resources)) {
            this.resources[key] ??= {};
            const resource = this.resources[key];

            // Add basic prepared data.
            resource.label = data.label;
            resource.isReversed = data.reverse;
            resource.images = data.images;
            resource.isExtra = data.isExtra;
            resources.isOptional = data.isOptional;
            resource.max = typeof data.max === 'number' ? (resource.max ?? data.max) : null;
            resource.value = resource.value ?? data.initial;
        }
    }

    /** 
     * Post preparation process called to clamp resource values.
     * Exists here so that its always called at the end of even subclass prepareDeriveds
     */
    clampResources() {
        for (const key of Object.keys(this.resources)) {
            const resource = this.resources[key];
            if (typeof resource?.max === 'number') {
                resource.value = Math.clamp(resource.value, 0, resource.max);
            }
        }
    }
}