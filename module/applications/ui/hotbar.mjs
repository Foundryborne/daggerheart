export default class DhHotbar extends Hotbar {
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

    setupHooks() {
        Hooks.on('hotbarDrop', (bar, data, slot) => {
            if (['Item'].includes(data.type)) {
                const item = foundry.utils.fromUuidSync(data.uuid);
                if (typeof item === 'string') return true;

                switch (item.type) {
                    case 'ancestry':
                    case 'community':
                    case 'class':
                    case 'subclass':
                        return true;
                    default:
                        this.createItemMacro(data, slot);
                        return false;
                }
            }
        });
    }

    async createItemMacro(data, slot) {
        const macro = await Macro.implementation.create({
            name: `${game.i18n.localize('Display')} ${name}`,
            type: CONST.MACRO_TYPES.SCRIPT,
            img: 'icons/svg/book.svg',
            command: `await game.system.api.applications.ui.DhHotbar.useItem("${data.uuid}");`
        });
        await game.user.assignHotbarMacro(macro, slot);
        return false;
    }
}
