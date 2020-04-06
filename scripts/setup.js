'use strict';

const db = require('@arangodb').db;
const ngsicollectionName = 'patientJSON';

if (!db._collection(ngsicollectionName)) {
    db._createDocumentCollection(ngsicollectionName);
}