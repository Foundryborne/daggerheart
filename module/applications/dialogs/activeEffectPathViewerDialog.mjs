const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ActiveEffectPathViewer extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options) {
        super(options);

        this.searchValue = '';

        const pathData = game.system.api.applications.sheetConfigs.ActiveEffectConfig.getChangeChoices();
        this.pathGroups = pathData.reduce((acc, curr) => {
            if (!acc[curr.group]) acc[curr.group] = { name: curr.group, paths: [] };
            acc[curr.group].paths.push({
                ...curr,
                value: curr.isFullPath ? curr.value : `@system.${curr.value}`
            });

            return acc;
        }, {});
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dialog', 'dh-style', 'active-effect-change-paths-dialog'],
        position: {
            width: 612,
            height: 640
        },
        window: {
            resizable: true,
            icon: 'fa-solid fa-scroll',
            title: 'DAGGERHEART.APPLICATIONS.ActiveEffectPathViewer.title'
        },
        actions: {
            copyPath: ActiveEffectPathViewer.#onCopyPath,
            copyOpenMacro: ActiveEffectPathViewer.#onCopyOpenMacro
        }
    };

    /** @override */
    static PARTS = {
        main: {
            template: 'systems/daggerheart/templates/dialogs/activeEffectPathViewer.hbs',
            scrollable: ['.paths-container']
        }
    };

    /** @inheritDoc */
    _getFrameButtons(options) {
        const buttons = super._getFrameButtons(options);
        buttons.push({
            icon: 'fa-solid fa-scroll',
            label: 'DAGGERHEART.APPLICATIONS.ActiveEffectPathViewer.macroButtonLabel',
            action: 'copyOpenMacro'
        });
        return buttons;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
    
        htmlElement.querySelector('.path-search-input')
            .addEventListener('keydown', this.debouncedUpdateSearchValue.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.searchValue = this.searchValue;
        context.pathGroups = this.pathGroups;

        return context;
    }

    debouncedUpdateSearchValue = foundry.utils.debounce(this.onUpdateSearchValue, 200);

    onUpdateSearchValue(event) {
        this.searchValue = event.target.value.toLowerCase();

        for (const groupElement of this.element.querySelectorAll('.group-container')) {
            let anyVisible = false;
            for (const element of groupElement.querySelectorAll('.path-container')) {
                if (element.dataset.name.toLowerCase().includes(this.searchValue)) {
                    anyVisible = true;
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }

            if (anyVisible) {
                groupElement.classList.remove('hidden');
            } else {
                groupElement.classList.add('hidden');
            }
        }
    }

    static #onCopyPath(_event, button) {
        const { value, name } = button.closest('.path-container').dataset;
        game.clipboard.copyPlainText(value);
        ui.notifications.info(
            _loc('DAGGERHEART.APPLICATIONS.ActiveEffectPathViewer.copyPathNotification', { name: name })
        );
    }

    static #onCopyOpenMacro() {
        game.clipboard.copyPlainText('game.system.api.macros.showActiveEffectPathViewer();');
        ui.notifications.info(
            _loc('DAGGERHEART.APPLICATIONS.ActiveEffectPathViewer.macroCopyNotification')
        );
    }
}
