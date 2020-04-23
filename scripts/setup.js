'use strict';

const db = require('@arangodb').db;
const entityCollName = 'entityColl';
const ngsiEdgecollectionName = 'ngsiEdgeCollection';

if (!db._collection(entityCollName)) {
    db._createDocumentCollection(entityCollName);
}

if (!db._collection(ngsiEdgecollectionName)) {
    db._createEdgeCollection(ngsiEdgecollectionName);
}