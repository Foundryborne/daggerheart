
export class ResourceUpdateMap extends Map {
    #actor;

    constructor(actor) {
        super();

        this.#actor = actor;
    }

    addResources(resources) {
        if (!resources?.length) return;
        const invalidResources = resources.some(resource => !resource.key);
        if (invalidResources) return;

        for (const resource of resources) {
            if (!resource.key) continue;

            const existing = this.get(resource.key);
            if (!existing || resource.clear) {
                this.set(resource.key, resource);
            } else if (!existing?.clear) {
                this.set(resource.key, {
                    ...existing,
                    value: existing.value + (resource.value ?? 0)
                });
            }
        }
    }

    #getResources() {
        return Array.from(this.values());
    }

    async updateResources() {
        if (this.#actor) {
            const target = this.#actor.system.partner ?? this.#actor;
            await target.modifyResource(this.#getResources());
        }
    }
}
