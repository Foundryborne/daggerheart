import { emitAsGM, GMUpdateEvent } from '../systemRegistration/socket.mjs';
import { LevelOptionType } from '../data/levelTier.mjs';
import DHFeature from '../data/item/feature.mjs';
import { createScrollText, damageKeyToNumber, getDamageKey } from '../helpers/utils.mjs';
import DhCompanionLevelUp from '../applications/levelup/companionLevelup.mjs';
import { ResourceUpdateMap } from '../data/action/baseAction.mjs';

export default class DhpActor extends Actor {
    parties = new Set();

    #scrollTextQueue = [];
    #scrollTextInterval;

    /**
     * Return the first Actor active owner.
     */
    get owner() {
        const user =
            this.hasPlayerOwner && game.users.players.find(u => this.testUserPermission(u, 'OWNER') && u.active);
        if (!user) return game.users.activeGM;
        return user;
    }

    /**
     * Whether this actor is an NPC.
     * @returns {boolean}
     */
    get isNPC() {
        return this.system.metadata.isNPC;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    static migrateData(source) {
        if (source.system?.attack && !source.system.attack.type) source.system.attack.type = 'attack';
        return super.migrateData(source);
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static getDefaultArtwork(actorData) {
        const { type } = actorData;
        const Model = CONFIG.Actor.dataModels[type];
        const img = Model.DEFAULT_ICON ?? this.DEFAULT_ICON;
        return {
            img,
            texture: {
                src: img
            }
        };
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    getEmbeddedDocument(embeddedName, id, options) {
        let doc;
        switch (embeddedName) {
            case 'Action':
                doc = this.system.actions?.get(id);
                if (!doc && this.system.attack?.id === id) doc = this.system.attack;
                break;
            default:
                return super.getEmbeddedDocument(embeddedName, id, options);
        }
        if (options?.strict && !doc) {
            throw new Error(`The key ${id} does not exist in the ${embeddedName} Collection`);
        }
        return doc;
    }

    /**@inheritdoc */
    async _preCreate(data, options, user) {
        if ((await super._preCreate(data, options, user)) === false) return false;
        const update = {};

        // Set default token size. Done here as we do not want to set a datamodel default, since that would apply the sizing to third party actor modules that aren't set up with the size system.
        if (this.system.metadata.usesSize && !data.system?.size) {
            Object.assign(update, {
                system: {
                    size: CONFIG.DH.ACTOR.tokenSize.medium.id
                }
            });
        }

        // Configure prototype token settings
        if (['character', 'companion', 'party'].includes(this.type))
            Object.assign(update, {
                prototypeToken: {
                    sight: { enabled: true },
                    actorLink: true,
                    disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY
                }
            });
        this.updateSource(update);
    }

    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);
        for (const party of this.parties) {
            party.render();
        }
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);
        for (const party of this.parties) {
            party.render();
        }
    }

    async updateLevel(newLevel) {
        if (!['character', 'companion'].includes(this.type) || newLevel === this.system.levelData.level.changed) return;

        if (newLevel > this.system.levelData.level.current) {
            const maxLevel = Object.values(
                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers).tiers
            ).reduce((acc, tier) => Math.max(acc, tier.levels.end), 0);
            if (newLevel > maxLevel) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.tooHighLevel'));
            }

