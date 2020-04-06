'use strict';
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
const joi = require('joi'); //imported from npm
const db = require('@arangodb').db;
const ngsiColl = db._collection('ngsiCollection');
const ngsiEdgeColl = db._collection('ngsiEdgeCollection');
const patient = db._collection('patientJSON');
const aql = require('@arangodb').aql;

// Registers the router with the Foxx service context
module.context.use(router);

// Add entry to ngsiCollection
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

// get all
router.get('/entries', function (req, res) {
    try {
        res.send(ngsiColl.all())
    } catch(e) {
        res.send(e.toString())
    }
})
.summary('Retrieve all entries')
.description('Retrieves all entries from the "ngsiCollection" collection.');

// get all edge
router.get('/edge', function (req, res) {
    try {
        res.send(ngsiEdgeColl.all())
    } catch(e) {
        res.send(e.toString())
    }
})
.summary('Retrieve all edge entries')
.description('Retrieves all edge entries from the "ngsiEdgeCollection" collection.');

// csv to ngsi-ld data
router.post('/csv-to-ngsi', function (req, res) {
    const types = db._query(aql`
    FOR doc IN originCSV

    FOR att IN ATTRIBUTES(doc)
        FILTER LIKE(att, '%patient%')
        LET id = doc[att]
    FOR att1 IN ATTRIBUTES(doc)
        FILTER LIKE(att1, '%sex%')
        LET gender = doc[att1]
    FOR att2 IN ATTRIBUTES(doc)
        FILTER LIKE(att2, '%birth%')
        LET yearOfBirth = doc[att2]
    FOR att3 IN ATTRIBUTES(doc)
        FILTER LIKE(att3, '%region%')
        LET address = doc[att3]
    FOR att4 IN ATTRIBUTES(doc)
        FILTER LIKE(att4, '%group%')
        LET infectionBy_description = doc[att4]
    FOR att5 IN ATTRIBUTES(doc)
        FILTER LIKE(att5, '%reason%')
        LET infectionBy_relationship = doc[att5]
    FOR att8 IN ATTRIBUTES(doc)
        FILTER LIKE(att8, '%order%')
        LET orderOfTransmission = doc[att8]
    FOR att6 IN ATTRIBUTES(doc)
        FILTER LIKE(att6, '%by%')
        LET infectionBy_object = doc[att6]
    FOR att7 IN ATTRIBUTES(doc)
        FILTER LIKE(att7, '%state%')
        LET infectionStatus = doc[att7]
        
    INSERT {
        id: CONCAT("urn:covid-10:case:00", id),
        type: "InfectionCase",
        yearOfBirth: {
            type: "Property",
            value: yearOfBirth
        },
        address: {
            type: "Preperty",
            value: {
                addressCountry: "KR",
                addressRegion: address
            }
        },
        diseaseCode: {
            type: "Preperty",
            value: "COVID-19"
        },
        infectinStatus: {
            type: "Preperty",
            value: infectionStatus
        },
        orderOfTransmission: {
            type: "Preperty",
            value: orderOfTransmission
        },
        travelRoutes: {
            type: "Property",
            value: [
                {
                    placeName: "",
                    address: {
                        type: "Preperty",
                        value: {
                            addressCountry: "KR",
                            addressRegion: "",
                            addressLocality: "",
                            streetAddress: ""
                        }
                    },
                    location: {
                        type: "GeoProperty",
                        value: {
                            type: "Point",
                            coordinates: [
                                0,
                                0
                            ]
                        }
                    },
                    transport: "",
                    beginTime: "",
                    duration: 0
                },
                {
                    placeName: "",
                    address: {
                        type: "Preperty",
                        value: {
                            addressCountry: "KR",
                            addressRegion: "",
                            addressLocality: "",
                            streetAddress: ""
                        }
                    },
                    location: {
                        type: "GeoProperty",
                        value: {
                            type: "Point",
                            coordinates: [
                                0,
                                0
                            ]
                        }
                    },
                    transport: "",
                    beginTime: "",
                    duration: 0
                }
            ]
        },
        spreader: {
            type: "Relationship",
            object: CONCAT("urn:covid-10:case:00", infectionBy_object),
            spreaderInfo: {
                type: "Property",
                value: {
                    relationship: infectionBy_relationship,
                    description: infectionBy_description
                }
            }
        }
    } INTO ${ngsiColl}

    RETURN {
        id: id,
        gender: gender,
        yearOfBirth: yearOfBirth,
        address: address,
        infectionBy_description: infectionBy_description,
        infectionBy_relationship: infectionBy_relationship,
        orderOfTransmission: orderOfTransmission,
        infectionBy_object: infectionBy_object,
        infectionStatus: infectionStatus
    }
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})
.summary('store ngsi-ld data in ngsiCollection from csv data')
.description('store ngsi-ld data from csv data');

// add edge by ngsi-ld
router.post('/relationship-to-edge', function (req, res) {
    const types = db._query(aql`
        FOR doc IN ${ngsiColl}

        FOR name IN ATTRIBUTES(doc)
            FILTER LIKE(doc[name].type, '%Rel%')
            LET reladata = doc[name].object
            FILTER reladata != "urn:covid-10:case:00 "
            LET realdata = doc[name].object
            
        FOR to IN ${ngsiColl}
            FILTER to.id == reladata
        
        INSERT {
            _from: doc._id,
            _to: to._id,
            relationship: name,
            spreaderInfo: doc[name].spreaderInfo
        } INTO ${ngsiEdgeColl}
        
        RETURN {
            from: doc.id,
            rel: name,
            to: reladata,
            toKey: to._id,
            value: doc[name].spreaderInfo
        }`)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})
.summary('store ngsi-ld relationship data in ngsiEdgeCollection from ngsiCollection')
.description('store ngsi-ld relationship data from ngsiCollection');

// get relationship of relationship
router.get('/relationship', function (req, res) {
    const types = db._query(aql`
        FOR ed IN patientEdge
        FILTER ed._from == "patientJSON/615355"
        LET edge = ed._id

        FOR rel IN patientEdge
            FILTER rel._from == edge

        RETURN rel
        `)
        try {
            res.send(types);
        } catch(e) {
            res.send(e.toString())
        }
})
.summary('Relationship of Relationship')
.description('Relationship of Relationship')

