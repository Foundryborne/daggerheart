import { emitGMUpdate, GMUpdateEvent } from '../../systemRegistration/socket.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * A UI element which displays the Users defined for this world.
 * Currently active users are always displayed, while inactive users can be displayed on toggle.
 *
 * @extends ApplicationV2
 * @mixes HandlebarsApplication
 */

export default class FearTracker extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);

        this._dragData = {
            isDragging: false,
            startX: 0,
            startY: 0,
            startLeft: 0,
            startTop: 0
        }
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'resources',
        classes: [],
        tag: 'div',
        window: {
            frame: false,
            title: 'DAGGERHEART.GENERAL.fear',
            positioned: true,
            resizable: true,
            minimizable: false
        },
        classes: ['daggerheart', 'dh-style', 'fear-tracker'],
        actions: {
            setFear: FearTracker.setFear,
            increaseFear: FearTracker.increaseFear
        },
        position: {
            width: 540,
            height: 'auto'
        }
    };

    /** @override */
    static PARTS = {
        resources: {
            root: true,
            template: 'systems/daggerheart/templates/ui/fearTracker.hbs'
        }
    };

    get currentFear() {
        return game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear);
    }

    get maxFear() {
        return game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxFear;
    }

    get fearPosition() {
        return game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).fearPosition;
    }

    /* -------------------------------------------- */
    /*  Rendering                                   */
    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(_options) {
        const display = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).displayFear,
            current = this.currentFear,
            max = this.maxFear,
            percent = (current / max) * 100,
            isGM = game.user.isGM,
            locked = false,
            isFree = this.fearPosition == 'free';

        return { display, current, max, percent, isGM, locked, isFree };
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);

        this.#setupDragging();
        this.#setupResizing();

        const fearPosition = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).fearPosition;

        if (options.isFirstRender) FearTracker.handleOffSet();
        if (!options.force) return;
        
        this.handleStyleElement(fearPosition);

        switch (fearPosition) {
            case 'topCenter':
                document.getElementById('ui-top')?.appendChild(this.element);
                break;
            case 'bottomCenter':
                document.getElementById('ui-bottom')?.prepend(this.element);
                break;
            case 'rightTop':
                document.getElementById('ui-right-column-1')?.appendChild(this.element);
                break;
            case 'leftBottom':
                document.getElementById('ui-left-column-1')?.insertBefore(this.element, document.getElementById('players'));
                break;
                
            default:
                document.body?.appendChild(this.element);
                const position =
                    game.user.getFlag(CONFIG.DH.id, 'app.resources.position') ?? FearTracker.DEFAULT_OPTIONS.position;
                this.setPosition(position);
                break;
        }
    }

    /** @override */
    async _preRender(context, options) {
        if (this.currentFear > this.maxFear && game.user.isGM)
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear, this.maxFear);
    }

    handleStyleElement(fearPosition) {
        for (const position of Object.values(CONFIG.DH.GENERAL.fearPosition)) {
            this.element.classList.remove(position.value); 
        }

        this.element.classList.add(fearPosition);
    }

    static handleOffSet() {
        const fearTracker = document.getElementById('resources');
        const hotbar = document.getElementById('hotbar');

        if (!fearTracker) return;

        const offset = Number(hotbar.style.getPropertyValue('--offset').replace(/px$/, '')) || 0;

        if (offset > 0) return;

        fearTracker.style.setProperty('--offset', `${offset - 13}px`);
    }

    _onPosition(position) {
        game.user.setFlag(CONFIG.DH.id, 'app.resources.position', position);
    }

    static async setFear(event, target) {
        if (!game.user.isGM) return;
        const fearCount = Number(target.dataset.index ?? 0);
        await this.updateFear(this.currentFear === fearCount + 1 ? fearCount : fearCount + 1);
    }

    static async increaseFear(event, target) {
        if (!game.user.isGM) return;
        let value = target.dataset.increment ?? 0,
            operator = value.split('')[0] ?? null;
        value = Number(value);
        await this.updateFear(operator ? this.currentFear + value : value);
    }

    async updateFear(value) {
        return emitGMUpdate(
            GMUpdateEvent.UpdateFear,
            game.settings.set.bind(game.settings, CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear),
            value
        );
    }

    // TODO: Remove methods later to use Foundry's dragger and resize methods 
    /* -------------------------------------------- */
    /*  Dragging handlers                           */
    /* -------------------------------------------- */
    #setupDragging() {
        const dragHandle = this.element.querySelector('.drag-handle');
        if (!dragHandle) return;
        dragHandle.addEventListener('mousedown', this.#onDragStart.bind(this));
    }

    #onDragStart(event) {
        if (event.button !== 0) return;
        this._dragData.isDragging = true;
        this._dragData.startX = event.clientX;
        this._dragData.startY = event.clientY;
        const rect = this.element.getBoundingClientRect();
        this._dragData.startLeft = rect.left;
        this._dragData.startTop = rect.top;
        this.element.style.cursor = 'grabbing';

        this._dragHandler = this.#onDragging.bind(this);
        this._dragEndHandler = this.#onDragEnd.bind(this);
        window.addEventListener('mousemove', this._dragHandler);
        window.addEventListener('mouseup', this._dragEndHandler);
    }

    #onDragging(event) {
        if (!this._dragData.isDragging) return;

        const dragX = event.clientX - this._dragData.startX;
        const dragY = event.clientY - this._dragData.startY;

        this.element.style.left = `${this._dragData.startLeft + dragX}px`;
        this.element.style.top = `${this._dragData.startTop + dragY}px`;
    }

    #onDragEnd() {
        if (!this._dragData.isDragging) return;
        this._dragData.isDragging = false;
        this.element.style.cursor = '';

        if (this._dragHandler) window.removeEventListener('mousemove', this._dragHandler);
        if (this._dragEndHandler) window.removeEventListener('mouseup', this._dragEndHandler);

        const rect = this.element.getBoundingClientRect();
        const pos = { top: rect.top, left: rect.left };
        
        this.setPosition(pos);
    }

    /* -------------------------------------------- */
    /*  Resize handlers                             */
    /* -------------------------------------------- */

    #setupResizing() {
        const resizeHandle = this.element.querySelector('.resize-handle');
        if (!resizeHandle) return;
        resizeHandle.addEventListener('mousedown', this.#onResizeStart.bind(this));
    }

    #onResizeStart(e) {
        if (e.button !== 0) return;
        e.stopPropagation();

        let maxAllowedWidth = 10000;

        this._resizeData = {
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: this.element.offsetWidth,
            startHeight: this.element.offsetHeight,
            maxAllowedWidth: Math.max(50, maxAllowedWidth)
        };

        this._resizeHandler = this.#onResizing.bind(this);
        this._resizeEndHandler = this.#onResizeEnd.bind(this);
        window.addEventListener('mousemove', this._resizeHandler);
        window.addEventListener('mouseup', this._resizeEndHandler);
    }

    #onResizing(e) {
        if (!this._resizeData?.isResizing) return;

        const currentDx = e.clientX - this._resizeData.startX;
        const potentialWidth = Math.max(50, this._resizeData.startWidth + currentDx);

        const width = Math.min(potentialWidth, this._resizeData.maxAllowedWidth);

        this.element.style.width = `${width}px`;

        if (width < 100) {
            this.element.classList.add('narrow');
        } else {
            this.element.classList.remove('narrow');
        }
    }

    #onResizeEnd() {
        if (!this._resizeData?.isResizing) return;
        this._resizeData.isResizing = false;

        if (this._resizeHandler) window.removeEventListener('mousemove', this._resizeHandler);
        if (this._resizeEndHandler) window.removeEventListener('mouseup', this._resizeEndHandler);

        let width = parseFloat(this.element.style.width);


        if (isNaN(width)) {
            width = this.element.getBoundingClientRect().width;
        }

        this.setPosition({ width: width });
    }
}
