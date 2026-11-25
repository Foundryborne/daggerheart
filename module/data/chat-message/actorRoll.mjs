import { MoveContext } from '../action/move-context.mjs';
import { triggerChatRollFx } from '../../helpers/utils.mjs';
import { ChatDamageData } from './chatDamageData.mjs';
import DhBaseChatMessage from './base';
import { emitGMCreate } from '../../systemRegistration/socket.mjs';

const fields = foundry.data.fields;

export const originItemField = () =>
    new fields.SchemaField({
        type: new fields.StringField({
            choices: CONFIG.DH.ITEM.originItemType,
            initial: CONFIG.DH.ITEM.originItemType.itemCollection
        }),
        itemPath: new fields.StringField(),
        actionIndex: new fields.StringField()
    });

export default class DHActorRoll extends DhBaseChatMessage {
    constructor(data, options) {
        super(data, options);

        this.targeting = { usingSelect: !this.targets.length };
    }

    static defineSchema() {
        return {
            title: new fields.StringField(),
            actionDescription: new fields.HTMLField(),
            hasRoll: new fields.BooleanField({ initial: false }),
            hasDamage: new fields.BooleanField({ initial: false }),
            hasHealing: new fields.BooleanField({ initial: false }),
            hasEffect: new fields.BooleanField({ initial: false }),
            hasSave: new fields.BooleanField({ initial: false }),
            hasTarget: new fields.BooleanField({ initial: false }),
            reloadCheckValue: new fields.NumberField({ integer: true, nullable: true, initial: null }),
            isDirect: new fields.BooleanField({ initial: false }),
            onSave: new fields.StringField(),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({}),
                    actorId: new fields.StringField({}),
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    difficulty: new fields.NumberField({ integer: true, nullable: true }),
                    evasion: new fields.NumberField({ integer: true })
                })
            ),
            targetSaves: new fields.TypedObjectField(new fields.SchemaField({
                value: new fields.NumberField({ required: true, nullable: false, integer: true }),
                isCritical: new fields.BooleanField({ required: true, nullable: false })
            })),
            source: new fields.SchemaField({
                actor: new fields.StringField(),
                item: new fields.StringField(),
                originItem: originItemField(),
                action: new fields.StringField()
            }),
            damage: new fields.EmbeddedDataField(ChatDamageData),
            damageOptions: new fields.ObjectField(),
            costs: new fields.ArrayField(new fields.ObjectField()),
            uses: new fields.ObjectField(),
            successConsumed: new fields.BooleanField({ initial: false })
        };
    }

    get roll() {
        switch (this.parent.type) {
            case 'adversaryRoll':
                return this.parent.rolls.find(x => x instanceof game.system.api.dice.D20Roll);
            case 'dualityRoll':
                return this.parent.rolls.find(x => x instanceof game.system.api.dice.DualityRoll);
            case 'fateRoll':
                return this.parent.rolls.find(x => x instanceof game.system.api.dice.FateRoll);
        }

        return null;
    }

    get actionActor() {
        if (!this.source.actor) return null;
        const actor = fromUuidSync(this.source.actor);
        return actor instanceof Actor ? actor : null;
    }

    get item() {
        const actionActor = this.actionActor;
        if (!actionActor || !this.source.item) return null;
        
        return actionActor.items.get(this.source.item);
    }

    get actionItem() {
        switch (this.source.originItem.type) {
            case CONFIG.DH.ITEM.originItemType.restMove:
                const restMoves = game.system.settings.homebrew.restMoves;
                return Array.from(foundry.utils.getProperty(restMoves, `${this.source.originItem.itemPath}`).actions)[
                    this.source.originItem.actionIndex
                ];
            default:
                return this.item?.system.actionsList?.find(a => a.id === this.source.action);
        }
    }

    get hasReload() {
        return this.item?.system.hasReload;
    }

    get reloadCheckFailed() {
        return this.reloadCheckValue === 1;
    }

    get action() {
        const { actionActor, actionItem: itemAction } = this;
        if (!this.source.action) return null;
        if (itemAction) return itemAction;
        else if (actionActor?.system.attack?._id === this.source.action) return actionActor.system.attack;
        return null;
    }

    get currentHitTargets() {
        if (!this.hasRoll || this.targeting.usingSelect) return this._getCurrentTargets();

        return this._getCurrentTargets().filter(x => x.hitResult.success)
    }

    get hasUnfinishedSaves() {
        return this.hasSave && !this.targeting.usingSelect && this.currentHitTargets.some(x => !x.saveResult);
    }

    /** 
     * Returns if the roll would apply any effects
     * @returns {boolean}
     */
    get appliesEffects() {
        return this.hasEffect && !this.action?.evolution;
    }

    /** Returns a RollConfig object for the roll contained in this message */
    async getContext({ event } = {}) {
        const action = this.action;
        const config = await MoveContext.build({
            ...this.system,
            event,
            actor: action?.actor ?? this.actionActor,
            item: this.item,
            action,
            roll: this.roll?.options.roll ?? {
                type: action?.actionType ?? 'action'
            },
            costs: this.costs,
            evaluated: this.roll,
            damage: this.damage,
            message: this.parent
        });

        return config;
    }

    /** @inheritdoc */
    addChatListeners(html) {
        super.addChatListeners(html);

        for (const element of html.querySelectorAll('.duality-action-damage')) {
            element.addEventListener('click', this.onRollDamage.bind(this))
        }

        for (const element of html.querySelectorAll('.damage-button')) {
            element.addEventListener('click', this.onApplyDamage.bind(this));
        }

        for (const element of html.querySelectorAll('.duality-action-effect')) {
            element.addEventListener('click', this.onApplyEffect.bind(this));
        }

        for (const element of html.querySelectorAll('.action-areas')) {
            element.addEventListener('click', this.onCreateAreas.bind(this));
        }
    }

    /**
     * Get the target data for the current targets of the roll. 
     * This will either be the initial targets, or the currently selected tokens depending on which tab the GM has open.
     * @returns {TargetData[]}
     */
    _getCurrentTargets() {
        const getCommonData = data => {
            const actor = data.actorId ? foundry.utils.fromUuidSync(data.actorId) : null;
            const toHitNumber = data.difficulty || data.evasion;
            const hitSuccessfull = this.targeting.usingSelect ? true :
                ((toHitNumber === null || !this.roll) ? false : 
                    (this.roll.isCritical || this.roll.total >= toHitNumber));

            const saveData = this.targetSaves[data.id];
            const saveSuccessfull = (saveData === undefined || this.targeting.usingSelect) ? false : 
                saveData.isCritical || 
                (saveData.value >= (this.action.save.difficulty ?? this.action.actor?.baseSaveDifficulty));
            const hasResistData = this.hasDamage && this.damage?.main && actor;
            const resistData = hasResistData ? actor.getResistanceStatus(this.damage.main.options.damageTypes) : null;

            return {
                ...data,
                hitResult: this.hasRoll ? { success: hitSuccessfull } : null,
                saveResult: saveData ? { success: saveSuccessfull } : null,
                resistant: Boolean(resistData?.resistant),
                immune: Boolean(resistData?.immune)
            }
        }

        if (!this.targeting.usingSelect) return this.targets.map(getCommonData);

        return (canvas.tokens?.controlled ?? []).map(token => ({
            id: token.id,
            actorId: token.document.actor?.uuid,
            _actorId: token.document.actor?.id,
            name: token.document.prototype?.name ?? token.document.name,
            img: token.document.actor?.img ?? token.document.texture.src,
            difficulty: token.document.actor?.system.difficulty,
            evasion: token.document.actor?.system.evasion
        })).map(getCommonData);
    }

    /**
     * Returns the needed render data for the Selected tab of the targeting section.
     * @returns {{ totalTokens: number, uniqueTokens: number, tokens: TokenData[] }}
     */
    _getSelectedTargetsData() {
        if (!this.targeting.usingSelect) return [];

        const currentTargets = this._getCurrentTargets();
        const uniqueTokens = currentTargets.reduce((acc, target) => {
            if (acc.find(x => x._actorId === target._actorId)) return acc;
            acc.push(target);
            return acc;
        }, []);

        return {
            totalTokens: currentTargets.length,
            uniqueTokens: uniqueTokens.length,
            tokens: uniqueTokens.slice(0, 3)
        }
    }

    syncSelectedTokens = foundry.utils.debounce(async () => {
        if (!game.user.isGM) return;
        
        if (this.targeting.usingSelect && this.parent.id) this.updateTargetHTML();
    }, 50);

    /**
     * Updates the target section of the chat message through direct HTML manipulation.
     * Listeners are reattached.
     * @param {object} options
     * @param {"targets" | "select" | null} [options.tab] If set, switches to this tab before updates
     */
    async updateTargetHTML({ tab = null } = {}) {
        const chatMessageHTML = ui.chat.element.querySelector(`.chat-message[data-message-id="${this.parent.id}"]`);
        const element = chatMessageHTML.querySelector('.chat-roll .target-section .roll-part-content .wrapper');
        if (!element) return;

        if (tab) this.targeting.usingSelect = tab === 'select';
        const targetTokensHTML = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/ui/chat/parts/target-tokens-part.hbs',
            {
                targeting: this.targeting,
                currentTargets: this._getCurrentTargets(),
                selectedTargetsData: this._getSelectedTargetsData(),
                hasSave: this.hasSave,
                hasRoll: this.hasRoll,
                hasDamage: this.hasDamage,
                damage: this.damage,
                isGM: game.user.isGM
            }
        );

        element.outerHTML = targetTokensHTML;
        this.parent.addTargetSectionListeners(chatMessageHTML);
    }

    async getRerolledDamage() {
        if (!this.damage.active) return;

        const rerolls = [];
        const update = { system: { damage: { main: null, resources: _replace({}) } } };
        if (this.damage.main) {
            const reroll = await this.damage.main.reroll();
            rerolls.push(reroll);
            update.system.damage.main = reroll.toJSON();
        }

        for (const key of Object.keys(this.damage.resources)) {
            const reroll = await this.damage.resources[key].reroll();
            rerolls.push(reroll);
            update.system.damage.resources[key] = reroll.toJSON();
        }

        await triggerChatRollFx(rerolls);

        return update;
    }

    prepareDerivedData() {
        this.canViewSecret = this.parent.speakerActor?.testUserPermission(game.user, 'OBSERVER');
        this.canButtonApply = game.user.isGM; //temp
        this.isGM = game.user.isGM; //temp
    }

    static migrateData(source) {
        const { main, resources, ...flatDamageKeys } = source.damage ?? {};
        if (source.damage && !main && !resources) {
            source.damage.main = null;
            source.damage.resources = {};

            const getRoll = key => {
                const damageData = source.damage[key];
                const oldRoll = damageData.parts[0]?.roll;
                return oldRoll ? JSON.stringify({
                    ...oldRoll,
                    class: 'DamageRoll',
                    evaluated: true,
                    options: {
                        ...oldRoll.options,
                        damageTypes: damageData.parts[0].damageTypes ?? []
                    }
                }) : null;
            };

            for (const key of Object.keys(flatDamageKeys)) {
                if (key === 'hitPoints' && source.hasDamage && !source.hasHealing) {
                    source.damage.main = getRoll('hitPoints');
                } else {
                    source.damage.resources[key] = getRoll(key);
                }
            }
        }

        for (const key of Object.keys(source.targetSaves ?? {})) {
            const saveData = source.targetSaves[key];
            if (typeof saveData === 'number') {
                source.targetSaves[key] = { value: saveData, isCritical: false };
            }
        }

        for (const key of Object.keys(flatDamageKeys)) {
            delete source.damage[key];
        }
        
        return source;
    }

    /* -------------------------------------------- */
    /*  Event Listeners                             */
    /* -------------------------------------------- */

    async onRollDamage(event) {
        event.stopPropagation();
        const config = await this.getContext({ event });
        await this.action?.workflow.get('damage')?.execute(config, this._id, true);
    }

    async onApplyDamage(event) {
        event.stopPropagation();
        if (this._getCurrentTargets().length === 0)
            return ui.notifications.info(_loc('DAGGERHEART.UI.Notifications.noTargetsSelected'));

        const targets = this.currentHitTargets;
        if (targets.length === 0)
            return ui.notifications.info(_loc('DAGGERHEART.UI.Notifications.noTargetsHit'));

        const config = await this.getContext({ event });

        if (this.hasUnfinishedSaves) {
            const confirm = await foundry.applications.api.DialogV2.confirm({
                window: { title: _loc('DAGGERHEART.APPLICATIONS.PendingReactionsDialog.title') },
                content: `
                    <p>${_loc('DAGGERHEART.APPLICATIONS.PendingReactionsDialog.unfinishedRolls')}</p>
                    <p><i>${_loc('DAGGERHEART.APPLICATIONS.PendingReactionsDialog.warning')}</i></p>
                    <p>${_loc('DAGGERHEART.APPLICATIONS.PendingReactionsDialog.confirmation')}</p>
                `
            });
            if (!confirm) return;
        }

        this.parent.consumeOnSuccess();
        if (this.action) this.action.workflow.get('applyDamage')?.execute(config, targets, true);
        else {
            for (const target of targets) {
                const actor = foundry.utils.fromUuidSync(target.actorId);
                if (!actor) continue;

                if (this.hasHealing) actor.takeHealing(this.damage);
                else actor.takeDamage(this.damage, { actionUuid: this.action, isDirect: this.isDirect });
            }
        }
    }

    async onApplyEffect(event) {
        event.stopPropagation();
        if (this._getCurrentTargets().length === 0)
            return ui.notifications.info(_loc('DAGGERHEART.UI.Notifications.noTargetsSelected'));
        
        const targets = this.currentHitTargets;
        if (targets.length === 0)
            return ui.notifications.info(_loc('DAGGERHEART.UI.Notifications.noTargetsHit'));

        const config = await this.getContext({ event });

        if (this.hasUnfinishedSaves) {
            const confirm = await foundry.applications.api.DialogV2.confirm({
                window: { title: _loc('DAGGERHEART.APPLICATIONS.PendingReactionsDialog.title') },
                content: `
                    <p>${_loc('DAGGERHEART.APPLICATIONS.PendingReactionsDialog.unfinishedRolls')}</p>
                    <p><i>${_loc('DAGGERHEART.APPLICATIONS.PendingReactionsDialog.warning')}</i></p>
                    <p>${_loc('DAGGERHEART.APPLICATIONS.PendingReactionsDialog.confirmation')}</p>
                `
            });
            if (!confirm) return;
        }
        
        this.parent.consumeOnSuccess();
        this.action?.workflow.get('effects')?.execute(config, targets, true);
    }


    async onCreateAreas(event) {
        const createArea = async selectedArea => {
            const effects = selectedArea.effects.map(effect => this.action.item.effects.get(effect).uuid);
            const { shape: shapeType, size: range, hasHole } = selectedArea;
            const shapeData = CONFIG.Canvas.layers.regions.layerClass.getTemplateShape({ 
                shapeType, 
                range, 
                hasHole 
            });

            const scene = game.scenes.get(game.user.viewedScene);
            const level = scene.levels.find(x => x.isView);

            const regionData = {
                name: selectedArea.name,
                levels: level ? [level.id] : [],
                shapes: [shapeData],
                restriction: { enabled: false, type: 'move', priority: 0 },
                behaviors:
                    effects.length > 0
                        ? [
                            {
                                name: _loc('TYPES.RegionBehavior.applyActiveEffect'),
                                type: 'applyActiveEffect',
                                system: {
                                    effects: effects
                                }
                            }
                        ]
                        : [],
                displayMeasurements: true,
                locked: false,
                ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
                visibility: CONST.REGION_VISIBILITY.ALWAYS
            };
            const placeRegion = data => {
                canvas.regions.placeRegion(data, { 
                    create: true, 
                    attachToToken: selectedArea.type === CONFIG.DH.ACTIONS.areaTypes.attached.id 
                });
            };

            // Regions with effects must be placed by the GM
            if (effects.length > 0 && !game.user.isGM) {
                if (!game.users.activeGM)
                    return ui.notifications.error(
                        _loc('DAGGERHEART.UI.Notifications.behaviorRegionRequiresGM')
                    );

                const region = await canvas.regions.placeRegion(regionData, { create: false });
                emitGMCreate('Region', placeRegion, region, scene.id);
            } else {
                placeRegion(regionData);
            }
        };

        if (this.action.areas.length === 1) createArea(this.action.areas[0]);
        else if (this.action.areas.length > 1) {
            new foundry.applications.ux.ContextMenu.implementation(
                event.target,
                '.action-areas',
                this.action.areas.map(area => ({
                    label: area.name,
                    onClick: () => createArea(area)
                })),
                {
                    jQuery: false,
                    fixed: true
                }
            );

            CONFIG.ux.ContextMenu.triggerContextMenu(event, '.action-areas');
        }
    }
    
}