            await this.update({ 'system.levelData.level.changed': Math.min(newLevel, maxLevel) });
        } else {
            const levelupAuto = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).levelupAuto;

            const usedLevel = Math.max(newLevel, 1);
            if (newLevel < 1) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.tooLowLevel'));
            }

            const updatedLevelups = Object.keys(this.system.levelData.levelups).reduce((acc, level) => {
                if (Number(level) > usedLevel) acc[`-=${level}`] = null;

                return acc;
            }, {});

            if (levelupAuto) {
                const features = [];
                const domainCards = [];
                const experiences = [];
                const subclassFeatureState = { class: null, multiclass: null };
                let multiclass = null;
                Object.keys(this.system.levelData.levelups)
                    .filter(x => x > usedLevel)
                    .forEach(levelKey => {
                        const level = this.system.levelData.levelups[levelKey];
                        const achievementCards = level.achievements.domainCards.map(x => x.itemUuid);
                        const advancementCards = level.selections
                            .filter(x => x.type === 'domainCard')
                            .map(x => x.itemUuid);
                        domainCards.push(...achievementCards, ...advancementCards);
                        experiences.push(...Object.keys(level.achievements.experiences));
                        features.push(...level.selections.flatMap(x => x.features));

                        const subclass = level.selections.find(x => x.type === 'subclass');
                        if (subclass) {
                            const path = subclass.secondaryData.isMulticlass === 'true' ? 'multiclass' : 'class';
                            const subclassState = Number(subclass.secondaryData.featureState) - 1;
                            subclassFeatureState[path] = subclassFeatureState[path]
                                ? Math.min(subclassState, subclassFeatureState[path])
                                : subclassState;
                        }

                        multiclass = level.selections.find(x => x.type === 'multiclass');
                    });

                for (let feature of features) {
                    if (feature.onPartner && !this.system.partner) continue;

                    const document = feature.onPartner ? this.system.partner : this;
                    document.items.get(feature.id)?.delete();
                }

                if (experiences.length > 0) {
                    const getUpdate = () => ({
                        'system.experiences': experiences.reduce((acc, key) => {
                            acc[`-=${key}`] = null;
                            return acc;
                        }, {})
                    });
                    this.update(getUpdate());
                }

                if (subclassFeatureState.class) {
                    this.system.class.subclass.update({ 'system.featureState': subclassFeatureState.class });
                }

                if (subclassFeatureState.multiclass) {
                    this.system.multiclass.subclass.update({ 'system.featureState': subclassFeatureState.multiclass });
                }

                if (multiclass) {
                    const multiclassItem = this.items.find(x => x.uuid === multiclass.itemUuid);
                    const multiclassFeatures = this.items.filter(
                        x => x.system.originItemType === 'class' && x.system.multiclassOrigin
                    );
                    const subclassFeatures = this.items.filter(
                        x => x.system.originItemType === 'subclass' && x.system.multiclassOrigin
                    );

                    this.deleteEmbeddedDocuments(
                        'Item',
                        [multiclassItem, ...multiclassFeatures, ...subclassFeatures].map(x => x.id)
                    );

                    this.update({
                        'system.multiclass': {
                            value: null,
                            subclass: null
                        }
                    });
                }

                for (let domainCard of domainCards) {
                    const itemCard = this.items.find(x => x.uuid === domainCard);
                    itemCard?.delete();
                }
            }

            await this.update({
                system: {
                    levelData: {
                        level: {
                            current: usedLevel,
                            changed: usedLevel
                        },
                        levelups: updatedLevelups
                    }
                }
            });
            this.sheet.render();
        }
    }

    async levelUp(levelupData) {
        const levelupAuto = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).levelupAuto;

        const levelups = {};
        for (var levelKey of Object.keys(levelupData)) {
            const level = levelupData[levelKey];

            if (levelupAuto) {
                for (var experienceKey in level.achievements.experiences) {
                    const experience = level.achievements.experiences[experienceKey];
                    await this.update({
                        [`system.experiences.${experienceKey}`]: {
                            name: experience.name,
                            value: experience.modifier,
                            core: true
                        }
                    });
                }
            }

            let multiclass = null;
            const featureAdditions = [];
            const domainCards = [];
            const subclassFeatureState = { class: null, multiclass: null };
            const selections = [];
            for (var optionKey of Object.keys(level.choices)) {
                const selection = level.choices[optionKey];
                for (var checkboxNr of Object.keys(selection)) {
                    const checkbox = selection[checkboxNr];

                    const tierOption = LevelOptionType[checkbox.type];
                    if (tierOption.features?.length > 0) {
                        featureAdditions.push({
                            checkbox: {
                                ...checkbox,
                                level: Number(levelKey),
                                optionKey: optionKey,
                                checkboxNr: Number(checkboxNr)
                            },
                            features: tierOption.features
                        });
                    } else if (checkbox.type === 'multiclass') {
                        multiclass = {
                            ...checkbox,
                            level: Number(levelKey),
                            optionKey: optionKey,
                            checkboxNr: Number(checkboxNr)
                        };
                    } else if (checkbox.type === 'domainCard') {
                        domainCards.push({
                            ...checkbox,
                            level: Number(levelKey),
                            optionKey: optionKey,
                            checkboxNr: Number(checkboxNr)
                        });
                    } else {
                        if (checkbox.type === 'subclass') {
                            const path = checkbox.secondaryData.isMulticlass === 'true' ? 'multiclass' : 'class';
                            subclassFeatureState[path] = Math.max(
                                Number(checkbox.secondaryData.featureState),
                                subclassFeatureState[path]
                            );
                        }

                        selections.push({
                            ...checkbox,
                            level: Number(levelKey),
                            optionKey: optionKey,
                            checkboxNr: Number(checkboxNr)
                        });
                    }
                }
            }

            for (var addition of featureAdditions) {
                if (levelupAuto) {
                    for (var featureData of addition.features) {
                        const feature = new DHFeature({
                            ...featureData,
                            description: game.i18n.localize(featureData.description)
                        });

                        const document = featureData.toPartner && this.system.partner ? this.system.partner : this;
                        const embeddedItem = await document.createEmbeddedDocuments('Item', [
                            {
                                ...featureData,
                                name: game.i18n.localize(featureData.name),
                                type: 'feature',
                                system: feature
                            }
                        ]);
                        const newFeature = {
                            onPartner: Boolean(featureData.toPartner && this.system.partner),
                            id: embeddedItem[0].id
                        };
                        addition.checkbox.features = !addition.checkbox.features
                            ? [newFeature]
                            : [...addition.checkbox.features, newFeature];
                    }
                }

                selections.push(addition.checkbox);
            }

            if (multiclass) {
                if (levelupAuto) {
                    const subclassItem = await foundry.utils.fromUuid(multiclass.secondaryData.subclass);
                    const subclassData = subclassItem.toObject();
                    const multiclassItem = await foundry.utils.fromUuid(multiclass.data[0]);
                    const multiclassData = multiclassItem.toObject();

                    const embeddedItem = await this.createEmbeddedDocuments('Item', [
                        {
                            ...multiclassData,
                            uuid: multiclassItem.uuid,
                            _stats: multiclassItem._stats,
                            system: {
                                ...multiclassData.system,
                                features: multiclassData.system.features.filter(x => x.type !== 'hope'),
                                domains: [multiclass.secondaryData.domain],
                                isMulticlass: true
                            }
                        }
                    ]);

                    await this.createEmbeddedDocuments('Item', [
                        {
                            ...subclassData,
                            uuid: subclassItem.uuid,
                            _stats: subclassItem._stats,
                            system: {
                                ...subclassData.system,
                                isMulticlass: true
                            }
                        }
                    ]);
                    selections.push({ ...multiclass, itemUuid: embeddedItem[0].uuid });
                } else {
                    selections.push({ ...multiclass });
                }
            }

            for (var domainCard of domainCards) {
                if (levelupAuto) {
                    const cardItem = await foundry.utils.fromUuid(domainCard.data[0]);
                    const cardData = cardItem.toObject();
                    const embeddedItem = await this.createEmbeddedDocuments('Item', [
                        {
                            ...cardData,
                            uuid: cardItem.uuid,
                            _stats: cardItem._stats,
                            system: {
                                ...cardData.system,
                                inVault: true
                            }
                        }
                    ]);
                    selections.push({ ...domainCard, itemUuid: embeddedItem[0].uuid });
                } else {
                    selections.push({ ...domainCard });
                }
            }

            const achievementDomainCards = [];
            if (levelupAuto) {
                for (var card of Object.values(level.achievements.domainCards)) {
                    const cardItem = await foundry.utils.fromUuid(card.uuid);
                    const cardData = cardItem.toObject();
                    const embeddedItem = await this.createEmbeddedDocuments('Item', [
                        {
                            ...cardData,
                            uuid: cardItem.uuid,
                            _stats: cardItem._stats,
                            system: {
                                ...cardData.system,
                                inVault: true
                            }
                        }
                    ]);
                    card.itemUuid = embeddedItem[0].uuid;
                    achievementDomainCards.push(card);
                }
            }

            if (subclassFeatureState.class) {
                await this.system.class.subclass.update({ 'system.featureState': subclassFeatureState.class });
            }

            if (subclassFeatureState.multiclass) {
                await this.system.multiclass.subclass.update({
                    'system.featureState': subclassFeatureState.multiclass
                });
            }

            levelups[levelKey] = {
                achievements: {
                    ...level.achievements,
                    domainCards: achievementDomainCards
                },
                selections: selections
            };
        }

        const levelChange = this.system.levelData.level.changed - this.system.levelData.level.current;
        await this.update({
            system: {
                levelData: {
                    level: {
                        current: this.system.levelData.level.changed
                    },
                    levelups: levelups
                }
            }
        });
        this.sheet.render();

        if (this.system.companion && !this.system.companion.system.levelData.canLevelUp) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.ACTORS.Character.companionLevelup.confirmTitle')
                },
                content: game.i18n.format('DAGGERHEART.ACTORS.Character.companionLevelup.confirmText', {
                    name: this.system.companion.name,
                    levelChange: levelChange
                })
            });

            if (!confirmed) return;

            await this.system.companion.updateLevel(this.system.companion.system.levelData.level.current + levelChange);
            new DhCompanionLevelUp(this.system.companion).render({ force: true });
        }
    }

    /**
     * @param {object} config
     * @param {Event} config.event
     * @param {string} config.title
     * @param {object} config.roll
     * @param {number} config.roll.modifier
     * @param {boolean} [config.roll.simple=false]
     * @param {string} [config.roll.type]
     * @param {number} [config.roll.difficulty]
     * @param {boolean} [config.hasDamage]
     * @param {boolean} [config.hasEffect]
     * @param {object} [config.chatMessage]
     * @param {string} config.chatMessage.template
     * @param {boolean} [config.chatMessage.mute]
     * @param {object} [config.targets]
     * @param {object} [config.costs]
     */
    async diceRoll(config) {
        config.source = { ...(config.source ?? {}), actor: this.uuid };
        config.data = this.getRollData();
        config.resourceUpdates = new ResourceUpdateMap(this);
        const rollClass = config.roll.lite ? CONFIG.Dice.daggerheart['DHRoll'] : this.rollClass;
        return await rollClass.build(config);
    }

    get rollClass() {
        return CONFIG.Dice.daggerheart[['character', 'companion'].includes(this.type) ? 'DualityRoll' : 'D20Roll'];
    }

    get baseSaveDifficulty() {
        return this.system.difficulty ?? 10;
    }

    /** @inheritDoc */
    async toggleStatusEffect(statusId, { active, overlay = false } = {}) {
        const status = CONFIG.statusEffects.find(e => e.id === statusId);
        if (!status) throw new Error(`Invalid status ID "${statusId}" provided to Actor#toggleStatusEffect`);
        const existing = [];

        // Find the effect with the static _id of the status effect
        if (status._id) {
            const effect = this.effects.get(status._id);
            if (effect) existing.push(effect.id);
        }

        // If no static _id, find all effects that have this status
        else {
            for (const effect of this.effects) {
                if (effect.statuses.has(status.id)) existing.push(effect.id);
            }
        }

        // Remove the existing effects unless the status effect is forced active
        if (existing.length) {
            if (active) return true;
            await this.deleteEmbeddedDocuments('ActiveEffect', existing);
            return false;
        }

        // Create a new effect unless the status effect is forced inactive
        if (!active && active !== undefined) return;

        const ActiveEffect = getDocumentClass('ActiveEffect');
        const effect = await ActiveEffect.fromStatusEffect(statusId);
        if (overlay) effect.updateSource({ 'flags.core.overlay': true });
        return ActiveEffect.implementation.create(effect, { parent: this, keepId: true });
    }

    /**@inheritdoc */
    getRollData() {
        const rollData = foundry.utils.deepClone(super.getRollData());
        /* system gets repeated infinately which causes issues when trying to use the data for document creation */
        delete rollData.system;

        rollData.id = this.id;
        rollData.name = this.name;
        rollData.system = this.system.getRollData();
        rollData.prof = this.system.proficiency ?? 1;
        rollData.cast = this.system.spellcastModifier ?? 1;
        return rollData;
    }

    #canReduceDamage(hpDamage, type) {
        const { stressDamageReduction, disabledArmor } = this.system.rules.damageReduction;
        if (disabledArmor) return false;

        const availableStress = this.system.resources.stress.max - this.system.resources.stress.value;

        const canUseArmor =
            this.system.armor &&
            this.system.armor.system.marks.value < this.system.armorScore &&
            type.every(t => this.system.armorApplicableDamageTypes[t] === true);
        const canUseStress = Object.keys(stressDamageReduction).reduce((acc, x) => {
            const rule = stressDamageReduction[x];
            if (damageKeyToNumber(x) <= hpDamage) return acc || (rule.enabled && availableStress >= rule.cost);
            return acc;
        }, false);

        return canUseArmor || canUseStress;
    }

    async takeDamage(damages, isDirect = false) {
        if (Hooks.call(`${CONFIG.DH.id}.preTakeDamage`, this, damages) === false) return null;

        if (this.type === 'companion') {
            await this.modifyResource([{ value: 1, key: 'stress' }]);
            return;
        }

        const updates = [];

        Object.entries(damages).forEach(([key, damage]) => {
            damage.parts.forEach(part => {
                if (part.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id)
                    part.total = this.calculateDamage(part.total, part.damageTypes);
                const update = updates.find(u => u.key === key);
                if (update) {
                    update.value += part.total;
                    update.damageTypes.add(...new Set(part.damageTypes));
                } else updates.push({ value: part.total, key, damageTypes: new Set(part.damageTypes) });
            });
        });

        if (Hooks.call(`${CONFIG.DH.id}.postCalculateDamage`, this, damages) === false) return null;

        if (!updates.length) return;

        const hpDamage = updates.find(u => u.key === CONFIG.DH.GENERAL.healingTypes.hitPoints.id);
        if (hpDamage) {
            hpDamage.value = this.convertDamageToThreshold(hpDamage.value);
            if (
                this.type === 'character' &&
                !isDirect &&
                this.system.armor &&
                this.#canReduceDamage(hpDamage.value, hpDamage.damageTypes)
            ) {
                const armorSlotResult = await this.owner.query(
                    'armorSlot',
                    {
                        actorId: this.uuid,
                        damage: hpDamage.value,
                        type: [...hpDamage.damageTypes]
                    },
                    {
                        timeout: 30000
                    }
                );
                if (armorSlotResult) {
                    const { modifiedDamage, armorSpent, stressSpent } = armorSlotResult;
                    updates.find(u => u.key === 'hitPoints').value = modifiedDamage;
                    if (armorSpent) {
                        const armorUpdate = updates.find(u => u.key === 'armor');
                        if (armorUpdate) armorUpdate.value += armorSpent;
                        else updates.push({ value: armorSpent, key: 'armor' });
                    }
                    if (stressSpent) {
                        const stressUpdate = updates.find(u => u.key === 'stress');
                        if (stressUpdate) stressUpdate.value += stressSpent;
                        else updates.push({ value: stressSpent, key: 'stress' });
                    }
                }
            }
            if (this.type === 'adversary') {
                const reducedSeverity = hpDamage.damageTypes.reduce((value, curr) => {
                    return Math.max(this.system.rules.damageReduction.reduceSeverity[curr], value);
                }, 0);
                hpDamage.value = Math.max(hpDamage.value - reducedSeverity, 0);

                if (
                    hpDamage.value &&
                    this.system.rules.damageReduction.thresholdImmunities[getDamageKey(hpDamage.value)]
                ) {
                    hpDamage.value -= 1;
                }
            }
        }

        const results = await game.system.registeredTriggers.runTrigger(
            CONFIG.DH.TRIGGER.triggers.postDamageReduction.id,
            this,
            updates,
            this
        );

        if (results?.length) {
            const resourceMap = new ResourceUpdateMap(results[0].originActor);
            for (var result of results) resourceMap.addResources(result.updates);
            resourceMap.updateResources();
        }

        updates.forEach(
            u =>
                (u.value =
                    u.key === 'fear' || this.system?.resources?.[u.key]?.isReversed === false ? u.value * -1 : u.value)
        );

        await this.modifyResource(updates);

        if (Hooks.call(`${CONFIG.DH.id}.postTakeDamage`, this, updates) === false) return null;

        return updates;
    }

    calculateDamage(baseDamage, type) {
        if (this.canResist(type, 'immunity')) return 0;
        if (this.canResist(type, 'resistance')) baseDamage = Math.ceil(baseDamage / 2);

        const flatReduction = this.getDamageTypeReduction(type);
        const damage = Math.max(baseDamage - (flatReduction ?? 0), 0);

        return damage;
    }

    canResist(type, resistance) {
        if (!type?.length) return false;
        return type.every(t => this.system.resistance[t]?.[resistance] === true);
    }

    getDamageTypeReduction(type) {
        if (!type?.length) return 0;
        const reduction = Object.entries(this.system.resistance).reduce(
            (a, [index, value]) => (type.includes(index) ? Math.min(value.reduction, a) : a),
            Infinity
        );
        return reduction === Infinity ? 0 : reduction;
    }

    async takeHealing(healings) {
        if (Hooks.call(`${CONFIG.DH.id}.preTakeHealing`, this, healings) === false) return null;

        const updates = [];
        Object.entries(healings).forEach(([key, healing]) => {
            healing.parts.forEach(part => {
                const update = updates.find(u => u.key === key);
                if (update) update.value += part.total;
                else updates.push({ value: part.total, key });
            });
        });

        updates.forEach(
            u =>
                (u.value = !(u.key === 'fear' || this.system?.resources?.[u.key]?.isReversed === false)
                    ? u.value * -1
                    : u.value)
        );

        await this.modifyResource(updates);

        if (Hooks.call(`${CONFIG.DH.id}.postTakeHealing`, this, updates) === false) return null;

        return updates;
    }

    /**
     * Resources are modified asynchronously, so be careful not to update the same resource in
     * quick succession.
     */
    async modifyResource(resources) {
        if (!resources?.length) return;

        if (resources.find(r => r.key === 'stress')) this.convertStressDamageToHP(resources);
        let updates = {
            actor: { target: this, resources: {} },
            armor: { target: this.system.armor, resources: {} },
            items: {}
        };

        resources.forEach(r => {
            if (r.itemId) {
                const { path, value } = game.system.api.fields.ActionFields.CostField.getItemIdCostUpdate(r);

                if (
                    r.key === 'quantity' &&
                    r.target.type === 'consumable' &&
                    value === 0 &&
                    r.target.system.destroyOnEmpty
                ) {
                    r.target.delete();
                } else {
                    updates.items[r.key] = {
                        target: r.target,
                        resources: { [path]: value }
                    };
                }
            } else {
                switch (r.key) {
                    case 'fear':
                        ui.resources.updateFear(
                            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear) + r.value
                        );
                        break;
                    case 'armor':
                        if (this.system.armor?.system?.marks) {
                            updates.armor.resources['system.marks.value'] = Math.max(
                                Math.min(this.system.armor.system.marks.value + r.value, this.system.armorScore),
                                0
                            );
                        }
                        break;
                    default:
                        if (this.system.resources?.[r.key]) {
                            updates.actor.resources[`system.resources.${r.key}.value`] = Math.max(
                                Math.min(
                                    this.system.resources[r.key].value + r.value,
                                    this.system.resources[r.key].max
                                ),
                                0
                            );
                        }
                        break;
                }
            }
        });

        Object.keys(updates).forEach(async key => {
            const u = updates[key];
            if (key === 'items') {
                Object.values(u).forEach(async item => {
                    await emitAsGM(
                        GMUpdateEvent.UpdateDocument,
                        item.target.update.bind(item.target),
                        item.resources,
                        item.target.uuid
                    );
                });
            } else {
                if (Object.keys(u.resources).length > 0) {
                    await emitAsGM(
                        GMUpdateEvent.UpdateDocument,
                        u.target.update.bind(u.target),
                        u.resources,
                        u.target.uuid
                    );
                }
            }
        });
    }

    convertDamageToThreshold(damage) {
        const massiveDamageEnabled = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules)
            .massiveDamage.enabled;
        if (massiveDamageEnabled && damage >= this.system.damageThresholds.severe * 2) {
            return 4;
        }
        return damage >= this.system.damageThresholds.severe ? 3 : damage >= this.system.damageThresholds.major ? 2 : 1;
    }

    convertStressDamageToHP(resources) {
        const stressDamage = resources.find(r => r.key === 'stress'),
            newValue = this.system.resources.stress.value + stressDamage.value;
        if (newValue <= this.system.resources.stress.max) return;
        const hpDamage = resources.find(r => r.key === 'hitPoints');
        if (hpDamage) hpDamage.value++;
        else
            resources.push({
                key: 'hitPoints',
                value: 1
            });
    }

    async toggleDefeated(defeatedState) {
        const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).defeated;
        const { unconscious, defeated, dead } = CONFIG.DH.GENERAL.conditions();
        const defeatedConditions = new Set([unconscious.id, defeated.id, dead.id]);
        if (!defeatedState) {
            for (let defeatedId of defeatedConditions) {
                await this.toggleStatusEffect(defeatedId, { overlay: settings.overlay, active: defeatedState });
            }
        } else {
            const noDefeatedConditions = this.statuses.intersection(defeatedConditions).size === 0;
            if (noDefeatedConditions) {
                const condition = settings[`${this.type}Default`];
                await this.toggleStatusEffect(condition, { overlay: settings.overlay, active: defeatedState });
            }
        }
    }

    queueScrollText(scrollingTextData) {
        this.#scrollTextQueue.push(...scrollingTextData.map(data => () => createScrollText(this, data)));
        if (!this.#scrollTextInterval) {
            const scrollFunc = this.#scrollTextQueue.pop();
            scrollFunc?.();

            const intervalFunc = () => {
                const scrollFunc = this.#scrollTextQueue.pop();
                scrollFunc?.();
                if (this.#scrollTextQueue.length === 0) {
                    clearInterval(this.#scrollTextInterval);
                    this.#scrollTextInterval = null;
                }
            };

            this.#scrollTextInterval = setInterval(intervalFunc.bind(this), 600);
        }
    }

    /** @inheritdoc */
    async importFromJSON(json) {
        if (!this.type === 'character') return await super.importFromJSON(json);

        if (!CONST.WORLD_DOCUMENT_TYPES.includes(this.documentName)) {
            throw new Error('Only world Documents may be imported');
        }

        const parsedJSON = JSON.parse(json);
        if (foundry.utils.isNewerVersion('1.1.0', parsedJSON._stats.systemVersion)) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.ACTORS.Character.InvalidOldCharacterImportTitle')
                },
                content: game.i18n.localize('DAGGERHEART.ACTORS.Character.InvalidOldCharacterImportText')
            });
            if (!confirmed) return;
        }

        return await super.importFromJSON(json);
    }

    /**
     * Generate an array of localized tag.
     * @returns {string[]} An array of localized tag strings.
     */
    _getTags() {
        const tags = [];
        if (this.system._getTags) tags.push(...this.system._getTags());
        return tags;
    }

    /** Get active effects */
    getActiveEffects() {
        const statusMap = new Map(foundry.CONFIG.statusEffects.map(status => [status.id, status]));
        return this.effects
            .filter(x => !x.disabled)
            .reduce((acc, effect) => {
                acc.push(effect);

                const currentStatusActiveEffects = acc.filter(
                    x => x.statuses.size === 1 && x.name === game.i18n.localize(statusMap.get(x.statuses.first())?.name)
                );

                for (var status of effect.statuses) {
                    if (!currentStatusActiveEffects.find(x => x.statuses.has(status))) {
                        const statusData = statusMap.get(status);
                        if (statusData) {
                            acc.push({
                                condition: status,
                                appliedBy: game.i18n.localize(effect.name),
                                name: game.i18n.localize(statusData.name),
                                statuses: new Set([status]),
                                img: statusData.icon ?? statusData.img,
                                description: game.i18n.localize(statusData.description),
                                tint: effect.tint
                            });
                        }
                    }
                }

                return acc;
            }, []);
    }

    /* Temporarily copying the foundry method to add a fix to a bug with scenes 
       https://discord.com/channels/170995199584108546/1296292044011995136/1446693077443149856
    */
    getDependentTokens({ scenes, linked = false } = {}) {
        if (this.isToken && !scenes) return [this.token];
        if (scenes) scenes = Array.isArray(scenes) ? scenes : [scenes];
        else scenes = Array.from(this._dependentTokens.keys());

        /* Code to filter out nonexistant scenes */
        scenes = scenes.filter(scene => game.scenes.some(x => x.id === scene.id));

        if (this.isToken) {
            const parent = this.token.parent;
            return scenes.includes(parent) ? [this.token] : [];
        }

        const allTokens = [];
        for (const scene of scenes) {
            if (!scene) continue;
            const tokens = this._dependentTokens.get(scene);
            for (const token of tokens ?? []) {
                if (!linked || token.actorLink) allTokens.push(token);
            }
        }

        return allTokens;
    }
}
