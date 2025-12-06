import { getCritDamageBonus } from '../../helpers/utils.mjs';
import { GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class TagTeamDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(party) {
        super();

        this.data = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll);
        this.party = party;

        this.setupHooks = Hooks.on(socketEvent.Refresh, ({ refreshType }) => {
            if (refreshType === RefreshType.TagTeamRoll) {
                this.data = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll);
                this.render();
            }
        });
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'dh-style', 'dialog', 'tag-team-dialog'],
        position: { width: 550, height: 'auto' },
        actions: {
            removeMember: TagTeamDialog.#removeMember,
            unlinkMessage: TagTeamDialog.#unlinkMessage,
            selectMessage: TagTeamDialog.#selectMessage,
            createTagTeam: TagTeamDialog.#createTagTeam
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        application: {
            id: 'tag-team-dialog',
            template: 'systems/daggerheart/templates/dialogs/tagTeamDialog.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.hopeCost = this.hopeCost;
        context.data = this.data;

        context.memberOptions = this.party.filter(c => !this.data.members[c.id]);
        context.selectedCharacterOptions = this.party.filter(c => this.data.members[c.id]);

        context.members = Object.keys(this.data.members).map(id => {
            const roll = this.data.members[id].messageId ? game.messages.get(this.data.members[id].messageId) : null;

            context.usesDamage =
                context.usesDamage === undefined
                    ? roll?.system.hasDamage
                    : context.usesDamage && roll?.system.hasDamage;
            return {
                character: this.party.find(x => x.id === id),
                selected: this.data.members[id].selected,
                roll: roll,
                damageValues: roll
                    ? Object.keys(roll.system.damage).map(key => ({
                          key: key,
                          name: game.i18n.localize(CONFIG.DH.GENERAL.healingTypes[key].label),
                          total: roll.system.damage[key].total
                      }))
                    : null
            };
        });

        const initiatorChar = this.party.find(x => x.id === this.data.initiator.id);
        context.initiator = {
            character: initiatorChar,
            cost: this.data.initiator.cost
        };

        const selectedMember = Object.values(context.members).find(x => x.selected);
        const selectedIsCritical = selectedMember?.roll?.system?.isCritical;
        context.selectedData = {
            result: selectedMember
                ? `${selectedMember.roll.system.roll.total} ${selectedMember.roll.system.roll.result.label}`
                : null,
            damageValues: null
        };

        for (const member of Object.values(context.members)) {
            if (!member.roll) continue;
            if (context.usesDamage) {
                if (!context.selectedData.damageValues) context.selectedData.damageValues = {};
                for (let damage of member.damageValues) {
                    const damageTotal = member.roll.system.isCritical
                        ? damage.total
                        : selectedIsCritical
                          ? damage.total + (await getCritDamageBonus(member.roll.system.damage[damage.key].formula))
                          : damage.total;
                    if (context.selectedData.damageValues[damage.key]) {
                        context.selectedData.damageValues[damage.key].total += damageTotal;
                    } else {
                        context.selectedData.damageValues[damage.key] = {
                            ...foundry.utils.deepClone(damage),
                            total: damageTotal
                        };
                    }
                }
            }
        }

        context.showResult = Object.values(context.members).reduce((enabled, member) => {
            if (!member.roll) return enabled;
            if (context.usesDamage) {
                enabled = enabled === null ? member.damageValues.length > 0 : enabled && member.damageValues.length > 0;
            } else {
                enabled = enabled === null ? Boolean(member.roll) : enabled && Boolean(member.roll);
            }

            return enabled;
        }, null);

        context.createDisabled =
            !context.selectedData.result ||
            !this.data.initiator.id ||
            Object.keys(this.data.members).length === 0 ||
            Object.values(context.members).some(x =>
                context.usesDamage ? !x.damageValues || x.damageValues.length === 0 : !x.roll
            );

        return context;
    }

    async updateSource(update) {
        await this.data.updateSource(update);

        if (game.user.isGM) {
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll, this.data.toObject());
            Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.TagTeamRoll });
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: {
                    refreshType: RefreshType.TagTeamRoll
                }
            });
        } else {
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateSetting,
                    uuid: CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll,
                    update: this.data.toObject(),
                    refresh: { refreshType: RefreshType.TagTeamRoll }
                }
            });
        }
    }

    static async updateData(_event, _element, formData) {
        const { selectedAddMember, initiator } = foundry.utils.expandObject(formData.object);
        const update = { initiator: initiator };
        if (selectedAddMember) {
            const member = await foundry.utils.fromUuid(selectedAddMember);
            update[`members.${member.id}`] = { messageId: null };
        }

        await this.updateSource(update);
        this.render();
    }

    static async #removeMember(_, button) {
        const update = { [`members.-=${button.dataset.characterId}`]: null };
        if (this.data.initiator.id === button.dataset.characterId) {
            update.iniator = { id: null };
        }

        await this.updateSource(update);
    }

    static async #unlinkMessage(_, button) {
        await this.updateSource({ [`members.${button.id}.messageId`]: null });
    }

    static async #selectMessage(_, button) {
        const member = this.data.members[button.id];
        const currentSelected = Object.keys(this.data.members).find(key => this.data.members[key].selected);
        const curretSelectedUpdate =
            currentSelected && currentSelected !== button.id ? { [`${currentSelected}`]: { selected: false } } : {};
        await this.updateSource({
            members: {
                [`${button.id}`]: { selected: !member.selected },
                ...curretSelectedUpdate
            }
        });
    }

    static async #createTagTeam() {
        const mainRollId = Object.keys(this.data.members).find(key => this.data.members[key].selected);
        const mainRoll = game.messages.get(this.data.members[mainRollId].messageId);

        if (this.data.initiator.cost) {
            const initiator = this.party.find(x => x.id === this.data.initiator.id);
            if (initiator.system.resources.hope.value < this.data.initiator.cost) {
                return ui.notifications.warn(
                    game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.insufficientHope')
                );
            }
        }

        const secondaryRolls = Object.keys(this.data.members)
            .filter(key => key !== mainRollId)
            .map(key => game.messages.get(this.data.members[key].messageId));

        const systemData = foundry.utils.deepClone(mainRoll).system.toObject();
        const criticalRoll = systemData.roll.isCritical;
        for (let roll of secondaryRolls) {
            if (roll.system.hasDamage) {
                for (let key in roll.system.damage) {
                    var damage = roll.system.damage[key];
                    const damageTotal =
                        !roll.system.isCritical && criticalRoll
                            ? (await getCritDamageBonus(damage.formula)) + damage.total
                            : damage.total;
                    if (systemData.damage[key]) {
                        const updatedDamageParts = damage.parts;
                        if (!roll.system.isCritical && criticalRoll) {
                            for (let part of updatedDamageParts) {
                                const criticalDamage = await getCritDamageBonus(part.formula);
                                if (criticalDamage) {
                                    damage.formula = `${damage.formula} + ${criticalDamage}`;
                                    part.formula = `${part.formula} + ${criticalDamage}`;
                                    part.modifierTotal = part.modifierTotal + criticalDamage;
                                    part.total += criticalDamage;
                                    part.roll = new Roll(part.formula);
                                }
                            }
                        }

                        systemData.damage[key].formula = `${systemData.damage[key].formula} + ${damage.formula}`;
                        systemData.damage[key].total += damageTotal;
                        systemData.damage[key].parts = [...systemData.damage[key].parts, ...updatedDamageParts];
                    } else {
                        systemData.damage[key] = { ...damage, total: damageTotal, parts: updatedDamageParts };
                    }
                }
            }
        }

        systemData.title = game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.chatMessageRollTitle');
        const cls = getDocumentClass('ChatMessage'),
            msgData = {
                type: 'dualityRoll',
                user: game.user.id,
                title: game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.title'),
                speaker: cls.getSpeaker({ actor: this.party.find(x => x.id === mainRollId) }),
                system: systemData,
                rolls: mainRoll.rolls,
                sound: null,
                flags: { core: { RollTable: true } }
            };

        await cls.create(msgData);

        const fearUpdate = { key: 'fear', value: null, total: null, enabled: true };
        for (let memberId of Object.keys(this.data.members)) {
            const resourceUpdates = [];
            const rollGivesHope = systemData.roll.isCritical || systemData.roll.result.duality === 1;
            if (memberId === this.data.initiator.id) {
                const value = this.data.initiator.cost
                    ? rollGivesHope
                        ? 1 - this.data.initiator.cost
                        : -this.data.initiator.cost
                    : 1;
                resourceUpdates.push({ key: 'hope', value: value, total: -value, enabled: true });
            } else if (rollGivesHope) {
                resourceUpdates.push({ key: 'hope', value: 1, total: -1, enabled: true });
            }
            if (systemData.roll.isCritical) resourceUpdates.push({ key: 'stress', value: -1, total: 1, enabled: true });
            if (systemData.roll.result.duality === -1) {
                fearUpdate.value = fearUpdate.value === null ? 1 : fearUpdate.value + 1;
                fearUpdate.total = fearUpdate.total === null ? -1 : fearUpdate.total - 1;
            }

            this.party.find(x => x.id === memberId).modifyResource(resourceUpdates);
        }

        if (fearUpdate.value) {
            this.party.find(x => x.id === mainRollId).modifyResource([fearUpdate]);
        }

        /* Improve by fetching default from schema */
        const update = { members: [], initiator: { id: null, cost: 3 } };
        if (game.user.isGM) {
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll, update);
            Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.TagTeamRoll });
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: {
                    refreshType: RefreshType.TagTeamRoll
                }
            });
        } else {
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateSetting,
                    uuid: CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll,
                    update: update,
                    refresh: { refreshType: RefreshType.TagTeamRoll }
                }
            });
        }
    }

    static async assignRoll(char, message) {
        const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll);
        const character = settings.members[char.id];
        if (!character) return;

        await settings.updateSource({ [`members.${char.id}.messageId`]: message.id });

        if (game.user.isGM) {
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll, settings);
            Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.TagTeamRoll });
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: {
                    refreshType: RefreshType.TagTeamRoll
                }
            });
        } else {
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateSetting,
                    uuid: CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll,
                    update: settings,
                    refresh: { refreshType: RefreshType.TagTeamRoll }
                }
            });
        }
    }

    async close(options = {}) {
        Hooks.off(socketEvent.Refresh, this.setupHooks);
        await super.close(options);
    }
}
