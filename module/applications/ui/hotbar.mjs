export default class DhHotbar extends foundry.applications.ui.Hotbar {
    constructor(options) {
        super(options);

        this.setupHooks();
    }

    static async useItem(uuid) {
        const item = await fromUuid(uuid);
        if (!item) {
            return ui.notifications.warn('WARNING.ObjectDoesNotExist', {
                format: {
                    name: game.i18n.localize('Document'),
                    identifier: uuid
                }
            });
        }

        await item.use({});
    }

    static async useAction(itemUuid, actionId) {
        const item = await foundry.utils.fromUuid(itemUuid);
        if (!item) {
            return ui.notifications.warn('WARNING.ObjectDoesNotExist', {
                format: {
                    name: game.i18n.localize('Document'),
                    identifier: itemUuid
                }
            });
        }

        const action = item.system.actions.find(x => x.id === actionId);
        if (!action) {
            return ui.notifications.warn('DAGGERHEART.UI.Notifications.actionIsMissing');
        }

        await action.use({});
    }

    static async useAttack(actorUuid) {
        const actor = await foundry.utils.fromUuid(actorUuid);
        if (!actor) {
            return ui.notifications.warn('WARNING.ObjectDoesNotExist', {
                format: {
                    name: game.i18n.localize('Document'),
                    identifier: actorUuid
                }
            });
        }

        const attack = actor.system.attack;
        if (!attack) {
            return ui.notifications.warn('DAGGERHEART.UI.Notifications.attackIsMissing');
        }

        await attack.use({});
    }

    setupHooks() {
        Hooks.on('hotbarDrop', (bar, data, slot) => {
            if (data.type === 'Item') {
                const item = foundry.utils.fromUuidSync(data.uuid);
                if (item.uuid.startsWith('Compendium') || !item.isOwned || !item.isOwner) return true;

                switch (item.type) {
                    case 'ancestry':
                    case 'community':
                    case 'class':
                    case 'subclass':
                        return true;
                    default:
                        this.createItemMacro(item, slot);
                        return false;
                }
            } else if (data.type === 'Action') {
                const item = foundry.utils.fromUuidSync(data.data.itemUuid);
                if (item.uuid.startsWith('Compendium')) return true;
                if (!item.isOwned || !item.isOwner) {
                    ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.unownedActionMacro'));
                    return false;
                }

                this.createActionMacro(data, slot);
                return false;
            } else if (data.type === 'Attack') {
                const actor = foundry.utils.fromUuidSync(data.actorUuid);
                if (actor.uuid.startsWith('Compendium')) return true;
                if (!actor.isOwner) {
                    ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.unownedAttackMacro'));
                    return false;
                }

                this.createAttackMacro(data, slot);
                return false;
            }
        });
    }

    async createItemMacro(data, slot) {
        const macro = await Macro.implementation.create({
            name: `${game.i18n.localize('Display')} ${name}`,
            type: CONST.MACRO_TYPES.SCRIPT,
            img: data.img,
            command: `await game.system.api.applications.ui.DhHotbar.useItem("${data.uuid}");`
        });
        await game.user.assignHotbarMacro(macro, slot);
    }

    async createActionMacro(data, slot) {
        const macro = await Macro.implementation.create({
            name: `${game.i18n.localize('Display')} ${name}`,
            type: CONST.MACRO_TYPES.SCRIPT,
            img: data.data.img,
            command: `await game.system.api.applications.ui.DhHotbar.useAction("${data.data.itemUuid}", "${data.data.id}");`
        });
        await game.user.assignHotbarMacro(macro, slot);
    }

    async createAttackMacro(data, slot) {
        const macro = await Macro.implementation.create({
            name: `${game.i18n.localize('Display')} ${name}`,
            type: CONST.MACRO_TYPES.SCRIPT,
            img: data.img,
            command: `await game.system.api.applications.ui.DhHotbar.useAttack("${data.actorUuid}");`
        });
        await game.user.assignHotbarMacro(macro, slot);
    }
}
