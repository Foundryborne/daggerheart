const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Application toggled by canvas control in order to manually change the darkness level via slider */
export class SceneDarknessSlider extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: 'scene-darkness-slider',
        classes: ['application'],
        window: {
            frame: false,
            positioned: false
        },
        position: {
            height: 38
        }
    }

    static PARTS = {
        main: {
            template: 'systems/daggerheart/templates/ui/scene-darkness-slider.hbs',
            root: true
        }
    }

    scene = null;

    _prepareContext() {
        return {
            darknessLevel: canvas.scene._source.environment.darknessLevel
        };
    }

    async _onRender(...args) {
        await super._onRender(...args);
        const element = this.element;

        // Adjust position of this application's window
        const bounds = ui.controls.element.querySelector('button[data-tool="changeSceneDarknessLevel"]')?.getBoundingClientRect();
        const thisBounds = this.element.getBoundingClientRect();
        if (bounds) {
            element.style.left = `${bounds.right + 8}px`;
            
            const heightDiff = thisBounds ? thisBounds.height - bounds.height : 0;
            element.style.top = `${bounds.top - heightDiff / 2}px`; // shift it a bit down so that the tooltip doesn't obscure
        }

        const slider = element.querySelector('range-picker');
        slider?.addEventListener('change', () => {
            const value = Number(slider.value);
            const duration = value > canvas.scene.environment.darknessLevel
                ? CONFIG.Canvas.darknessToDaylightAnimationMS
                : CONFIG.Canvas.daylightToDarknessAnimationMS;
            canvas.scene.update(
                { 'environment.darknessLevel': value },
                { animateDarkness: Math.round(duration * Math.abs(canvas.scene.environment.darknessLevel - value)) }
            );
        });
    }

    toggleVisibility() {
        if (this.rendered) {
            this.close();
        } else {
            this.render({ force: true });
            game.tooltip.deactivate();
        }
    }
}
