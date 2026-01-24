export default class DhAutomation extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            summaryMessages: new fields.SchemaField({
                damage: new fields.BooleanField({ initial: true, label: 'DAGGERHEART.GENERAL.damage' }),
                effects: new fields.BooleanField({ initial: true, label: 'DAGGERHEART.GENERAL.Effect.plural' })
            }),
            hopeFear: new fields.SchemaField({
                gm: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.hopeFear.gm.label'
                }),
                players: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.hopeFear.players.label'
                })
            }),
            countdownAutomation: new fields.BooleanField({
                required: true,
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.countdownAutomation.label'
            }),
            levelupAuto: new fields.BooleanField({
                required: true,
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.levelupAuto.label'
            }),
            actionPoints: new fields.BooleanField({
                required: true,
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.actionPoints.label'
            }),
            hordeDamage: new fields.BooleanField({
                required: true,
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.hordeDamage.label'
            }),
            effects: new fields.SchemaField({
                rangeDependent: new fields.BooleanField({
                    initial: true,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.effects.rangeDependent.label'
                })
            }),
            damageReductionRulesDefault: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.ruleChoice,
                initial: CONFIG.DH.GENERAL.ruleChoice.onWithToggle.id,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.damageReductionRulesDefault.label'
            }),
            resourceScrollTexts: new fields.BooleanField({
                required: true,
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.resourceScrollTexts.label'
            }),
            defeated: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: true,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.enabled.label'
                }),
                overlay: new fields.BooleanField({
                    required: true,
                    initial: true,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.overlay.label'
                }),
                characterDefault: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.defeatedConditionChoices,
                    initial: CONFIG.DH.GENERAL.defeatedConditionChoices.deathMove.id,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.characterDefault.label'
                }),
                adversaryDefault: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.defeatedConditionChoices,
                    initial: CONFIG.DH.GENERAL.defeatedConditionChoices.dead.id,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.adversaryDefault.label'
                }),
                companionDefault: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.defeatedConditionChoices,
                    initial: CONFIG.DH.GENERAL.defeatedConditionChoices.defeated.id,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.companionDefault.label'
                }),
                deathMoveIcon: new fields.FilePathField({
                    initial: 'icons/magic/life/heart-cross-purple-orange.webp',
                    categories: ['IMAGE'],
                    base64: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.deathMove.label'
                }),
                deadIcon: new fields.FilePathField({
                    initial: 'icons/magic/death/grave-tombstone-glow-teal.webp',
                    categories: ['IMAGE'],
                    base64: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.dead.label'
                }),
                defeatedIcon: new fields.FilePathField({
                    initial: 'icons/magic/control/fear-fright-mask-orange.webp',
                    categories: ['IMAGE'],
                    base64: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.defeated.label'
                }),
                unconsciousIcon: new fields.FilePathField({
                    initial: 'icons/magic/control/sleep-bubble-purple.webp',
                    categories: ['IMAGE'],
                    base64: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.unconscious.label'
                })
            }),
            roll: new fields.SchemaField({
                roll: new fields.SchemaField({
                    gm: new fields.BooleanField({
                        required: true,
                        initial: false,
                        label: 'DAGGERHEART.GENERAL.gm'
                    }),
                    players: new fields.BooleanField({
                        required: true,
                        initial: false,
                        label: 'DAGGERHEART.GENERAL.player.plurial'
                    })
                }),
                damage: new fields.SchemaField({
                    gm: new fields.StringField({
                        required: true,
                        initial: 'never',
                        choices: CONFIG.DH.SETTINGS.actionAutomationChoices,
                        label: 'DAGGERHEART.GENERAL.gm'
                    }),
                    players: new fields.StringField({
                        required: true,
                        initial: 'never',
                        choices: CONFIG.DH.SETTINGS.actionAutomationChoices,
                        label: 'DAGGERHEART.GENERAL.player.plurial'
                    })
                }),
                save: new fields.SchemaField({
                    gm: new fields.StringField({
                        required: true,
                        initial: 'never',
                        choices: CONFIG.DH.SETTINGS.actionAutomationChoices,
                        label: 'DAGGERHEART.GENERAL.gm'
                    }),
                    players: new fields.StringField({
                        required: true,
                        initial: 'never',
                        choices: CONFIG.DH.SETTINGS.actionAutomationChoices,
                        label: 'DAGGERHEART.GENERAL.player.plurial'
                    })
                }),
                damageApply: new fields.SchemaField({
                    gm: new fields.BooleanField({
                        required: true,
                        initial: false,
                        label: 'DAGGERHEART.GENERAL.gm'
                    }),
                    players: new fields.BooleanField({
                        required: true,
                        initial: false,
                        label: 'DAGGERHEART.GENERAL.player.plurial'
                    })
                }),
                effect: new fields.SchemaField({
                    gm: new fields.BooleanField({
                        required: true,
                        initial: false,
                        label: 'DAGGERHEART.GENERAL.gm'
                    }),
                    players: new fields.BooleanField({
                        required: true,
                        initial: false,
                        label: 'DAGGERHEART.GENERAL.player.plurial'
                    })
                })
            }),
            triggers: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    nullable: false,
                    initial: true,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.triggers.enabled.label'
                })
            })
        };
    }
}
