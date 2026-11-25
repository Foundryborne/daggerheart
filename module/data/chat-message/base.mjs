export default class DhBaseChatData extends foundry.abstract.TypeDataModel {
    get isAuthor() {
        return this.parent?.isAuthor;
    }

    get author() {
        return this.parent?.author;
    }

    get speaker() {
        return this.parent?.speaker;
    }

    get speakerActor() {
        return this.parent?.speakerActor;
    }

    addChatListeners(html) {}
}