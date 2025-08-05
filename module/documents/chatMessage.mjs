export default class DhpChatMessage extends foundry.documents.ChatMessage {
    async renderHTML() {
        if (this.system.messageTemplate)
            this.content = await foundry.applications.handlebars.renderTemplate(this.system.messageTemplate, {
                ...this.system,
                _source: this.system._source
            });

        const actor = game.actors.get(this.speaker.actor);
        const actorData = actor ?? {
            img: this.author.avatar ? this.author.avatar : 'icons/svg/mystery-man.svg',
            name: ''
        };
        /* We can change to fully implementing the renderHTML function if needed, instead of augmenting it. */
        const html = await super.renderHTML({ actor: actorData, author: this.author });
        this.applyPermission(html);

        if (this.type === 'dualityRoll') {
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

        this.enrichChatMessage(html);

        return html;
    }

    applyPermission(html) {
        const elements = html.querySelectorAll('[data-perm-id]');
        elements.forEach(e => {
            const uuid = e.dataset.permId,
                document = fromUuidSync(uuid);
            if (!document) return;

            e.setAttribute('data-view-perm', document.testUserPermission(game.user, 'OBSERVER'));
            e.setAttribute('data-use-perm', document.testUserPermission(game.user, 'OWNER'));
        });
    }

    async _preCreate(data, options, user) {
        options.speaker = ChatMessage.getSpeaker();
        const rollActorOwner = data.rolls?.[0]?.data?.parent?.owner;
        if (rollActorOwner) {
            data.author = rollActorOwner ? rollActorOwner.id : data.author;
            await this.updateSource({ author: rollActorOwner ?? user });
        }

        return super._preCreate(data, options, rollActorOwner ?? user);
    }

    enrichChatMessage(html) {
        html.querySelectorAll('.damage-button').forEach(element =>
            element.addEventListener('click', this.onDamage.bind(this))
        );

        html.querySelectorAll('.duality-action-effect').forEach(element =>
            element.addEventListener('click', this.onApplyEffect.bind(this))
        );
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
}
