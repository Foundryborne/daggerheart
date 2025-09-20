import autocomplete from 'autocompleter';
import { abilities } from '../../config/actorConfig.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class GroupRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actors) {
        super();
        this.actors = actors;
        this.actorLeader = {};
        this.actorsMembers = [];
    }

    get title() {
        return 'Group Roll';
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'dh-style', 'dialog', 'group-roll'],
        position: { width: 'auto', height: 'auto' },
        actions: {
            roll: GroupRollDialog.#roll,
            removeLeader: GroupRollDialog.#removeLeader,
            removeMember: GroupRollDialog.#removeMember
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        application: {
            id: 'group-roll',
            template: 'systems/daggerheart/templates/dialogs/group-roll/group-roll.hbs'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        const changeChoices = this.actors;

        htmlElement.querySelectorAll('.leader-change-input').forEach(element => {
            autocomplete({
                input: element,
                fetch: function (text, update) {
                    if (!text) {
                        update(changeChoices);
                    } else {
                        text = text.toLowerCase();
                        var suggestions = changeChoices.filter(n => n.name.toLowerCase().includes(text));
                        update(suggestions);
                    }
                },
                render: function (actor, search) {
                    const actorName = game.i18n.localize(actor.name);
                    const matchIndex = actorName.toLowerCase().indexOf(search);

                    const beforeText = actorName.slice(0, matchIndex);
                    const matchText = actorName.slice(matchIndex, matchIndex + search.length);
                    const after = actorName.slice(matchIndex + search.length, actorName.length);
                    const img = document.createElement('img');
                    img.src = actor.img;

                    const element = document.createElement('li');
                    element.appendChild(img);

                    const label = document.createElement('span');
                    label.innerHTML = `${beforeText}${matchText ? `<strong>${matchText}</strong>` : ''}${after}`;
                    element.appendChild(label);

                    return element;
                },
                renderGroup: function (label) {
                    const itemElement = document.createElement('div');
                    itemElement.textContent = game.i18n.localize(label);
                    return itemElement;
                },
                onSelect: actor => {
                    element.value = actor.uuid;
                    this.actorLeader = { actor: actor, trait: '', difficulty: 0 };
                    this.render();
                },
                click: e => e.fetch(),
                customize: function (_input, _inputRect, container) {
                    container.style.zIndex = foundry.applications.api.ApplicationV2._maxZ;
                },
                minLength: 0
            });
        });

        htmlElement.querySelectorAll('.team-push-input').forEach(element => {
            autocomplete({
                input: element,
                fetch: function (text, update) {
                    if (!text) {
                        update(changeChoices);
                    } else {
                        text = text.toLowerCase();
                        var suggestions = changeChoices.filter(n => n.name.toLowerCase().includes(text));
                        update(suggestions);
                    }
                },
                render: function (actor, search) {
                    const actorName = game.i18n.localize(actor.name);
                    const matchIndex = actorName.toLowerCase().indexOf(search);

                    const beforeText = actorName.slice(0, matchIndex);
                    const matchText = actorName.slice(matchIndex, matchIndex + search.length);
                    const after = actorName.slice(matchIndex + search.length, actorName.length);
                    const img = document.createElement('img');
                    img.src = actor.img;

                    const element = document.createElement('li');
                    element.appendChild(img);

                    const label = document.createElement('span');
                    label.innerHTML = `${beforeText}${matchText ? `<strong>${matchText}</strong>` : ''}${after}`;
                    element.appendChild(label);

                    return element;
                },
                renderGroup: function (label) {
                    const itemElement = document.createElement('div');
                    itemElement.textContent = game.i18n.localize(label);
                    return itemElement;
                },
                onSelect: actor => {
                    element.value = actor.uuid;
                    this.actorsMembers.push({ actor: actor, trait: '', difficulty: 0 });
                    this.render({ force: true });
                },
                click: e => e.fetch(),
                customize: function (_input, _inputRect, container) {
                    container.style.zIndex = foundry.applications.api.ApplicationV2._maxZ;
                },
                minLength: 0
            });
        });
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.leader = this.actorLeader;
        context.members = [...this.actorsMembers];
        context.traitList = Object.values(abilities).map(trait => ({
            label: game.i18n.localize(trait.label),
            value: trait.id
        }));
        return context;
    }

    static async #removeLeader(_, button) {
        this.actorLeader = null;
        this.render();
    }

    static async #removeMember(_, button) {
        this.actorsMembers = this.actorsMembers.filter(m => m.actor.uuid !== button.dataset.memberUuid);
        this.render();
    }

    static async #roll(_, button) {
        console.log(this.leader, this.members);
        console.log(this);
    }
}
