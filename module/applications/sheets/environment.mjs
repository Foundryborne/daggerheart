import DaggerheartSheet from './daggerheart-sheet.mjs';

const { DocumentSheetV2 } = foundry.applications.api;
export default class DhpEnvironment extends DaggerheartSheet(DocumentSheetV2) {
    constructor(options) {
        super(options);

        this.editMode = false;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'adversary', 'environment'],
        position: {
            width: 600,
            height: 'auto'
        },
        actions: {
            toggleSlider: this.toggleSlider,
            viewFeature: this.viewFeature,
            addFeature: this.addFeature,
            removeFeature: this.removeFeature,
            addTone: this.addTone,
            removeTone: this.removeTone,
            useFeature: this.useFeature
        },
        form: {
            handler: this._updateForm,
            closeOnSubmit: false,
            submitOnChange: true
        }
    };

    /** @override */
    static PARTS = {
        form: {
            id: 'form',
            template: 'systems/daggerheart/templates/sheets/environment.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    get title() {
        return `${game.i18n.localize('Environment')} - ${this.document.name}`;
    }

    async _prepareContext(_options) {
        return {
            title: `${this.document.name} - ${game.i18n.localize(SYSTEM.ACTOR.adversaryTypes[this.document.system.type].name)}`,
            user: this.document,
            source: this.document.toObject(),
            fields: this.document.schema.fields,
            data: {
                type: game.i18n.localize(SYSTEM.ACTOR.adversaryTypes[this.document.system.type].name),
                features: this.document.items.reduce((acc, x) => {
                    if (x.type === 'feature') {
                        const feature = x.toObject();
                        acc.push({
                            ...feature,
                            system: {
                                ...feature.system,
                                actionType: game.i18n.localize(SYSTEM.ITEM.actionTypes[feature.system.actionType].name)
                            },
                            uuid: x.uuid
                        });
                    }

                    return acc;
                }, [])
            },
            editMode: this.editMode,
            config: SYSTEM
        };
    }

    static async _updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    static toggleSlider() {
        this.editMode = !this.editMode;
        this.render();
    }

    static async viewFeature(_, button) {
        const move = await fromUuid(button.dataset.feature);
        move.sheet.render(true);
    }

    static async addFeature() {
        const result = await this.document.createEmbeddedDocuments('Item', [
            {
                name: game.i18n.localize('DAGGERHEART.Sheets.Environment.NewFeature'),
                type: 'feature'
            }
        ]);

        await result[0].sheet.render(true);
    }

    static async removeFeature(_, button) {
        await this.document.items.find(x => x.uuid === button.dataset.feature).delete();
    }

    static async addTone() {
        await this.document.update({ 'system.toneAndFeel': [...this.document.system.toneAndFeel, ''] });
    }

    static async removeTone(button) {
        await this.document.update({
            'system.toneAndFeel': this.document.system.toneAndFeel.filter(
                (_, index) => index !== Number.parseInt(button.dataset.tone)
            )
        });
    }

    static async useFeature(_, button) {
        const item = this.document.items.find(x => x.uuid === button.dataset.feature);

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/ability-use.hbs',
                {
                    title: game.i18n.format('DAGGERHEART.Chat.EnvironmentTitle', {
                        actionType: button.dataset.actionType
                    }),
                    card: { name: item.name, img: item.img, description: item.system.description }
                }
            )
        });

        cls.create(msg.toObject());
    }
}
