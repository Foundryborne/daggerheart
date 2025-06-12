export default class DhActiveEffect extends ActiveEffect {
    async _preCreate(data, options, user) {
        const update = {};
        if (!data.img) {
            update.img = 'icons/magic/life/heart-cross-blue.webp';
        }

        if (Object.keys(update).length > 0) {
            await this.updateSource(update);
        }

        await super._preCreate(data, options, user);
    }
}
