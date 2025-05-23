export default function DhpApplicationMixin(Base) {
    return class DhpSheet extends Base {
        static applicationType = 'sheets';
        static documentType = '';

        static get defaultOptions() {
            return Object.assign(super.defaultOptions, {
                classes: ['daggerheart', 'sheet', this.documentType],
                template: `systems/${SYSTEM.id}/templates/${this.applicationType}/${this.documentType}.hbs`,
                height: 'auto',
                submitOnChange: true,
                submitOnClose: false,
                width: 450
            });
        }

        /** @override */
        get title() {
            const { documentName, type, name } = this.object;
            // const typeLabel = game.i18n.localize(CONFIG[documentName].typeLabels[type]);
            const typeLabel = documentName;
            return `[${typeLabel}] ${name}`;
        }

        // async _renderOuter() {
        //   const html = await super._renderOuter();
        //   // const overlaySrc = "systems/amia/assets/ThePrimordial.png";
        //   const overlay = `<div class="outer-render"></div>`
        //   $(html).find('.window-header').prepend(overlay);
        //   return html;
        // }

        activateListeners(html) {
            super.activateListeners(html);
            html.on('click', '[data-action]', this.#onClickAction.bind(this));
        }

        async #onClickAction(event) {
            event.preventDefault();
            const button = event.currentTarget;
            const action = button.dataset.action;

            return this._handleAction(action, event, button);
        }

        async _handleAction(action, event, button) {}
    };
}
