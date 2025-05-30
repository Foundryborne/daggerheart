export default class SelectDialog extends Dialog {
    constructor(data, options) {
        super(options);

        this.data = {
            title: data.title,
            buttons: data.buttons,
            content: foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/dialog/item-select.hbs',
                {
                    items: data.choices
                }
            )
        };

        this.actor = data.actor;
        this.actionCostMax = data.actionCostMax;
        this.nrChoices = data.nrChoices;
        this.validate = data.validate;
    }

    async getData(options = {}) {
        let buttons = Object.keys(this.data.buttons).reduce((obj, key) => {
            let b = this.data.buttons[key];
            b.cssClass = (this.data.default === key ? [key, 'default', 'bright'] : [key]).join(' ');
            if (b.condition !== false) obj[key] = b;
            return obj;
        }, {});

        const content = await this.data.content;

        return {
            content: content,
            buttons: buttons
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        $(html).find('.item-button').click(this.selectChoice);
    }

    selectChoice = async event => {
        if (this.validate) {
            if (!this.validate(event.currentTarget.dataset.validateProp)) {
                return;
            }
        }

        event.currentTarget.classList.toggle('checked');
        $(event.currentTarget).find('i')[0].classList.toggle('checked');

        const buttons = $(this.element[0]).find('button.checked');
        if (buttons.length === this.nrChoices) {
            $(event.currentTarget).closest('.window-content').find('.confirm')[0].disabled = false;
        } else {
            $(event.currentTarget).closest('.window-content').find('.confirm')[0].disabled = true;
        }
    };

    /**
     *
     * @param {*} data
     * choices, actor, title, cancelMessage, nrChoices, validate
     * @returns
     */
    static async selectItem(data) {
        return this.wait({
            title: data.title ?? 'Selection',
            buttons: {
                no: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('DAGGERHEART.General.Cancel'),
                    callback: _ => {
                        if (data.cancelMessage) {
                            ChatMessage.create({ content: data.cancelMessage });
                        }
                        return [];
                    }
                },
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('DAGGERHEART.General.OK'),
                    callback: html => {
                        const buttons = $(html).find('button.checked');
                        return buttons.map(key => Number.parseInt(buttons[key].dataset.index)).toArray();
                    },
                    disabled: true
                }
            },
            choices: data.choices,
            actor: data.actor,
            nrChoices: data.nrChoices ?? 1,
            validate: data.validate
        });
    }
}
