import BaseDataItem from './base.mjs';
import ItemLinkFields from '../fields/itemLinkFields.mjs';
import { addLinkedItemsDiff, fromUuids, getFeaturesHTMLData, updateLinkedItemApps } from '../../helpers/utils.mjs';
import { DhLevelOption } from '../levelTier.mjs';

export default class DHClass extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.class',
            type: 'class',
            hasDescription: true,
            hasLevelUpOptions: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        const createItemUuidArray = () => new fields.ArrayField(new fields.DocumentUUIDField({ nullable: false, type: 'Item' }));
        return {
            ...super.defineSchema(),
            domains: new fields.ArrayField(new fields.StringField()),
            classItems: createItemUuidArray(),
            hitPoints: new fields.NumberField({
                required: true,
                integer: true,
                min: 1,
                initial: 5,
                label: 'DAGGERHEART.GENERAL.HitPoints.plural'
            }),
            evasion: new fields.NumberField({ initial: 0, integer: true, label: 'DAGGERHEART.GENERAL.evasion' }),
            features: new ItemLinkFields(),
            inventory: new fields.SchemaField({
                take: createItemUuidArray(),
                choiceA: createItemUuidArray(),
                choiceB: createItemUuidArray()
            }),
            characterGuide: new fields.SchemaField({
                suggestedTraits: new fields.SchemaField({
                    agility: new fields.NumberField({ initial: 0, integer: true }),
                    strength: new fields.NumberField({ initial: 0, integer: true }),
                    finesse: new fields.NumberField({ initial: 0, integer: true }),
                    instinct: new fields.NumberField({ initial: 0, integer: true }),
                    presence: new fields.NumberField({ initial: 0, integer: true }),
                    knowledge: new fields.NumberField({ initial: 0, integer: true })
                }),
                suggestedPrimaryWeapon: new fields.DocumentUUIDField({ type: 'Item' }),
                suggestedSecondaryWeapon: new fields.DocumentUUIDField({ type: 'Item' }),
                suggestedArmor: new fields.DocumentUUIDField({ type: 'Item' })
            }),
            backgroundQuestions: new fields.ArrayField(new fields.StringField(), { initial: ['', '', ''] }),
            connections: new fields.ArrayField(new fields.StringField(), { initial: ['', '', ''] }),
            isMulticlass: new fields.BooleanField({ initial: false }),
            levelupOptionTiers: new fields.TypedObjectField(
                new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelOption)),
                {
                    initial: { 2: {}, 3: {}, 4: {} }
                }
            )
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/laurel-crown.svg';

    /* -------------------------------------------- */

    /** @returns {string[]} */
    get hopeFeatures() {
        return this.features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.hope).map(x => x.item);
    }

    /** @returns {string[]} */
    get classFeatures() {
        return this.features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.class).map(x => x.item);
    }

    async fetchSuggestedGear() {
        const data = this.characterGuide;
        return {
            primary: await fromUuid(data.suggestedPrimaryWeapon),
            secondary: await fromUuid(data.suggestedSecondaryWeapon),
            armor: await fromUuid(data.suggestedArmor)
        }
    }

    async fetchInventoryChoices() {
        return {
            take: await fromUuids(this.inventory.take),
            choiceA: await fromUuids(this.inventory.choiceA),
            choiceB: await fromUuids(this.inventory.choiceB)
        }
    }

    async fetchSubclasses() {
        const sourceUuid = this.parent.sourceUuid;
        const subclasses = game.items.filter(x => x.type === 'subclass' && x.system.linkedClass === sourceUuid);
        for (const pack of game.packs) {
            const packIds = [];
            const indexes = await pack.getIndex({ fields: ['system.linkedClass'] });
            for (const index of indexes) {
                if (index.type !== 'subclass') continue;
                if (index.system?.linkedClass !== sourceUuid) continue;
                if (subclasses.find(x => x.uuid === index.uuid)) continue;
                packIds.push(index._id);
            }

            if (packIds.length > 0) subclasses.push(...(await pack.getDocuments({ _id__in: packIds })));
        }

        return subclasses;
    }

    async _preCreate(data, options, user) {
        if (this.actor?.type === 'character') {
            const levelupAuto = game.system.settings.automation.levelupAuto;
            if (levelupAuto) {
                const path = data.system.isMulticlass ? 'system.multiclass.value' : 'system.class.value';
                if (foundry.utils.getProperty(this.actor, path)) {
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.classAlreadySelected'));
                    return false;
                }
            } else {
                if (this.actor.system.class.value) {
                    if (this.actor.system.multiclass.value) {
                        ui.notifications.warn(
                            game.i18n.localize('DAGGERHEART.UI.Notifications.multiclassAlreadyPresent')
                        );
                        return false;
                    } else {
                        const selectedDomain =
                            await game.system.api.applications.dialogs.MulticlassChoiceDialog.configure(
                                this.actor,
                                this
                            );
                        if (!selectedDomain) return false;

                        await this.updateSource({ isMulticlass: true, domains: [selectedDomain] });
                    }
                }
            }

            if (!data.system.isMulticlass) {
                const addQuestions = (base, questions) => {
                    return `${base}${questions.map(q => `<p><strong>${q}</strong></p>`).join('<br/>')}`;
                };
                const backgroundQuestions = data.system.backgroundQuestions.filter(x => x);
                const connections = data.system.connections.filter(x => x);
                await this.actor.update({
                    'system.biography': {
                        background: addQuestions(this.actor.system.biography.background, backgroundQuestions),
                        connections: addQuestions(this.actor.system.biography.connections, connections)
                    }
                });
            }
        }

        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return;
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);

        if (options.parent?.type === 'character') {
            const path = `system.${this.isMulticlass ? 'multiclass' : 'class'}`;
            foundry.utils.getProperty(options.parent, `${path}.subclass`)?.delete();
        }
    }

    async _preUpdate(changed, options, userId) {
        const allowed = await super._preUpdate(changed, options, userId);
        if (allowed === false) return false;

        if (changed.system?.domains) {
            const maxDomains = game.system.settings.homebrew.maxDomains;
            if (changed.system.domains.length > maxDomains) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.domainMaxReached'));
                return false;
            }
        }

        const paths = [
            'subclasses',
            'characterGuide.suggestedPrimaryWeapon',
            'characterGuide.suggestedSecondaryWeapon',
            'characterGuide.suggestedArmor',
            'inventory.take',
            'inventory.choiceA',
            'inventory.choiceB'
        ];

        for (let path of paths) {
            const currentItems = [].concat(foundry.utils.getProperty(this, path) ?? []);
            const changedItems = [].concat(foundry.utils.getProperty(changed, `system.${path}`) ?? []);
            if (!changedItems.length) continue;

            addLinkedItemsDiff(changedItems, currentItems, options);
        }
    }

    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        updateLinkedItemApps(options, this.parent.sheet);
    }

    prepareDerivedData() {
        super.prepareDerivedData();
        this.subclassItem = this.actor?.items.find(i => i.type === 'subclass' && i.system.linkedClass === this.parent.sourceUuid);
    }

    /**@inheritdoc */
    async getDescriptionData() {
        const baseDescription = this.description;

        const getDomainLabel = domain => {
            const data = CONFIG.DH.DOMAIN.allDomains()[domain];
            return data ? game.i18n.localize(data.label) : '';
        };
        let domainsLabel = '';
        if (this.domains.length) {
            if (this.domains.length === 1) domainsLabel = getDomainLabel(this.domains[0]);
            else {
                const firstDomains = this.domains
                    .slice(0, this.domains.length - 1)
                    .map(getDomainLabel)
                    .join(', ');
                const lastDomain = getDomainLabel(this.domains[this.domains.length - 1]);
                domainsLabel = game.i18n.format('DAGGERHEART.GENERAL.thingsAndThing', {
                    things: firstDomains,
                    thing: lastDomain
                });
            }
        }

        const classItems = [];
        for (const uuid of this.inventory.choiceB) {
            const linkData = [undefined, 'UUID', uuid];
            const contentLink = await foundry.applications.ux.TextEditor.implementation._createContentLink(linkData);
            classItems.push(contentLink.outerHTML);
        }

        const hopeFeatures = await getFeaturesHTMLData(this.hopeFeatures);
        const classFeatures = await getFeaturesHTMLData(this.classFeatures);

        const suffix = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sheets/items/class/description.hbs',
            {
                class: this.parent,
                domains: domainsLabel,
                classItems,
                hopeFeatures,
                classFeatures
            }
        );

        return { prefix: null, value: baseDescription, suffix };
    }
}
