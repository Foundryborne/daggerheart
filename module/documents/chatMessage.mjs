export default class DhpChatMessage extends foundry.documents.ChatMessage {
    async renderHTML() {
        const actor = game.actors.get(this.speaker.actor);
        const actorData = actor && this.isContentVisible ? actor : {
            img: this.author.avatar ? this.author.avatar : 'icons/svg/mystery-man.svg',
            name: ''
        };
        /* We can change to fully implementing the renderHTML function if needed, instead of augmenting it. */
        const html = await super.renderHTML({ actor: actorData, author: this.author });

        this.enrichChatMessage(html);
        this.addChatListeners(html);

        return html;
    }

    enrichChatMessage(html) {
        const elements = html.querySelectorAll('[data-perm-id]');
        elements.forEach(e => {
            const uuid = e.dataset.permId,
                document = fromUuidSync(uuid);
            if (!document) return;

            e.setAttribute('data-view-perm', document.testUserPermission(game.user, 'OBSERVER'));
            e.setAttribute('data-use-perm', document.testUserPermission(game.user, 'OWNER'));
        });

        if (this.isContentVisible && this.type === 'dualityRoll') {
            html.classList.add('duality');
            switch (this.system.roll?.result?.duality) {
                case 1:
                    html.classList.add('hope');
                    break;
                case -1:
                    html.classList.add('fear');
                    break;
                default:
                    html.classList.add('critical');
                    break;
            }
        }
    }

    addChatListeners(html) {
        html.querySelectorAll('.damage-button').forEach(element =>
            element.addEventListener('click', this.onDamage.bind(this))
        );

        html.querySelectorAll('.duality-action-effect').forEach(element =>
            element.addEventListener('click', this.onApplyEffect.bind(this))
        );

        html.querySelectorAll('.roll-target').forEach(element => {
            element.addEventListener('mouseenter', this.hoverTarget);
            element.addEventListener('mouseleave', this.unhoverTarget);
            element.addEventListener('click', this.clickTarget);
        });
        
        html.querySelectorAll('.button-target-selection').forEach(element => {
            element.addEventListener('click', this.onTargetSelection.bind(this));
        });
    }

    getTargetList() {
        const targets = this.system.hitTargets;
        return targets.map(target => game.canvas.tokens.documentCollection.find(t => t.actor?.uuid === target.actorId));
    }

    async onDamage(event) {
        event.stopPropagation();
        const targets = this.getTargetList();

        if (this.system.onSave) {
            const pendingingSaves = this.system.hitTargets.filter(t => t.saved.success === null);
            if (pendingingSaves.length) {
                const confirm = await foundry.applications.api.DialogV2.confirm({
                    window: { title: 'Pending Reaction Rolls found' },
                    content: `<p>Some Tokens still need to roll their Reaction Roll.</p><p>Are you sure you want to continue ?</p><p><i>Undone reaction rolls will be considered as failed</i></p>`
                });
                if (!confirm) return;
            }
        }

        if (targets.length === 0)
            return ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelected'));

        for (let target of targets) {
            let damages = foundry.utils.deepClone(this.system.damage);
            if (
                !this.system.hasHealing &&
                this.system.onSave &&
                this.system.hitTargets.find(t => t.id === target.id)?.saved?.success === true
            ) {
                const mod = CONFIG.DH.ACTIONS.damageOnSave[this.system.onSave]?.mod ?? 1;
                Object.entries(damages).forEach(([k, v]) => {
                    v.total = 0;
                    v.parts.forEach(part => {
                        part.total = Math.ceil(part.total * mod);
                        v.total += part.total;
                    });
                });
            }

            this.consumeOnSuccess();
            if (this.system.hasHealing) target.actor.takeHealing(damages);
            else target.actor.takeDamage(damages);
        }
    }

    getAction(actor, itemId, actionId) {
        const item = actor.items.get(itemId),
            action =
                actor.system.attack?._id === actionId
                    ? actor.system.attack
                    : item.system.attack?._id === actionId
                      ? item.system.attack
                      : item?.system?.actions?.get(actionId);
        return action;
    }

    async onApplyEffect(event) {
        event.stopPropagation();
        const actor = await foundry.utils.fromUuid(this.system.source.actor);
        if (!actor || !game.user.isGM) return true;
        if (this.system.source.item && this.system.source.action) {
            const action = this.getAction(actor, this.system.source.item, this.system.source.action);
            if (!action || !action?.applyEffects) return;
            const targets = this.getTargetList();
            if (targets.length === 0)
                ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelected'));
            this.consumeOnSuccess();
            await action.applyEffects(event, this, targets);
        }
    }

    consumeOnSuccess() {
        if (!this.system.successConsumed && !this.system.targetSelection) {
            const action = this.system.action;
            if (action) action.consume(this.system, true);
        }
    }

    hoverTarget(event) {
        event.stopPropagation();
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (!token?.controlled) token._onHoverIn(event, { hoverOutOthers: true });
    }

    unhoverTarget(event) {
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (!token?.controlled) token._onHoverOut(event);
    }

    clickTarget(event) {
        event.stopPropagation();
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (!token) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.attackTargetDoesNotExist'));
            return;
        }
        game.canvas.pan(token);
    }

    onTargetSelection(event) {
        event.stopPropagation();
        this.system.targetMode = Boolean(event.target.dataset.targetHit);
    }
}
