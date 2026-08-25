import * as GENERAL from './generalConfig.mjs';
import * as DOMAIN from './domainConfig.mjs';
import * as ENCOUNTER from './encounterConfig.mjs';
import * as ACTOR from './actorConfig.mjs';
import * as RESOURCE from './resourceConfig.mjs';
import * as ITEM from './itemConfig.mjs';
import * as SETTINGS from './settingsConfig.mjs';
import * as EFFECTS from './effectConfig.mjs';
import * as ACTIONS from './actionConfig.mjs';
import * as FLAGS from './flagsConfig.mjs';
import * as HOOKS from './hooksConfig.mjs';
import * as TRIGGER from './triggerConfig.mjs';
import * as ITEMBROWSER from './itemBrowserConfig.mjs';
import * as LOOKUP from './lookupConfig.mjs';

/** @type {"daggerheart"} */
export const SYSTEM_ID = 'daggerheart';

export const SYSTEM = {
    id: SYSTEM_ID,
    ENCOUNTER,
    GENERAL,
    DOMAIN,
    ACTOR,
    RESOURCE,
    ITEM,
    SETTINGS,
    EFFECTS,
    ACTIONS,
    FLAGS,
    HOOKS,
    TRIGGER,
    ITEMBROWSER,
    LOOKUP,

    /**
     * Lore entries are used by items to link to the journal entry for the full description
     * These items can link to a journal directly, but this allows overrides without dealing with the
     * weaknesses of a uuid redirect (such as links ending with #headerName).
     * An empty string means that the journal isn't setup yet.
     */
    lore: {
        ancestry: {
            // Core
            clank: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#clank',
            drakona: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#drakona',
            dwarf: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#dwarf',
            elf: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#elf',
            faerie: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#faerie',
            faun: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#faun',
            firbolg: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#firbolg',
            fungril: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#fungril',
            galapa: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#galapa',
            giant: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#giant',
            goblin: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#goblin',
            halfling: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#halfling',
            human: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#human',
            infernis: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#infernis',
            katari: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#katari',
            orc: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#orc',
            ribbet: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#ribbet',
            simiah: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#simiah',

            // Hope and Fear
            aetheris: '',
            earthkin: '',
            emberkin: '',
            skykin: '',
            tidekin: '',
            gnome: ''
        },
        community: {
            // Core
            highborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#highborne',
            loreborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#loreborne',
            orderborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#orderborne',
            ridgeborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#ridgeborne',
            seaborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#seaborne',
            slyborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#slyborne',
            underborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#underborne',
            wanderborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#wanderborne',
            wildborne: 'Compendium.daggerheart.journals.JournalEntry.uNs7ne9VCbbu5dcG.JournalEntryPage.vm5MkqSRuy500afb#wildborne',

            // Hope and Fear
            duneborne: '',
            freeborne: '',
            frostborne: '',
            hearthborne: '',
            reborne: '',
            warborne: ''
        }
    }
};
