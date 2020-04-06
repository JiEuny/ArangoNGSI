'use strict';
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
const joi = require('joi'); //imported from npm
const db = require('@arangodb').db;
const ngsiColl = db._collection('patientJSON');
const aql = require('@arangodb').aql;

// Registers the router with the Foxx service context
module.context.use(router);

// Add entry to patientJSON
router.post('/entries', function (req, res) {
  const data = req.body;
  const meta = ngsiColl.save(req.body);
  res.send(Object.assign(data, meta));
})
.body(joi.object().required(), 'Entry to store in the collection.')
.response(joi.object().required(), 'Entry stored in the collection.')
.summary('Store an entry')
.description('Stores an entry in the "ngsiCollection" collection.');

// get entry by key
router.get('/entries/:key', function (req, res) {
    try {
      const data = ngsiColl.document(req.pathParams.key);
      res.send(data)
    } catch (e) {
      if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
        throw e;
      }
      res.throw(404, 'The entry does not exist', e);
    }
  })
  .pathParam('key', joi.string().required(), 'Key of the entry.')
  .response(joi.object().required(), 'Entry stored in the collection.')
  .summary('Retrieve an entry by key')
  .description('Retrieves an entry from the "ngsiCollection" collection by key.');


