'use strict';

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: process.env.ES_HOST,
  httpAuth: process.env.ES_HTTP_AUTH
});

var indexSuccess = (doc, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Index succeeded.',
      doc: doc,
    }),
  };

  callback(null, response);
};

var indexFailure = (doc, callback, error) => {
  const response = {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Index failed with error  ' + error,
      doc: doc,
    }),
  };

  callback(null, response);
};

module.exports.index = (event, context, callback) => {
  if (!event.body) {
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Invalid input'
      }),
    };

    callback(null, response);
    return;
  }

  try {
    var body = JSON.parse(event.body);
  }
  catch (e) {
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Invalid body'
      }),
    };

    callback(null, response);
    return;
  }

  if (typeof process.env.CONVEY_SECRET !== 'undefined' &&
      process.env.CONVEY_SECRET &&
        (typeof body.secret === 'undefined' ||
          body.secret !== process.env.CONVEY_SECRET)) {
    const response = {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Unauthorized key'
      }),
    };

    callback(null, response);
    return;
  }

  delete body.secret;

  if (typeof body.index === 'undefined' || typeof body.type === 'undefined') {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Must specify index and type in input',
        input: body,
      }),
    };

    callback(null, response);
    return;
  }
  
  var doc = {body: body};
  doc.index = doc.body.index;
  doc.type = doc.body.type;
  delete doc.body.index;
  delete doc.body.type;

  doc.body.time_created = new Date().toISOString();

  client.index(doc, function (error, response) {
    if (error) {
      indexFailure(doc, callback, error);
    } else {
      indexSuccess(doc, callback);
    }
  });
};
