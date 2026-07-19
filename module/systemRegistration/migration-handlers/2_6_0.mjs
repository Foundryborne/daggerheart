import { MigrationHandlerBase } from './base.mjs';

export class Migration_2_6_0 extends MigrationHandlerBase {
    version = '2.6.0';

    /** @inheritdoc */
    async updateActorSource(actor) {
        if (actor.type === 'party' && Object.keys(actor.system.tagTeam.members).length) {
            return {
                _id: actor._id,
                system: {
                    tagTeam: {
                        initiator: null,
                        members: _replace({})
                    }
                }
            };
        }
    }
}