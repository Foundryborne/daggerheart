const { HandlebarsApplicationMixin } = foundry.applications.api;

export default function DhpApplicationMixin(Base) {
    return class DhpSheetV2 extends HandlebarsApplicationMixin(Base) {
        constructor(options = {}) {
            super(options);

            this._dragDrop = this._createDragDropHandlers();
        }

        _attachPartListeners(partId, htmlElement, options) {
            super._attachPartListeners(partId, htmlElement, options);

            this._dragDrop.forEach(d => d.bind(htmlElement));
        }

        static DEFAULT_OPTIONS = {
            position: {
                width: 480,
                height: 'auto'
            },
            actions: {
                onEditImage: this._onEditImage
            },
            dragDrop: []
        };

        async _prepareContext(_options, objectPath = 'document') {
            const context = await super._prepareContext(_options);
            context.source = this[objectPath];
            context.fields = this[objectPath].schema.fields;
            context.systemFields = this[objectPath].system ? this[objectPath].system.schema.fields : {};

            return context;
        }

        static _onEditImage(event, target) {
            const attr = target.dataset.edit;
            const current = foundry.utils.getProperty(this.document, attr);
            const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
            const fp = new foundry.applications.apps.FilePicker.implementation({
                current,
                type: 'image',
                redirectToRoot: img ? [img] : [],
                callback: async path => this._updateImage.bind(this)(path),
                top: this.position.top + 40,
                left: this.position.left + 10
            });
            return fp.browse();
        }

        async _updateImage(path) {
            await this.document.update({ img: path });
        }

        _createDragDropHandlers() {
            return this.options.dragDrop.map(d => {
                // d.permissions = {
                //   dragstart: this._canDragStart.bind(this),
                //   drop: this._canDragDrop.bind(this)
                // };
                d.callbacks = {
                    dragstart: this._onDragStart.bind(this),
                    // dragover: this._onDragOver.bind(this),
                    drop: this._onDrop.bind(this)
                };
                return new foundry.applications.ux.DragDrop.implementation(d);
            });
        }

        async _onDragStart(event) {}
        _onDrop(event) {}

        _getTabs(tabs) {
            for (const v of Object.values(tabs)) {
                v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
                v.cssClass = v.active ? 'active' : '';
            }

            return tabs;
        }
    };
}
