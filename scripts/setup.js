'use strict';

const db = require('@arangodb').db;
const ngsicollectionName = 'ngsiCollection';
const ngsiEdgecollectionName = 'ngsiEdgeCollection';

if (!db._collection(ngsicollectionName)) {
    db._createDocumentCollection(ngsicollectionName);
}

if (!db._collection(ngsiEdgecollectionName)) {
    db._createEdgeCollection(ngsiEdgecollectionName);
}