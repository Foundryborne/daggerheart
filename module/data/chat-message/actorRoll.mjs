import { triggerChatRollFx } from '../../helpers/utils.mjs';
import { ChatDamageData } from './chatDamageData.mjs';

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

export default class DHActorRoll extends foundry.abstract.TypeDataModel {
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
            targetSaves: new fields.TypedObjectField(new fields.NumberField({ integer: true })),
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
        return fromUuidSync(this.source.actor);
    }

    get item() {
        const actionActor = this.actionActor;
        if (!actionActor || !this.source.item) return null;
        
        return actionActor.items.get(this.source.item);
    }

    get actionItem() {
        switch (this.source.originItem.type) {
            case CONFIG.DH.ITEM.originItemType.restMove:
                const restMoves = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).restMoves;
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
        const currentTargets = this._getCurrentTargets();
        if (!this.hasRoll || this.targeting.usingSelect) return currentTargets;

        return currentTargets.filter(x => x.hitResult.success)
    }

    get hasUnfinishedSaves() {
        return this.hasSave && this.currentHitTargets.some(x => !x.saveResult);
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
            const hitSuccessfull = (toHitNumber === null || !this.roll) ? false : 
                (this.roll.isCritical || this.roll.total >= toHitNumber);

            const saveValue = this.targetSaves[data.id];
            const saveSuccessfull = saveValue === undefined ? false : 
                saveValue >= (this.action.save.difficulty ?? this.action.actor?.baseSaveDifficulty);
            const hasResistData = this.hasDamage && this.damage?.main && actor;
            const resistData = hasResistData ? actor.getResistanceStatus(this.damage.main.options.damageTypes) : null;

            return {
                ...data,
                hitResult: this.hasRoll ? { success: hitSuccessfull } : null,
                saveResult: saveValue ? { success: saveSuccessfull } : null,
                resistant: Boolean(resistData?.resistant),
                immune: Boolean(resistData?.immune)
            }
        };

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
        if (this.targeting.usingSelect) this.updateTargetHTML();
    }, 50);

    /**
     * Updates the target section of the chat message through direct HTML manipulation.
     * Listeners are reattached.
     * @param {object} options
     * @param {"targets" | "select" | null} [options.tab] If set, switches to this tab before updates
     */
    async updateTargetHTML({ tab = null } = {}) {
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
        const chatMessageHTML = ui.chat.element.querySelector(`.chat-message[data-message-id="${this.parent.id}"]`);
        const element = chatMessageHTML.querySelector('.chat-roll .target-section .roll-part-content .wrapper');
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
                } 
                else {
                    source.damage.resources[key] = getRoll(key);
                }
            }
        }

        for (const key of Object.keys(flatDamageKeys)) {
            delete source.damage[key];
        }
        
        return source;
    }
}
