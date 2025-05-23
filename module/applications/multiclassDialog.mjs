const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhpMulticlassDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actorName, actorClass, resolve) {
        super({});

        this.actorName = actorName;
        this.actorClass = actorClass;
        this.resolve = resolve;

        this.classChoices = Array.from(
            game.items.reduce((acc, x) => {
                if (x.type === 'class' && x.name !== actorClass.name) {
                    acc.add(x);
                }

                return acc;
            }, new Set())
        );
        this.subclassChoices = [];
        this.domainChoices = [];

        this.data = {
            class: null,
            subclass: null,
            domain: null
        };
    }

    get title() {
        return `${this.actorName} - Multiclass`;
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'views', 'multiclass'],
        position: { width: 600, height: 'auto' },
        actions: {
            selectClass: this.selectClass,
            selectSubclass: this.selectSubclass,
            selectDomain: this.selectDomain,
            finish: this.finish
        }
    };

    static PARTS = {
        form: {
            id: 'levelup',
            template: 'systems/daggerheart/templates/views/multiclass.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.classChoices = this.classChoices;
        context.subclassChoices = this.subclassChoices;
        context.domainChoices = this.domainChoices;
        context.disabledFinish = !this.data.class || !this.data.subclass || !this.data.domain;
        context.data = this.data;

        return context;
    }

    static async selectClass(_, button) {
        const oldClass = this.data.class;
        this.data.class = this.data.class?.uuid === button.dataset.class ? null : await fromUuid(button.dataset.class);
        if (oldClass !== button.dataset.class) {
            this.data.subclass = null;
            this.data.domain = null;
            this.subclassChoices = this.data.class ? this.data.class.system.subclasses : [];
            this.domainChoices = this.data.class
                ? this.data.class.system.domains.map(x => {
                      const config = SYSTEM.DOMAIN.domains[x];
                      return {
                          name: game.i18n.localize(config.name),
                          id: config.id,
                          img: config.src,
                          disabled: this.actorClass.system.domains.includes(config.id)
                      };
                  })
                : [];
        }

        this.render(true);
    }

    static async selectSubclass(_, button) {
        this.data.subclass =
            this.data.subclass?.uuid === button.dataset.subclass
                ? null
                : this.subclassChoices.find(x => x.uuid === button.dataset.subclass);
        this.render(true);
    }

    static async selectDomain(_, button) {
        const domain =
            this.data.domain?.id === button.dataset.domain
                ? null
                : this.domainChoices.find(x => x.id === button.dataset.domain);
        if (domain?.disabled) return;

        this.data.domain = domain;
        this.render(true);
    }

    static finish() {
        this.close({}, this.data);
    }

    async close(options = {}, data = null) {
        this.resolve(data);
        super.close(options);
    }
}
