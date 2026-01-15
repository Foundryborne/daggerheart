import { emitAsGM, GMUpdateEvent, RefreshType, socketEvent } from '../systemRegistration/socket.mjs';

export default class DhpChatMessage extends foundry.documents.ChatMessage {
    targetHook = null;

    async renderHTML() {
        const actor = game.actors.get(this.speaker.actor);
        const actorData =
            actor && this.isContentVisible
                ? actor
                : {
                      img: this.author.avatar ? this.author.avatar : 'icons/svg/mystery-man.svg',
                      name: ''
                  };
        /* We can change to fully implementing the renderHTML function if needed, instead of augmenting it. */
        const html = await super.renderHTML({ actor: actorData, author: this.author });

        if (this.flags.core?.RollTable) {
            html.querySelector('.roll-buttons.apply-buttons')?.remove();
        }

        this.enrichChatMessage(html);
        this.addChatListeners(html);

        return html;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    prepareData() {
        if (this.isAuthor && this.targetSelection === undefined) this.targetSelection = this.system.targets?.length > 0;
        super.prepareData();
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        if (this.system.registerTargetHook) this.system.registerTargetHook();
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _preDelete(options, user) {
        if (this.targetHook !== null) Hooks.off('targetToken', this.targetHook);
        return super._preDelete(options, user);
    }

    /** @inheritDoc */
    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);

        const lastMessage = Array.from(game.messages).sort((a, b) => b.timestamp - a.timestamp)[0];
        if (lastMessage.id === this.id && ui.chat.isAtBottom) {
            setTimeout(() => {
                ui.chat.scrollBottom();
            }, 5);
        }
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

        if (this.isContentVisible) {
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

            const autoExpandRoll = game.settings.get(
                    CONFIG.DH.id,
                    CONFIG.DH.SETTINGS.gameSettings.appearance
                ).expandRollMessage,
                rollSections = html.querySelectorAll('.roll-part'),
                itemDesc = html.querySelector('.domain-card-move');
            rollSections.forEach(s => {
                if (s.classList.contains('roll-section')) {
                    const toExpand = s.querySelector('[data-action="expandRoll"]');
                    toExpand.classList.toggle('expanded', autoExpandRoll.roll);
                } else if (s.classList.contains('damage-section'))
                    s.classList.toggle('expanded', autoExpandRoll.damage);
                else if (s.classList.contains('target-section')) s.classList.toggle('expanded', autoExpandRoll.target);
            });
            if (itemDesc && autoExpandRoll.desc) itemDesc.setAttribute('open', '');
        }

        if (!this.isAuthor && !this.speakerActor?.isOwner) {
            const applyButtons = html.querySelector('.apply-buttons');
            applyButtons?.remove();
            const buttons = html.querySelectorAll('.ability-card-footer > .ability-use-button');
            buttons.forEach(b => b.remove());
        }
    }

    addChatListeners(html) {
        html.querySelectorAll('.duality-action-damage').forEach(element =>
            element.addEventListener('click', this.onRollDamage.bind(this))
        );

        html.querySelectorAll('.damage-button').forEach(element =>
            element.addEventListener('click', this.onApplyDamage.bind(this))
        );

        html.querySelectorAll('.target-save').forEach(element =>
            element.addEventListener('click', this.onRollSave.bind(this))
        );

        html.querySelectorAll('.roll-all-save-button').forEach(element =>
            element.addEventListener('click', this.onRollAllSave.bind(this))
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

        html.querySelectorAll('.token-target-container').forEach(element => {
            if (element.dataset.token) {
                element.addEventListener('pointerover', this.hoverTarget);
                element.addEventListener('pointerout', this.unhoverTarget);
                element.addEventListener('click', this.clickTarget);
            }
        });
    }

    async onRollDamage(event) {
        event.stopPropagation();
        const config = foundry.utils.deepClone(this.system);
        config.event = event;
        if (this.system.action) {
            await this.system.action.addEffects(config);
            await this.system.action.workflow.get('damage')?.execute(config, this._id, true);
        }

        Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.TagTeamRoll });
        await game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.Refresh,
            data: {
                refreshType: RefreshType.TagTeamRoll
            }
        });
    }

    async onApplyDamage(event) {
        event.stopPropagation();
        const targets = this.filterPermTargets(this.system.hitTargets),
            config = foundry.utils.deepClone(this.system);
        config.event = event;

        if (this.system.onSave) {
            const pendingingSaves = targets.filter(t => t.saved.success === null);
            if (pendingingSaves.length) {
                const confirm = await foundry.applications.api.DialogV2.confirm({
                    window: { title: 'Pending Reaction Rolls found' },
                    content: `<p>Some Tokens still need to roll their Reaction Roll.</p><p>Are you sure you want to continue ?</p><p><i>Undone reaction rolls will be considered as failed</i></p>`
                });
                if (!confirm) return;
            }
        }

        if (targets.length === 0)
            return ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelectedOrPerm'));

        this.consumeOnSuccess();
        this.system.action?.workflow.get('applyDamage')?.execute(config, targets, true);
    }

    async onRollSave(event) {
        event.stopPropagation();
        const tokenId = event.target.closest('[data-token]')?.dataset.token,
            token = game.canvas.tokens.get(tokenId);
        if (!token?.actor || !token.isOwner) return true;
        if (this.system.source.item && this.system.source.action) {
            const action = this.system.action;
            if (!action || !action?.hasSave) return;
            game.system.api.fields.ActionFields.SaveField.rollSave.call(action, token.actor, event).then(result =>
                emitAsGM(
                    GMUpdateEvent.UpdateSaveMessage,
                    game.system.api.fields.ActionFields.SaveField.updateSaveMessage.bind(
                        action,
                        result,
                        this,
                        token.id
                    ),
                    {
                        action: action.uuid,
                        message: this._id,
                        token: token.id,
                        result
                    }
                )
            );
        }
    }

    async onRollAllSave(event) {
        event.stopPropagation();
        if (!game.user.isGM) return;
        const targets = this.system.hitTargets,
            config = foundry.utils.deepClone(this.system);
        config.event = event;
        this.system.action?.workflow.get('save')?.execute(config, targets, true);
    }

    async onApplyEffect(event) {
        event.stopPropagation();
        const targets = this.filterPermTargets(this.system.hitTargets),
            config = foundry.utils.deepClone(this.system);
        config.event = event;
        if (targets.length === 0)
            ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelectedOrPerm'));
        this.consumeOnSuccess();
        this.system.action?.workflow.get('effects')?.execute(config, targets, true);
    }

    filterPermTargets(targets) {
        return targets.filter(t => fromUuidSync(t.actorId)?.canUserModify(game.user, 'update'));
    }

    consumeOnSuccess() {
        if (!this.system.successConsumed && !this.targetSelection) this.system.action?.consume(this.system, true);
    }

    hoverTarget(event) {
        event.stopPropagation();
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (token && !token?.controlled) token._onHoverIn(event, { hoverOutOthers: true });
    }

    unhoverTarget(event) {
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (token && !token?.controlled) token._onHoverOut(event);
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
        if (!event.target.classList.contains('target-selected'))
            this.system.targetMode = Boolean(event.target.dataset.targetHit);
    }
}
