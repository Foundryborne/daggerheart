import { getWorldActor, omit, resolveNearestDocument, sortBy } from '../../../helpers/utils.mjs';
import { ResetBatch } from '../reset-batch.mjs';

/** 
 * The main type data for a collosus adversary framework or part.
 * This class also hosts a distributed collection of the current linked state of any collosus tokens.
 * Certain places handle additional logic this can't handle:
 * 1) TokenDocument has some handling in _preCreate and _onCreate
 * 2) Scene has some handling in order to link token actors together when the scene is made
 */
export default class CollosusAdversaryType extends foundry.abstract.DataModel {
    /** A statically reset batch, to allow collosus parts to request sibling requests without infinite recursion or bad performance */
    static #resetBatch = new ResetBatch();

    /** 
     * The currently linked framework actor in the scene. Always empty for non-synthetic parts and framework actors.
     * @type {DhActor | null}
     */
    frameworkActor = null;

    /** 
     * The collection of currently managed parts of the collosus. Only has contents for framework actors/
     * @type {DhActor[]}
     */
    partActors = [];

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            type: new fields.StringField({ required: true, nullable: false, blank: false, initial: 'collosus' }),
            role: new fields.StringField({
                label: 'DAGGERHEART.ACTORS.Adversary.collosusType.FIELDS.role.label',
                choices: {
                    framework: 'DAGGERHEART.ACTORS.Adversary.collosusType.FIELDS.role.choices.framework',
                    part: 'DAGGERHEART.ACTORS.Adversary.collosusType.FIELDS.role.choices.part'
                },
                nullable: false,
                initial: 'framework'
            }),
            // todo: determine if this should be a type data field with ids
            // Currently its a bit hard to update
            parts: new fields.ArrayField(
                new fields.SchemaField({
                    uuid: new fields.DocumentUUIDField({ type: 'Actor' }),
                    quantity: new fields.NumberField({ integer: true, nullable: false, min: 0, max: 10, initial: 0 })
                })
            ),
            // Link data for the adversary. This is always blank for a world actor
            // Maybe consider if we get link data for the framework as well
            link: new fields.SchemaField({
                framework: new fields.DocumentUUIDField({ type: 'Actor', relativize: true })
                // Add something for part index (is it required) and part index relative to quantity (to distinguish left vs right arm)
            }, { nullable: true, initial: null })
        }
    }

    /** 
     * Fetches the framework actor of this actor, which can be itself.
     * This prioritizes the framework actor of the active group if its token, but otherwise it searches the compendium.
     */
    async fetchFrameworkActor() {
        const activeFrameworkActor = this.frameworkActor ?? (this.role === 'framework' ? resolveNearestDocument(this, Actor) : null);
        if (activeFrameworkActor) return activeFrameworkActor;
        const actor = resolveNearestDocument(this, Actor);
        if (!actor) return null;

        // If this is a token, find a token actor that would be suitable as a framework main one
        if (actor.token) {
            const mainCandidate = actor.token.scene.tokens.find(t =>
                t.actor?.type === 'adversary'
                && t.actor.system?.type === 'collosus'
                && t.actor.system.typeData?.role === 'framework'
                && t.actor.system.typeData.parts?.some(p => this.#testUuid(actor, p.uuid))
            );
            if (mainCandidate) return mainCandidate;
        }
        
        // For non-compendium actors, prioritize world actors over the compendiums 
        if (!actor.pack) {
            const candidateFrameworks = game.actors.filter(a =>
                a.type === 'adversary'
                && a.system.type === 'collosus'
                && a.system.typeData?.role === 'framework'
                && a.system.typeData.parts?.some(p => this.#testUuid(actor, p.uuid))
            );
            // todo: handle what happens if there are multiple candidates
            if (candidateFrameworks.length) return candidateFrameworks[0];
        }

        // Search in compendiums
        // TODO: test properly
        for (const pack of sortBy(game.packs.contents, p => p._id === actor.pack ? 0 : 1)) {
            const frameworks = await pack.getDocuments({
                type__in: ['adversary'],
                system: {
                    type__in: ['collosus'],
                    typeData: {
                        role__in: ['framework']
                    }
                }
            });
            const candidateFrameworks = frameworks.filter(
                f => f.system.typeData?.parts.some(p => this.#testUuid(actor, p.uuid)));
            // todo: handle what happens if there are multiple candidates
            if (candidateFrameworks.length) return candidateFrameworks[0];
        }

        return null;
    }

    /** 
     * Tests if a uuid is a valid match for an actor. Used mostly for part includes checks.
     * Checks the actor's uuid, the compendium source, the world source, and the world actor of a synthetic token.
     * @param {DhActor} actor
     * @param {string} uuid
     * @returns {boolean}
     */
    #testUuid(actor, uuid) {
        return [actor.uuid, actor.sourceUuid, actor._stats.duplicateSource, actor.token?.actorId ? `Actor.${actor.token.actorId}` : null]
            .filter(Boolean)
            .includes(uuid)
    }

    /** 
     * Fetches all actors for each part, and marks if the part is "active", meaning that it is present in the scene.
     * Primarily used for sheet rendering purposes, but could be used to "fill out" missing slots
     */
    async calculatePartStatus() {
        const actor = resolveNearestDocument(this, Actor);
        const frameworkActor = await this.fetchFrameworkActor();
        if (!frameworkActor) return null;

        const activeParts = [...(frameworkActor?.system.typeData?.partActors ?? [])];
        const data = [
            {
                uuid: frameworkActor.uuid,
                actor: frameworkActor,
                role: 'framework',
                active: frameworkActor === actor || frameworkActor === this.frameworkActor,
                current: frameworkActor === actor
            }
        ];

        // Finds a matching actor of the active ones, and removes from the collection (to support quantity comparisons, as we don't do slot assigns)
        const getMatchingActor = uuid => {
            if (!uuid) return null;
            const idx = activeParts.findIndex(a => this.#testUuid(a, uuid));
            if (idx >= 0) {
                const result = activeParts[idx];
                activeParts.splice(idx, 1);
                return result;
            }
        }

        for (const part of frameworkActor.system.typeData?.parts ?? []) {
            for (let i = 0; i < part.quantity; i++) {
                const activeActor = getMatchingActor(part.uuid);
                const resolvedActor = activeActor ?? await fromUuid(part.uuid);
                data.push({
                    uuid: part.uuid,
                    actor: resolvedActor,
                    role: 'part',
                    active: Boolean(activeActor) 
                        || this.#testUuid(resolvedActor, actor.uuid)
                        || this.#testUuid(resolvedActor, actor.sourceUuid),
                    current: resolvedActor === actor
                });
            }
        }

        return data;
    }

    /**
     * Create tokens for the parts in the scene
     * TODO: consider working for a part as well, although avoid the infinite recursion
     * @param {DhTokenDocument} token 
     */
    async placeParts(token) {
        const actor = resolveNearestDocument(this, Actor);
        if (this.role !== 'framework') {
            throw new Error('Only frameworks can place parts');
        }

        // Grabs missing parts and creates them.
        const missingParts = (await this.calculatePartStatus())
            .filter(p => p.role === 'part' && !p.active)
            .map(p => p.actor);
        
        const scene = token.scene;
        const toCreate = [];
        for (const basePartActor of missingParts) {
            if (basePartActor.system.type !== 'collosus') {
                ui.notifications.warn('Not a collosus part')
                return;
            }

            const partActor = await getWorldActor(basePartActor);
            // todo: consider also checking the type of this actor
            toCreate.push({
                ...omit(token.toObject(), ['_id', 'name']),
                actorId: partActor.id,
                actorLink: false,
                delta: {
                    system: {
                        typeData: {
                            link: {
                                framework: actor.uuid
                            }
                        }
                    }
                },
                x: token.x, // todo: offset, find an algorithm
                y: token.y // todo: offset, find an algorithm
            });
        }

        scene.createEmbeddedDocuments('Token', toCreate);
    }

    prepareBaseData() {
        const actor = resolveNearestDocument(this, Actor);
        const role = this.role;
        this.frameworkActor = fromUuidSync(this.link?.framework, { strict: false, relative: actor }) ?? null;
        this.partActors = [];

        // This should never happen, but if it does, clear it
        if (!actor.token) {
            this.link = null;
        }

        if (role === 'framework') {
            const token = actor.getActiveTokens().at(0)?.document;
            actor.system.resources.hitPoints = { value: 0, max: 0 };
            this.partActors = token?.scene?.tokens.filter(t => 
                t.actor?.type === 'adversary'
                && t.actor.system?.type === 'collosus'
                && t.actor.system.typeData?.role === 'part'
                && t.actor.system.typeData.link.framework === actor.uuid
            ).map(t => t.actor) ?? [];

            this.partActors = sortBy(this.partActors, p => [this.parts.findIndex(x => x.uuid === p.uuid), p.sort]);
        } else {
            actor.system.resources.stress = foundry.utils.deepClone(
                this.frameworkActor?.system?.resources.stress ?? { value: 0, max: 0 }
            );
            actor.system.damageThresholds = foundry.utils.deepClone(
                this.frameworkActor?.system?.damageThresholds ?? { major: 0, severe: 0 }
            );
            actor.system.experiences = foundry.utils.deepClone(
                this.frameworkActor?.system?.experiences ?? {}
            );
            actor.system.description ||= this.frameworkActor?.system?.description;
        }
    }

    async _preCreate(data) {
        // If this is a part token without a link, acquire the link
        // The actual handling of making sure token.actorLink is false is in the TokenDocument
        const typeData = data.system?.typeData;
        const actor = resolveNearestDocument(this, Actor);
        if (typeData?.role === 'part' && !data.link?.framework && actor?.token) {
            const mainCandidate = await this.fetchFrameworkActor();
            const mainCandidateToken = mainCandidate?.getActiveTokens()[0];
            if (mainCandidateToken) {
                typeData.link = { framework: mainCandidate.uuid };
            } else {
                // todo: add the main token, and cancel creating one, trusting the framework will add everything else
                throw new Error('TODO: Handle dragging part when main doesn\'t exist');
            }
        }
    }

    async _preUpdate(changes, options, user) {
        // Redirect stress updates to the framework actor 
        if (this.frameworkActor && typeof changes.system?.resources?.stress?.value === 'number') {
            this.frameworkActor.update({ 'system.resources.stress.value': changes.system.resources.stress.value });
            delete changes.system.resources.stress;
        }
    }

    async _onUpdate() {
        for (const part of this.partActors) {
            CollosusAdversaryType.#resetBatch.reset(part);
        }
    }
}
