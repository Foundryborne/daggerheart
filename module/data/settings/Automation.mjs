export default class DhAutomation extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
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
            playerCanEditSheet: new fields.BooleanField({
                required: true,
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.playerCanEditSheet.label'
            }),
            defeated: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.enabled.label'
                }),
                overlay: new fields.BooleanField({
                    required: true,
                    initial: true,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.overlay.label'
                }),
                characterDefault: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.defeatedConditions,
                    initial: CONFIG.DH.GENERAL.defeatedConditions.unconscious.id,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.characterDefault.label'
                }),
                adversaryDefault: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.defeatedConditions,
                    initial: CONFIG.DH.GENERAL.defeatedConditions.defeated.id,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.adversaryDefault.label'
                }),
                companionDefault: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.defeatedConditions,
                    initial: CONFIG.DH.GENERAL.defeatedConditions.defeated.id,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.defeated.companionDefault.label'
                })
            }),
            roll: new fields.SchemaField({
                roll: new fields.SchemaField({
                    // label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.roll.label',
                    // hint: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.roll.hint',
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
                    // label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.damage.label',
                    // hint: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.damage.hint',
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
                save: new fields.SchemaField({
                    // label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.save.label',
                    // hint: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.save.hint',
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
                damageApply: new fields.SchemaField({
                    // label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.damageApply.label',
                    // hint: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.damageApply.hint',
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
                    // label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.effect.label',
                    // hint: 'DAGGERHEART.SETTINGS.Automation.FIELDS.roll.effect.hint',
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
            })
        };
    }
}
