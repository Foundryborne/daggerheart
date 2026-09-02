export default class DhFolder extends foundry.documents.Folder {
    getDefaultEntity(options = { withInheritance: true }) {
        const defaultEntity = 
            this.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.folderFlags.defaultEntity);
        if (defaultEntity) return defaultEntity;
        if (!this.folder || !options.withInheritance) return null;

        return this.folder.getDefaultEntity();
    }
}