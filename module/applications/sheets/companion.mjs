import { GMUpdateEvent, socketEvent } from '../../helpers/socket.mjs';
import DhCompanionlevelUp from '../levelup/companionLevelup.mjs';
import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
export default class DhCompanionSheet extends DaggerheartSheet(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'actor', 'dh-style', 'companion'],
        position: { width: 700, height: 1000 },
        actions: {
            attackRoll: this.attackRoll,
            levelUp: this.levelUp
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        sidebar: { template: 'systems/daggerheart/templates/sheets/actors/companion/tempMain.hbs' }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelector('.partner-value')?.addEventListener('change', this.onPartnerChange.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.playerCharacters = game.actors
            .filter(
                x =>
                    x.type === 'character' &&
                    (x.ownership.default === 3 ||
                        x.ownership[game.user.id] === 3 ||
                        this.document.system.partner?.uuid === x.uuid)
            )
            .map(x => ({ key: x.uuid, name: x.name }));

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    async onPartnerChange(event) {
        if (event.target.value) {
            const partner = game.actors.find(a => a.uuid === event.target.value);
            await partner.update({ 'system.companion': this.document.uuid });
        } else {
            const update = { 'system.companion': null };
            if (
                this.document.system.partner.ownership.default !== 3 &&
                this.document.system.partner.ownership[game.user.id] !== 3
            ) {
                await game.socket.emit(`system.${SYSTEM.id}`, {
                    action: socketEvent.GMUpdate,
                    data: {
                        action: GMUpdateEvent.UpdateDocument,
                        uuid: this.document.system.partner.uuid,
                        update: update
                    }
                });
            } else {
                await this.document.system.partner.update(update);
            }
        }

        await this.document.update({ 'system.partner': event.target.value });
    }

    static async attackRoll(event) {
        this.actor.system.attack.use(event);
    }

    static async levelUp() {
        new DhCompanionlevelUp(this.document).render(true);
    }
}
