/**
 * A singleton class that handles preview templates.
 */

export default class DhTemplateManager {
    #activePreview;

    /**
     * Create a template preview, deactivating any existing ones.
     * @param {object} data
     */
    async createPreview(data) {
        const template = await canvas.templates._createPreview(data, { renderSheet: false });

        this.#activePreview = {
            document: template.document,
            object: template,
            origin: { x: template.document.x, y: template.document.y }
        };

        this.#activePreview.events = {
            contextmenu: this.#cancelTemplate.bind(this),
            mousedown: this.#confirmTemplate.bind(this),
            mousemove: this.#onDragMouseMove.bind(this),
            wheel: this.#onMouseWheel.bind(this)
        };
        canvas.stage.on('mousemove', this.#activePreview.events.mousemove);
        canvas.stage.on('mousedown', this.#activePreview.events.mousedown);

        canvas.app.view.addEventListener('wheel', this.#activePreview.events.wheel, true);
        canvas.app.view.addEventListener('contextmenu', this.#activePreview.events.contextmenu);
    }

    /**
     * Handles the movement of the temlate preview on mousedrag.
     * @param {mousemove Event} event
     */
    #onDragMouseMove(event) {
        event.stopPropagation();
        const { moveTime, object } = this.#activePreview;
        const update = {};

        const now = Date.now();
        if (now - (moveTime || 0) <= 16) return;
        this.#activePreview.moveTime = now;

        let cursor = event.getLocalPosition(canvas.templates);

        Object.assign(update, canvas.grid.getCenterPoint(cursor));

        object.document.updateSource(update);
        object.renderFlags.set({ refresh: true });
    }

    /**
     * Handles the rotation of the preview template on scrolling.
     * @param {wheel Event} event
     */
    #onMouseWheel(event) {
        if (!this.#activePreview) {
            return;
        }
        if (!event.shiftKey && !event.ctrlKey) return;
        event.stopPropagation();
        event.preventDefault();
        const { moveTime, object } = this.#activePreview;

        const now = Date.now();
        if (now - (moveTime || 0) <= 16) return;
        this.#activePreview.moveTime = now;

        const multiplier = event.shiftKey ? 0.2 : 0.1;

        object.document.updateSource({
            direction: object.document.direction + event.deltaY * multiplier
        });
        object.renderFlags.set({ refresh: true });
    }

    /**
     * Cancels the preview template on right-click.
     * @param {contextmenu Event} event
     */
    #cancelTemplate(event) {
        const { mousemove, mousedown, contextmenu, wheel } = this.#activePreview.events;
        canvas.templates._onDragLeftCancel(event);

        canvas.stage.off('mousemove', mousemove);
        canvas.stage.off('mousedown', mousedown);
        canvas.app.view.removeEventListener('contextmenu', contextmenu);
        canvas.app.view.removeEventListener('wheel', wheel);
    }

    /**
     * Creates a real MeasuredTemplate at the preview location and cancels the preview.
     * @param {click Event} event
     */
    #confirmTemplate(event) {
        event.stopPropagation();
        this.#cancelTemplate(event);

        canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [this.#activePreview.document.toObject()]);
        this.#activePreview = undefined;
    }
}
