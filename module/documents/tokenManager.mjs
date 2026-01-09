/**
 * A singleton class that handles preview tokens.
 */

export default class DhTokenManager {
    #activePreview;
    #actor;
    #resolve;

    /**
     * Create a template preview, deactivating any existing ones.
     * @param {object} data
     */
    async createPreview(actor, tokenData) {
        this.#actor = actor;
        const token = await canvas.tokens._createPreview(
            {
                ...actor.prototypeToken,
                displayName: 50,
                ...tokenData
            },
            { renderSheet: false, actor }
        );

        this.#activePreview = {
            document: token.document,
            object: token,
            origin: { x: token.document.x, y: token.document.y }
        };

        this.#activePreview.events = {
            contextmenu: this.#cancelTemplate.bind(this),
            mousedown: this.#confirmTemplate.bind(this),
            mousemove: this.#onDragMouseMove.bind(this)
        };

        canvas.stage.on('mousemove', this.#activePreview.events.mousemove);
        canvas.stage.on('mousedown', this.#activePreview.events.mousedown);
        canvas.app.view.addEventListener('contextmenu', this.#activePreview.events.contextmenu);
    }

    /* Currently intended for using as a preview of where to create a token. (note the flag) */
    async createPreviewAsync(actor, tokenData = {}) {
        return new Promise(resolve => {
            this.#resolve = resolve;
            this.createPreview(actor, { ...tokenData, flags: { daggerheart: { createPlacement: true } } });
        });
    }

    /**
     * Handles the movement of the token preview on mousedrag.
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

        Object.assign(update, canvas.grid.getTopLeftPoint(cursor));

        object.document.updateSource(update);
        object.renderFlags.set({ refresh: true });
    }

    /**
     * Cancels the preview token on right-click.
     * @param {contextmenu Event} event
     */
    #cancelTemplate(_event, resolved) {
        const { mousemove, mousedown, contextmenu } = this.#activePreview.events;
        this.#activePreview.object.destroy();

        canvas.stage.off('mousemove', mousemove);
        canvas.stage.off('mousedown', mousedown);
        canvas.app.view.removeEventListener('contextmenu', contextmenu);
        if (this.#resolve && !resolved) this.#resolve(false);
    }

    /**
     * Creates a real Actor and token at the preview location and cancels the preview.
     * @param {click Event} event
     */
    async #confirmTemplate(event) {
        event.stopPropagation();
        this.#cancelTemplate(event, true);

        const actor = this.#actor.inCompendium
            ? await game.system.api.documents.DhpActor.create(this.#actor.toObject())
            : this.#actor;
        const tokenData = await actor.getTokenDocument();
        const result = await canvas.scene.createEmbeddedDocuments('Token', [
            { ...tokenData, x: this.#activePreview.document.x, y: this.#activePreview.document.y }
        ]);

        this.#activePreview = undefined;
        if (this.#resolve && result.length) this.#resolve(result[0]);
    }
}
