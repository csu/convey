'use strict';

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: process.env.ES_HOST,
  httpAuth: process.env.ES_HTTP_AUTH
});

var indexSuccess = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Index succeeded.',
      input: event,
    }),
  };

  callback(null, response);
}

var indexFailure = (event, context, callback) => {
  const response = {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Index failed with error  ' + error,
      input: event,
    }),
  };

  callback(null, response);
}

module.exports.index = (event, context, callback) => {
  if (typeof process.env.CONVEY_SECRET === 'undefined' ||
      typeof event.secret === 'undefined' ||
      event.secret !== process.env.CONVEY_SECRET) {
    const response = {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Unauthorized',
        input: event,
      }),
    };

    callback(null, response);
    return;
  }

  delete event.secret;

  if (typeof event.index === 'undefined' || typeof event.type === 'undefined') {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Must specify index and type in input',
        input: event,
      }),
    };

    callback(null, response);
    return;
  }
  
  var doc = {body: event};
  doc.index = doc.body.index;
  doc.type = doc.body.type;
  delete doc.body.index;
  delete doc.body.type;

  client.index(doc, function (error, response) {
    if (error) {
      indexFailure(event, callback, error);
    } else {
      indexSuccess(event, callback);
    }
  });
};
