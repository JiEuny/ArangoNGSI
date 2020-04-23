'use strict';
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
const joi = require('joi'); //imported from npm
const db = require('@arangodb').db;
const entityColl = db._collection('entityColl');
const ngsiEdgeColl = db._collection('ngsiEdgeCollection');
const patient = db._collection('patientJSON');
const aql = require('@arangodb').aql;

// Registers the router with the Foxx service context
module.context.use(router);

// Add entity or entities
router.post('/entities', function (req, res) {
    const multiple = Array.isArray(req.body);
    const body = multiple ? req.body : [req.body];
    const data = [];

    for (var doc of body) {
        const meta = entityColl.save(doc);
        data.push(Object.assign(doc, meta));
    }
    res.send(multiple ? data : data[0]);
})
.body(joi.alternatives().try(
    joi.object().required(), 
    joi.array().items(joi.object().required())), 
    'Entity or Entities to store in the entityColl')
.summary('Store entities or entity')
.description('Store entities or entity in the "entityColl" collection');

// // Add entry to ngsiCollection
// router.post('/entities', function (req, res) {
//     const data = req.body;
//     const meta = ngsiColl.save(req.body);
//     res.send(Object.assign(data, meta));
//   })
//   .body(joi.object().required(), 'Entry to store in the collection.')
//   .response(joi.object().required(), 'Entry stored in the collection.')
//   .summary('Store entities')
//   .description('Stores entities in the "ngsiCollection" collection.');

// get all
router.get('/entities', function (req, res) {
    try {
        res.send(entityColl.all())
    } catch(e) {
        res.send(e.toString())
    }
})
.summary('Retrieve all entries')
.description('Retrieves all entries from the "entityColl" collection.');


// // get entity by id
// router.get('/entities/:key', function (req, res) {
//     try {
//       const data = ngsiColl.document(req.pathParams.key);
//       res.send(data)
//     } catch (e) {
//       if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
//         throw e;
//       }
//       res.throw(404, 'The entry does not exist', e);
//     }

//   })
//   .pathParam('key', joi.string().required(), 'ID of the entity.')
//   .response(joi.object().required(), 'Entry stored in the collection.')
//   .summary('Retrieve an entity by id')
//   .description('Retrieves an entity from the "ngsiCollection" collection by id.');


// get entity by id
router.get('/entity', function (req, res) {

    const entityId = req.queryParams.entityId;
    
    const types = db._query(aql`
        FOR doc IN ${entityColl}
        FILTER doc.id == ${entityId}

        RETURN doc
        `)
        try {
            res.send(types);
        } catch(e) {
            res.send(e.toString())
        }
  })
  .queryParam('entityId', joi.string().required(), 'ID of the entity.')
  .response(joi.object().required(), 'Entry stored in the collection.')
  .summary('Retrieve an entity by id')
  .description('Retrieves an entity from the "ngsiCollection" collection by id.');

// update
router.patch('/entity', function (req, res) {
    //patch 작성할 것
})

// store properties
router.post('/properties', function (req, res) {
    const types = db._query(aql`
        FOR doc IN ${entityColl}

        FOR name IN ATTRIBUTES(doc)
            FILTER LIKE(doc[name].type, '%Property%')
        
        INSERT name INTO ''
    `) // need to put collection store property data

})

