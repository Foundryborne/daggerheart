import { emitAsGM, GMUpdateEvent } from '../systemRegistration/socket.mjs';
import { LevelOptionType } from '../data/levelTier.mjs';
import DHFeature from '../data/item/feature.mjs';
import { damageKeyToNumber } from '../helpers/utils.mjs';

export default class DhpActor extends Actor {
    /**
     * Return the first Actor active owner.
     */
    get owner() {
        const user =
            this.hasPlayerOwner && game.users.players.find(u => this.testUserPermission(u, 'OWNER') && u.active);
        if (!user) return game.user.isGM ? game.user : null;
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

        // Configure prototype token settings
        const prototypeToken = {};
        if (['character', 'companion'].includes(this.type))
            Object.assign(prototypeToken, {
                sight: { enabled: true },
                actorLink: true,
                disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY
            });
        this.updateSource({ prototypeToken });
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
            const usedLevel = Math.max(newLevel, 1);
            if (newLevel < 1) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.tooLowLevel'));
            }

            const updatedLevelups = Object.keys(this.system.levelData.levelups).reduce((acc, level) => {
                if (Number(level) > usedLevel) acc[`-=${level}`] = null;

                return acc;
            }, {});

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
                    const advancementCards = level.selections.filter(x => x.type === 'domainCard').map(x => x.itemUuid);
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
                if (this.system.companion) {
                    this.system.companion.update(getUpdate());
                }
            }

            if (subclassFeatureState.class) {
                this.system.class.subclass.update({ 'system.featureState': subclassFeatureState.class });
            }

            if (subclassFeatureState.multiclass) {
                this.system.multiclass.subclass.update({ 'system.featureState': subclassFeatureState.multiclass });
            }

            if (multiclass) {
                const multiclassSubclass = this.items.find(x => x.type === 'subclass' && x.system.isMulticlass);
                const multiclassItem = this.items.find(x => x.uuid === multiclass.itemUuid);

                multiclassSubclass.delete();
                multiclassItem.delete();

                this.update({
                    'system.multiclass': {
                        value: null,
                        subclass: null
                    }
                });
            }

            for (let domainCard of domainCards) {
                const itemCard = this.items.find(x => x.uuid === domainCard);
                itemCard.delete();
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

            if (this.system.companion) {
                this.system.companion.updateLevel(newLevel);
            }
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

                    if (this.system.companion) {
                        await this.system.companion.update({
                            [`system.experiences.${experienceKey}`]: {
                                name: '',
                                value: experience.modifier,
                                core: true
                            }
                        });
                    }
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
                            system: {
                                ...multiclassData.system,
                                domains: [multiclass.secondaryData.domain],
                                isMulticlass: true
                            }
                        }
                    ]);

                    await this.createEmbeddedDocuments('Item', [
                        {
                            ...subclassData,
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
                    const itemData = (await foundry.utils.fromUuid(domainCard.data[0])).toObject();
                    const embeddedItem = await this.createEmbeddedDocuments('Item', [
                        {
                            ...itemData,
                            system: {
                                ...itemData.system,
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
                    const itemData = (await foundry.utils.fromUuid(card.uuid)).toObject();
                    const embeddedItem = await this.createEmbeddedDocuments('Item', [
                        {
                            ...itemData,
                            system: {
                                ...itemData.system,
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

        if (this.system.companion) {
            this.system.companion.updateLevel(this.system.levelData.level.changed);
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
        const rollData = super.getRollData();
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

    async takeDamage(damages) {
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
                    updates.push(
                        ...(armorSpent ? [{ value: armorSpent, key: 'armor' }] : []),
                        ...(stressSpent ? [{ value: stressSpent, key: 'stress' }] : [])
                    );
                }
            }
        }

        updates.forEach(
            u =>
                (u.value =
                    u.key === 'fear' || this.system?.resources?.[u.key]?.isReversed === false ? u.value * -1 : u.value)
        );

        await this.modifyResource(updates);

        if (Hooks.call(`${CONFIG.DH.id}.postTakeDamage`, this, updates) === false) return null;
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
    }

    async modifyResource(resources) {
        if (!resources.length) return;

        if (resources.find(r => r.key === 'stress')) this.convertStressDamageToHP(resources);
        let updates = {
            actor: { target: this, resources: {} },
            armor: { target: this.system.armor, resources: {} },
            items: {}
        };

        resources.forEach(r => {
            if (r.keyIsID) {
                updates.items[r.key] = {
                    target: r.target,
                    resources: {
                        'system.resource.value': r.target.system.resource.value + r.value
                    }
                };
            } else {
                switch (r.key) {
                    case 'fear':
                        ui.resources.updateFear(
                            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear) + r.value
                        );
                        break;
                    case 'armor':
                        updates.armor.resources['system.marks.value'] = Math.max(
                            Math.min(this.system.armor.system.marks.value + r.value, this.system.armorScore),
                            0
                        );
                        break;
                    default:
                        updates.actor.resources[`system.resources.${r.key}.value`] = Math.max(
                            Math.min(this.system.resources[r.key].value + r.value, this.system.resources[r.key].max),
                            0
                        );
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
}
