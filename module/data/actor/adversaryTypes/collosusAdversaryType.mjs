import { calculateDepositLocations, getWorldActor, omit, resolveNearestDocument, sortBy } from '../../../helpers/utils.mjs';
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
                label: 'DAGGERHEART.ACTORS.Adversary.collosus.FIELDS.role.label',
                choices: {
                    framework: 'DAGGERHEART.ACTORS.Adversary.collosus.FIELDS.role.choices.framework',
                    part: 'DAGGERHEART.ACTORS.Adversary.collosus.FIELDS.role.choices.part'
                },
                nullable: false,
                initial: 'framework'
            }),
            // todo: determine if this should be a type data field with ids
            // Currently its a bit hard to update
            parts: new fields.ArrayField(
                new fields.SchemaField({
                    uuid: new fields.DocumentUUIDField({ type: 'Actor' }),
                    // Backup uuid after re-linking, used to restore the actor
                    originalUuid: new fields.DocumentUUIDField({ type: 'Actor' }),
                    quantity: new fields.NumberField({ integer: true, nullable: false, min: 0, max: 10, initial: 0 })
                })
            ),
            /**
             * Inverted link data for the collosus. This one is prioritized as the main framework for data propagation.
             * A collosus may still pick parts that are not the main one, if they don't exist.
             */
            frameworkUuid: new fields.DocumentUUIDField({ type: 'Actor', relativize: true, nullable: true, initial: null })
        }
    }

    /** 
     * Returns true if this actor is a linked framework of otherActor, or if the otherActor is a linked framework of this actor
     * A linked framework is the main candidate for data propagation from the framework to the part, to update certain stats.
     */
    async isLinkedFramework(otherActor) {
        const actor = resolveNearestDocument(this, Actor);
        const framework = [actor, otherActor].find(a => a?.system?.typeData?.role === 'framework');
        const part = [actor, otherActor].find(a => a?.system?.typeData?.role === 'part');
        if (!framework?.system?.typeData || !part?.system?.typeData) return false;

        // Special case - directly linked tokens
        if (part.token && part.system.typeData.frameworkActor === framework) return true;

        // If a part is a non-compendium actor and the framework is a compendium actor, its not linked directly
        if (part.pack !== framework.pack) return false;

        const matchingPart = framework.system.typeData.parts.find(p => this.#testUuid(part, p.uuid));
        if (!matchingPart) return false;

        // For unlinked tokens, it is linked if the fetchPartBaseActor retrieves it, as that's what propagation actually uses
        // Furthermore, this tries to handle the case in which the same part is referenced in multiple frameworks, by selecting the highest prioritized one
        const basePartActor = await this.#fetchPartBaseActor(matchingPart.uuid);
        if (basePartActor !== part) return false;
        const baseFramework = await part.system.typeData.fetchFrameworkActor({ compendium: Boolean(part.pack) });
        return baseFramework === framework;
    }

    /** 
     * Fetches the framework actor of this actor, which can be itself.
     * This prioritizes linked framework actor of the active group if its token, but otherwise it searches the compendium.
     */
    async fetchFrameworkActor({ compendium = true } = {}) {
        const activeFrameworkActor = this.frameworkActor ?? (this.role === 'framework' ? resolveNearestDocument(this, Actor) : null);
        if (activeFrameworkActor) return activeFrameworkActor;
        const actor = resolveNearestDocument(this, Actor);
        if (!actor) return null;

        const getPrioritized = candidates => {
            return candidates.find(c => c.system?.typeData?.parts?.some(p => p.uuid === actor.uuid)) ?? candidates[0];
        }

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
        // World actors are never frameworks for compendium parts 
        if (!actor.pack) {
            const candidateFrameworks = game.actors.filter(a =>
                a.type === 'adversary'
                && a.system.type === 'collosus'
                && a.system.typeData?.role === 'framework'
                && a.system.typeData.parts?.some(p => this.#testUuid(actor, p.uuid))
            );
            const result = getPrioritized(candidateFrameworks);
            if (result) return result;
        }

        // Search in same pack or in the pack of the compendium source
        const compendiumSourcePack = foundry.utils.parseUuid(actor._stats.compendiumSource)?.collection?.metadata?.id;
        const pack = game.packs.get(actor.pack ?? compendiumSourcePack);
        if (pack && compendium) {
            const frameworks = await pack.getDocuments({
                type__in: ['adversary'],
                system: {
                    type__in: ['collosus'],
                    typeData: {
                        role__in: ['framework']
                    }
                }
            });
            const result = getPrioritized(
                frameworks.filter(f => f.system.typeData?.parts.some(p => this.#testUuid(actor, p.uuid)))
            );
            if (result) return result;
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
        if (!actor) return false;
        return [actor.uuid, actor.sourceUuid, actor._stats?.duplicateSource, actor.token?.actorId ? `Actor.${actor.token.actorId}` : null]
            .filter(Boolean)
            .includes(uuid)
    }

    /** Fetches a part actor based on pack finding rules. Does not resolve active parts */
    async #fetchPartBaseActor(uuid) {
        const thisActor = resolveNearestDocument(this, Actor);
        const actor = await fromUuid(uuid);
        if (!actor) return null;
        return actor.pack && !thisActor.pack 
            ? game.actors.find(a => a._stats.compendiumSource === actor.uuid) ?? actor
            : actor;
    }

    /** 
     * Fetches all actors for each part, and marks if the part is "active", meaning that it is present in the scene.
     * Primarily used for sheet rendering purposes, but could be used to "fill out" missing slots
     */
    async calculatePartStatus() {
        const actor = resolveNearestDocument(this, Actor);
        const frameworkActor = await this.fetchFrameworkActor();
        if (!actor || !frameworkActor) return null;

        const isFrameworkActive = frameworkActor.token
            || (actor.pack && frameworkActor.pack)
            || frameworkActor.prototypeToken?.actorLink
            || (actor !== frameworkActor && !actor.token);
        const data = [
            {
                uuid: frameworkActor.uuid,
                actor: frameworkActor,
                role: 'framework',
                active: Boolean(isFrameworkActive) || actor === frameworkActor
            }
        ];

        // Finds a matching actor of the active ones, and removes from the collection (to support quantity comparisons, as we don't do slot assigns)
        const activeParts = [...(frameworkActor.system.typeData?.partActors ?? [])];
        if (actor.token && !activeParts.length && !isFrameworkActive) {
            // Without a framework actor, instead get all abandoned parts that *could* be partActors
            const validUuids = frameworkActor.system.typeData?.parts?.map(p => p.uuid);
            const actors = actor.token.scene?.tokens.filter(t => 
                t.actor?.type === 'adversary'
                && t.actor.system?.type === 'collosus'
                && t.actor.system.typeData?.role === 'part'
                && !t.actor.system.typeData?.frameworkActor
                && validUuids.some(u => this.#testUuid(t.actor, u))
            ).map(t => t.actor) ?? [];
            activeParts.push(...actors);
        }
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
                const baseActor = await this.#fetchPartBaseActor(part.uuid);
                const resolvedActor = activeActor ?? baseActor;
                data.push({
                    uuid: part.uuid,
                    quantity: part.quantity,
                    role: 'part',
                    actor: resolvedActor,
                    baseActor,
                    activeActor,
                    active: Boolean(actor.token ? activeActor : resolvedActor),
                    /** If true, the framework actor will propagate data to the token */
                    linked: await frameworkActor.system.typeData.isLinkedFramework(resolvedActor)
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
        token ??= actor?.token;
        if (this.role !== 'framework') {
            throw new Error('Only frameworks can place parts');
        } else if (!token) {
            throw new Error('A token is required to place part tokens');
        }

        // Part one, update abandoned parts, and assign to this one
        const abandonedParts = token.scene?.tokens.filter(t => 
            t.actor?.type === 'adversary'
            && t.actor.system?.type === 'collosus'
            && t.actor.system.typeData?.role === 'part'
            && !t.actor.frameworkActor
        )?.map(t => t.actor);
        if (abandonedParts?.length) {
            const updates = [];
            for (const part of this.parts ?? []) {
                for (let i = 0; i < part.quantity; i++) {
                    const matchIdx = abandonedParts.findIndex(a => this.#testUuid(a, part.uuid));
                    if (matchIdx >= 0) {
                        updates.push(abandonedParts[matchIdx].update({ 'system.typeData.frameworkUuid': actor.uuid }));
                        abandonedParts.splice(matchIdx, 1);
                    }
                }
            }
            if (updates.length) {
                await Promise.allSettled(updates);
                actor.reset(); // Re-acquire the part list
            }
        }

        // Grabs missing parts and creates them.
        const missingParts = (await this.calculatePartStatus())
            .filter(p => p.role === 'part' && p.actor && !p.actor.token)
            .map(p => p.actor);
        
        const scene = token.scene;
        const toCreate = [];
        for (const basePartActor of missingParts) {
            if (basePartActor.system.type !== 'collosus') {
                ui.notifications.warn('Not a collosus part')
                return;
            }

            const partActor = await getWorldActor(basePartActor);
            toCreate.push({
                ...omit(token.toObject(), ['_id', 'name']),
                actorId: partActor.id,
                actorLink: false,
                delta: {
                    system: {
                        typeData: {
                            frameworkUuid: actor.uuid
                        }
                    }
                },
                x: token.x,
                y: token.y // todo: offset, find an algorithm
            });
        }

        // Reposition tokens
        const animationDuration = 500;
        const newTokens = await scene.createEmbeddedDocuments('Token', toCreate);
        const positions = calculateDepositLocations(token, newTokens);
        for (const token of newTokens) {
            const position = positions.pop();
            token.update(
                { x: position.x, y: position.y, alpha: 1 },
                { animation: { duration: animationDuration } }
            );
        }

        // Re-acquire the part list
        actor.reset();
    }

    prepareBaseData() {
        const actor = resolveNearestDocument(this, Actor);
        const role = this.role;
        this.frameworkActor = fromUuidSync(this.frameworkUuid, { strict: false, relative: actor }) ?? null;
        this.partActors = [];

        // This should never happen, but if it does, clear it
        if (!actor.token) {
            this.link = null;
        }

        if (role === 'framework') {
            // If the uuid doesn't resolve and there is an originalUuid, point to compendium uuid instead.
            // This handles the user deleting a part, and allows fetching a new one from the compendium
            for (const part of this.parts) {
                if (part.originalUuid && !part.uuid.startsWith('Compendium.') && !fromUuidSync(part.uuid, { strict: false })) {
                    part.uuid = part.originalUuid;
                }
            }

            const token = actor.getActiveTokens().at(0)?.document;
            actor.system.resources.hitPoints = { value: 0, max: 0 };
            this.partActors = token?.scene?.tokens.filter(t => 
                t.actor?.type === 'adversary'
                && t.actor.system?.type === 'collosus'
                && t.actor.system.typeData?.role === 'part'
                && t.actor.system.typeData.frameworkUuid === actor.uuid
            ).map(t => t.actor) ?? [];

            this.partActors = sortBy(this.partActors, p => [this.parts.findIndex(x => x.uuid === p.uuid), p.sort]);
        } else if (this.frameworkActor) {
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
        } else if (role === 'part') {
            actor.system.resources.stress.readonly = true;
        }
    }

    /** 
     * Internal helper called by _preCreate() and _preUpdate() in order to convert compendium links to non-compendium variants.
     * It will claim parts that are not already claimed by other frameworks.
     * @param {object} data system data to modify
     */
    #relinkPartsData(data) {
        const actor = resolveNearestDocument(this, Actor);
        const role = data.system?.typeData?.role ?? actor.system.typeData?.role;
        if (actor.pack || actor.token || role !== 'framework') return;

        // Get the parts to check, and return early if all have been relinked
        const checkedParts = data.system?.typeData?.parts ?? actor.system.typeData?.parts ?? [];
        if (!checkedParts.some(p => p.uuid?.startsWith('Compendium.'))) return;

        const partRemaps = {};
        const otherFrameworks = game.actors.filter(a => a.type === 'adversary' && a.system.typeData?.role === 'framework' && a.id !== actor.id);
        const claimed = new Set(otherFrameworks.flatMap(f => f.system.typeData?.parts?.map(p => p.uuid) ?? []));
        for (const part of checkedParts) {
            if (!part.uuid?.startsWith('Compendium')) continue;

            const candidate = game.actors.find(a => a._stats.compendiumSource === part.uuid && !claimed.has(a.uuid));
            if (candidate) partRemaps[part.uuid] = candidate.uuid;
        }
        
        if (!foundry.utils.isEmpty(partRemaps)) {
            data.system ??= {};
            data.system.typeData = foundry.utils.mergeObject(data.system.typeData ?? {}, { 
                parts: checkedParts.map(p => ({ 
                    ...p, 
                    uuid: partRemaps[p.uuid] ?? p.uuid, 
                    originalUuid: p.uuid?.startsWith('Compendium') ? p.uuid : p.originalUuid
                }))
            })
        }
    }

    /* -------------------------------------------- */
    /*  Event Handlers                  */
    /* -------------------------------------------- */

    async _preCreate(data) {
        // If the main actor was dragged after the parts, perform a relink
        this.#relinkPartsData(data);

        // If this is a part token without a link, acquire the link
        // The actual handling of making sure token.actorLink is false is in the TokenDocument
        const typeData = data.system?.typeData;
        const actor = resolveNearestDocument(this, Actor);
        if (typeData?.role === 'part' && !data.frameworkUuid && actor?.token) {
            const mainCandidate = await this.fetchFrameworkActor();
            const mainCandidateToken = mainCandidate?.getActiveTokens()[0];
            if (mainCandidateToken) {
                typeData.link = { framework: mainCandidate.uuid };
            } else {
                // todo: add the main token, and cancel creating one, trusting the framework will add everything else
                throw new Error('TODO: Handle dragging part when main doesn\'t exist');
            }
        }

        // Remove originalUuids if this is in the pack
        if (data.system?.typeData?.parts?.length && actor.pack) {
            for (const part of data.system.typeData.parts) {
                part.originalUuid = null;
            }
        }
    }

    async _onCreate() {
        // Perform a post-create re-link if needed. Handles batch imports
        const actor = resolveNearestDocument(this, Actor);
        if (actor && !actor?.token && !actor.pack && this.role === 'framework') {
            const data = {};
            this.#relinkPartsData(data);
            if (data.system?.typeData?.parts) {
                actor.update(data);
            }
        }
    }

    async _preUpdate(changes, options, user) {
        // Relink parts on update
        this.#relinkPartsData(changes);

        // Part actors can't update stress value, but may redirect to the linked framework actor if there is one
        const hasStressValueChange = typeof changes.system?.resources?.stress?.value === 'number';
        if (hasStressValueChange && this.role === 'part') {
            if (this.frameworkActor) {
                this.frameworkActor?.update({ 'system.resources.stress.value': changes.system.resources.stress.value });
                delete changes.system.resources.stress;
            } else if (!options.fromCollosusFramework) {
                delete changes.system.resources.stress.value;
            }
        }
    }

    async _onUpdate() {
        // Propagate certain properties so they stay synced up even when they're not subject to data prep propagation
        // This is not necessary for active part actors, which sync data in prepareBaseData()
        // Most of the time, this will not lead to an update
        if (this.role === 'framework') {
            const thisActor = resolveNearestDocument(this, Actor);
            const parts = await Promise.all(this.parts.map(p => this.#fetchPartBaseActor(p.uuid)));
            const source = thisActor.system._source;
            for (const part of parts.filter(Boolean)) {
                const isLinked = await this.isLinkedFramework(part);
                if (!isLinked) continue;

                part.update({
                    system: {
                        tier: source.tier,
                        experiences: foundry.utils.deepClone(source.experiences),
                        damageThresholds: foundry.utils.deepClone(source.damageThresholds),
                        resources: {
                            stress: {
                                value: source.resources.stress?.value,
                                max: source.resources.stress?.max
                            }
                        }

                    }
                }, { fromCollosusFramework: true });
            }
        }

        this.frameworkActor?.sheet?.render();
        for (const part of this.partActors) {
            CollosusAdversaryType.#resetBatch.reset(part);
        }
    }

    _onDelete() {
        CollosusAdversaryType.#resetBatch.reset(this.frameworkActor);
        for (const part of this.partActors) {
            CollosusAdversaryType.#resetBatch.reset(part);
        }
    }
}
