export default class DhFolder extends foundry.documents.Folder {
    getDefaultEntity(options = { withInheritance: true }) {
        const defaultEntity = 
            this.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.folderFlags.defaultEntity);
        if (defaultEntity) return defaultEntity;
        if (!this.folder || !options.withInheritance) return null;

        return this.folder.getDefaultEntity();
    }

    /** Convenience method to grab a folder via ID from the world collection or a specific pack
     * @param {string} id - The folder ID
     * @param {string} collectionName
     * @param {string} pack - Optional pack id.
     * @returns {DhFolder|null}
     */
    static getFolder(id, collectionName, pack) {
        const collection = pack ? game.packs.get(pack)?.folders : game[collectionName]?.folders;
        return collection?.get(id) ?? null;
    }
}