router.post('/edges', function (req, res) {
    const types = db._query(aql`
        FOR doc IN ${entityColl}

        FOR name IN ATTRIBUTES(doc)
            FILTER LIKE(doc[name].type, '%Relationship%')
            LET reladata = doc[name].object
            FILTER reladata != "urn:covid-10:case:00 "
            LET realdata = doc[name].object
            
        FOR to IN ${entityColl}
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
.summary('store ngsi-ld relationship data in ngsiEdgeCollection from entityColl')
.description('store ngsi-ld relationship data from entityColl');

// get all edge
router.get('/edges', function (req, res) {
    try {
        res.send(ngsiEdgeColl.all())
    } catch(e) {
        res.send(e.toString())
    }
})
.summary('Retrieve all edge entries')
.description('Retrieves all edge entries from the "ngsiEdgeCollection" collection.');


// add edge by ngsi-ld
router.post('/edges', function (req, res) {
    const types = db._query(aql`
        FOR doc IN ${entityColl}

        FOR name IN ATTRIBUTES(doc)
            FILTER LIKE(doc[name].type, '%Relationship%')
            LET reladata = doc[name].object
            FILTER reladata != "urn:covid-10:case:00 "
            LET realdata = doc[name].object
            
        FOR to IN ${entityColl}
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
.summary('store ngsi-ld relationship data in ngsiEdgeCollection from entityColl')
.description('store ngsi-ld relationship data from entityColl');

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



// // csv to ngsi-ld data
// router.post('/csv-to-ngsi', function (req, res) {
//     const types = db._query(aql`
//     FOR doc IN originCSV

//     FOR att IN ATTRIBUTES(doc)
//         FILTER LIKE(att, '%patient%')
//         LET id = doc[att]
//     FOR att1 IN ATTRIBUTES(doc)
//         FILTER LIKE(att1, '%sex%')
//         LET gender = doc[att1]
//     FOR att2 IN ATTRIBUTES(doc)
//         FILTER LIKE(att2, '%birth%')
//         LET yearOfBirth = doc[att2]
//     FOR att3 IN ATTRIBUTES(doc)
//         FILTER LIKE(att3, '%region%')
//         LET address = doc[att3]
//     FOR att4 IN ATTRIBUTES(doc)
//         FILTER LIKE(att4, '%group%')
//         LET infectionBy_description = doc[att4]
//     FOR att5 IN ATTRIBUTES(doc)
//         FILTER LIKE(att5, '%reason%')
//         LET infectionBy_relationship = doc[att5]
//     FOR att8 IN ATTRIBUTES(doc)
//         FILTER LIKE(att8, '%order%')
//         LET orderOfTransmission = doc[att8]
//     FOR att6 IN ATTRIBUTES(doc)
//         FILTER LIKE(att6, '%by%')
//         LET infectionBy_object = doc[att6]
//     FOR att7 IN ATTRIBUTES(doc)
//         FILTER LIKE(att7, '%state%')
//         LET infectionStatus = doc[att7]
        
//     INSERT {
//         id: CONCAT("urn:covid-10:case:00", id),
//         type: "InfectionCase",
//         yearOfBirth: {
//             type: "Property",
//             value: yearOfBirth
//         },
//         address: {
//             type: "Property",
//             value: {
//                 addressCountry: "KR",
//                 addressRegion: address
//             }
//         },
//         diseaseCode: {
//             type: "Property",
//             value: "COVID-19"
//         },
//         infectinStatus: {
//             type: "Property",
//             value: infectionStatus
//         },
//         orderOfTransmission: {
//             type: "Property",
//             value: orderOfTransmission
//         },
//         travelRoutes: {
//             type: "Property",
//             value: [
//                 {
//                     placeName: "",
//                     address: {
//                         type: "Property",
//                         value: {
//                             addressCountry: "KR",
//                             addressRegion: "",
//                             addressLocality: "",
//                             streetAddress: ""
//                         }
//                     },
//                     location: {
//                         type: "GeoProperty",
//                         value: {
//                             type: "Point",
//                             coordinates: [
//                                 0,
//                                 0
//                             ]
//                         }
//                     },
//                     transport: "",
//                     beginTime: "",
//                     duration: 0
//                 },
//                 {
//                     placeName: "",
//                     address: {
//                         type: "Property",
//                         value: {
//                             addressCountry: "KR",
//                             addressRegion: "",
//                             addressLocality: "",
//                             streetAddress: ""
//                         }
//                     },
//                     location: {
//                         type: "GeoProperty",
//                         value: {
//                             type: "Point",
//                             coordinates: [
//                                 0,
//                                 0
//                             ]
//                         }
//                     },
//                     transport: "",
//                     beginTime: "",
//                     duration: 0
//                 }
//             ]
//         },
//         spreader: {
//             type: "Relationship",
//             object: CONCAT("urn:covid-10:case:00", infectionBy_object),
//             spreaderInfo: {
//                 type: "Property",
//                 value: {
//                     relationship: infectionBy_relationship,
//                     description: infectionBy_description
//                 }
//             }
//         }
//     } INTO ${ngsiColl}

//     RETURN {
//         id: id,
//         gender: gender,
//         yearOfBirth: yearOfBirth,
//         address: address,
//         infectionBy_description: infectionBy_description,
//         infectionBy_relationship: infectionBy_relationship,
//         orderOfTransmission: orderOfTransmission,
//         infectionBy_object: infectionBy_object,
//         infectionStatus: infectionStatus
//     }
//         `)
//     try {
//         res.send(types);
//     } catch(e) {
//         res.send(e.toString())
//     }
// })
// .summary('store ngsi-ld data in ngsiCollection from csv data')
// .description('store ngsi-ld data from csv data');
