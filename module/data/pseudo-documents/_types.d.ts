import ApplicationV2 from '@client/applications/api/application.mjs';
import DataModel from '@common/abstract/data.mjs';

export type PseudoDocumentMetadata = {
    /* The document name of this pseudo-document. */
    name: string;
    /** The localization string for this pseudo-document */
    label: string;
    /** The font-awesome icon for this pseudo-document type */
    icon: string;
    /* Record of document names of pseudo-documents and the path to the collection. */
    embedded: Record<string, string>;
    /* The class used to render this pseudo-document. */
    sheetClass?: ApplicationV2;
    /* The default image used for newly created documents. */
    defaultArtwork: string;
};

/**
 * Base data model for pseudo-documents.
 */
declare class BasePseudoDocument extends DataModel {
    /** The _id which identifies this pseudo-document */
    _id: string;
    /** The name of this pseudo-document */
    name: string;
    /** An image file path which provides the artwork for this pseudo-document */
    img: string;
    /** An HTML text description for this pseudo-document */
    description: string;
}

/**
 * Data model for pseudo-documents.
 */
declare class PseudoDocument extends BasePseudoDocument {}
