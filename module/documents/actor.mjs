import DamageSelectionDialog from '../applications/dialogs/damageSelectionDialog.mjs';
import { emitAsGM, emitAsOwner, GMUpdateEvent, socketEvent } from '../systemRegistration/socket.mjs';
import DamageReductionDialog from '../applications/dialogs/damageReductionDialog.mjs';
import { LevelOptionType } from '../data/levelTier.mjs';
import DHFeature from '../data/item/feature.mjs';
import { damageKeyToNumber, getDamageKey } from '../helpers/utils.mjs';

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
        const levelups = {};
        for (var levelKey of Object.keys(levelupData)) {
            const level = levelupData[levelKey];

            for (var experienceKey in level.achievements.experiences) {
                const experience = level.achievements.experiences[experienceKey];
                await this.update({
                    [`system.experiences.${experienceKey}`]: {
                        name: experience.name,
                        value: experience.modifier
                    }
                });

                if (this.system.companion) {
                    await this.system.companion.update({
                        [`system.experiences.${experienceKey}`]: {
                            name: '',
                            value: experience.modifier
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

                selections.push(addition.checkbox);
            }

            if (multiclass) {
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
            }

            for (var domainCard of domainCards) {
                const item = await foundry.utils.fromUuid(domainCard.data[0]);
                const embeddedItem = await this.createEmbeddedDocuments('Item', [item.toObject()]);
                selections.push({ ...domainCard, itemUuid: embeddedItem[0].uuid });
            }

            const achievementDomainCards = [];
            for (var card of Object.values(level.achievements.domainCards)) {
                const item = await foundry.utils.fromUuid(card.uuid);
                const embeddedItem = await this.createEmbeddedDocuments('Item', [item.toObject()]);
                card.itemUuid = embeddedItem[0].uuid;
                achievementDomainCards.push(card);
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

    getRollData() {
        const rollData = super.getRollData();
        rollData.prof = this.system.proficiency ?? 1;
        rollData.cast = this.system.spellcast ?? 1;
        return rollData;
    }

    #canReduceDamage(hpDamage, type) {
        const availableStress = this.system.resources.stress.max - this.system.resources.stress.value;

        const canUseArmor =
            this.system.armor &&
            this.system.armor.system.marks.value < this.system.armorScore &&
            type.every(t => this.system.armorApplicableDamageTypes[t] === true);
        const canUseStress = Object.keys(this.system.rules.damageReduction.stressDamageReduction).reduce((acc, x) => {
            const rule = this.system.rules.damageReduction.stressDamageReduction[x];
            if (damageKeyToNumber(x) <= hpDamage) return acc || (rule.enabled && availableStress >= rule.cost);
            return acc;
        }, false);

        return canUseArmor || canUseStress;
    }

    async takeDamage(baseDamage, type) {
        if (Hooks.call(`${CONFIG.DH.id}.preTakeDamage`, this, baseDamage, type) === false) return null;

        if (this.type === 'companion') {
            await this.modifyResource([{ value: 1, type: 'stress' }]);
            return;
        }

        type = !Array.isArray(type) ? [type] : type;

        const hpDamage = this.calculateDamage(baseDamage, type);

        if (!hpDamage) return;

        const updates = [{ value: hpDamage, type: 'hitPoints' }];

        if (this.type === 'character' && this.system.armor && this.#canReduceDamage(hpDamage, type)) {
            const armorStackResult = await this.owner.query('armorStack', {
                actorId: this.uuid,
                damage: hpDamage,
                type: type
            });
            if (armorStackResult) {
                const { modifiedDamage, armorSpent, stressSpent } = armorStackResult;
                updates.find(u => u.type === 'hitPoints').value = modifiedDamage;
                updates.push(
                    ...(armorSpent ? [{ value: armorSpent, type: 'armorStack' }] : []),
                    ...(stressSpent ? [{ value: stressSpent, type: 'stress' }] : [])
                );
            }
        }

        await this.modifyResource(updates);

        if (Hooks.call(`${CONFIG.DH.id}.postTakeDamage`, this, damage, type) === false) return null;
    }

    calculateDamage(baseDamage, type) {
        if (Hooks.call(`${CONFIG.DH.id}.preCalculateDamage`, this, baseDamage, type) === false) return null;

        /* if(this.system.resistance[type]?.immunity) return 0;
        if(this.system.resistance[type]?.resistance) baseDamage = Math.ceil(baseDamage / 2); */
        if(this.canResist(type, 'immunity')) return 0;
        if(this.canResist(type, 'resistance')) baseDamage = Math.ceil(baseDamage / 2);

        // const flatReduction = this.system.resistance[type].reduction;
        const flatReduction = this.getDamageTypeReduction(type);
        const damage = Math.max(baseDamage - (flatReduction ?? 0), 0);
        const hpDamage = this.convertDamageToThreshold(damage);

        if (Hooks.call(`${CONFIG.DH.id}.postCalculateDamage`, this, baseDamage, type) === false) return null;

        return hpDamage;
    }

    canResist(type, resistance) {
        if(!type) return 0;
        return type.every(t => this.system.resistance[t]?.[resistance] === true);
    }

    getDamageTypeReduction(type) {
        if(!type) return 0;
        const reduction = Object.entries(this.system.resistance).reduce((a, [index, value]) => type.includes(index) ? Math.min(value.reduction, a) : a, Infinity);
        return reduction === Infinity ? 0 : reduction;
    }

    async takeHealing(resources) {
        resources.forEach(r => (r.value *= -1));
        await this.modifyResource(resources);
    }

    async modifyResource(resources) {
        if (!resources.length) return;

        if (resources.find(r => r.type === 'stress')) this.convertStressDamageToHP(resources);
        let updates = { actor: { target: this, resources: {} }, armor: { target: this.system.armor, resources: {} } };
        resources.forEach(r => {
            switch (r.type) {
                case 'fear':
                    ui.resources.updateFear(
                        game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear) + r.value
                    );
                    break;
                case 'armorStack':
                    updates.armor.resources['system.marks.value'] = Math.max(
                        Math.min(this.system.armor.system.marks.value + r.value, this.system.armorScore),
                        0
                    );
                    break;
                default:
                    updates.actor.resources[`system.resources.${r.type}.value`] = Math.max(
                        Math.min(
                            this.system.resources[r.type].value + r.value,
                            this.system.resources[r.type].max
                        ),
                        0
                    );
                    break;
            }
        });
        Object.values(updates).forEach(async u => {
            if (Object.keys(u.resources).length > 0) {
                await emitAsGM(
                    GMUpdateEvent.UpdateDocument,
                    u.target.update.bind(u.target),
                    u.resources,
                    u.target.uuid
                );
            }
        });
    }

    convertDamageToThreshold(damage) {
        return damage >= this.system.damageThresholds.severe
            ? 3
            : damage >= this.system.damageThresholds.major
              ? 2
              : damage >= this.system.damageThresholds.minor
                ? 1
                : 0;
    }

    convertStressDamageToHP(resources) {
        const stressDamage = resources.find(r => r.type === 'stress'),
            newValue = this.system.resources.stress.value + stressDamage.value;
        if (newValue <= this.system.resources.stress.max) return;
        const hpDamage = resources.find(r => r.type === 'hitPoints');
        if (hpDamage) hpDamage.value++;
        else
            resources.push({
                type: 'hitPoints',
                value: 1
            });
    }
}

export const registerDHActorHooks = () => {
    CONFIG.queries.armorStack = DamageReductionDialog.armorStackQuery;
};
