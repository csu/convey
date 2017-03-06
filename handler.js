'use strict';

/*
  ES SETUP
*/
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: process.env.ES_HOST,
  httpAuth: process.env.ES_HTTP_AUTH
});

/*
  ERROR HELPERS
*/
var errorResponse = (callback, response, message, errorBody) => {
  if (process.env.CONVEY_ERROR_LOGGING_INDEX &&
      process.env.CONVEY_ERROR_LOGGING_TYPE) {
    conveyErrorLogging(callback, response, message, errorBody);
  }
  else {
    callback(null, response);
  }
}

var conveyErrorLogging = (callback, response, message, errorBody) => {
  var errorDoc = {
    index: process.env.CONVEY_ERROR_LOGGING_INDEX,
    type: process.env.CONVEY_ERROR_LOGGING_TYPE,
    body: {},
  };

  if (typeof errorBody !== 'undefined') {
    errorDoc.body = errorBody;
  }

  if (typeof message !== 'undefined') {
    errorDoc.body.message = message;
  }

  errorDoc.body.time_created = new Date().toISOString();

  client.index(errorDoc, function (err, res) {
    callback(null, response);
  });
};

/*
  ERROR STATES
*/
var invalidInputError = (callback) => {
  const message = 'Invalid input';
  const response = {
    statusCode: 500,
    body: JSON.stringify({
      message: message,
    }),
  };

  errorResponse(callback, response, message);
};

var invalidBodyError = (callback) => {
  const message = 'Invalid body';
  const response = {
    statusCode: 500,
    body: JSON.stringify({
      message: message,
    }),
  };

  errorResponse(callback, response, message);
};

var unauthorizedKeyError = (callback) => {
  const message = 'Unauthorized key';
  const response = {
    statusCode: 403,
    body: JSON.stringify({
      message: message,
    }),
  };

  errorResponse(callback, response, message);
};

var missingIndexorTypeError = (callback, body) => {
  const message = 'Must specify index and type in input';
  const response = {
    statusCode: 400,
    body: JSON.stringify({
      message: message,
      input: body,
    }),
  };

  errorResponse(callback, response, message, { input: body });
};

/*
  INDEX RESULTS
*/
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

var indexFailure = (doc, callback, error, indexResponse) => {
  const message = 'Index failed with error  ' + error;

  const response = {
    statusCode: 400,
    body: JSON.stringify({
      message: message,
      doc: doc,
    }),
  };

  errorResponse(callback, response, message, {
    doc: doc,
    index_response: JSON.stringify(indexResponse),
  });
};

/*
  INDEX HANDLER
*/
module.exports.index = (event, context, callback) => {
  // Error checking
  if (!event.body) {
    invalidInputError(callback);
    return;
  }

  try {
    var body = JSON.parse(event.body);
  }
  catch (e) {
    invalidBodyError(callback);
    return;
  }

  if (typeof process.env.CONVEY_SECRET !== 'undefined' &&
      process.env.CONVEY_SECRET &&
        (typeof body.secret === 'undefined' ||
          body.secret !== process.env.CONVEY_SECRET)) {
    unauthorizedKeyError(callback);
    return;
  }

  delete body.secret;

  if (typeof body.index === 'undefined' || typeof body.type === 'undefined') {
    missingIndexorTypeError(callback, body);
    return;
  }
  
  // Preparing document
  var doc = {body: body};
  doc.index = doc.body.index;
  doc.type = doc.body.type;
  delete doc.body.index;
  delete doc.body.type;

  doc.body.time_created = new Date().toISOString();

  // Indexing document
  client.index(doc, function (error, indexResponse) {
    if (error) {
      indexFailure(doc, callback, error, indexResponse);
    } else {
      indexSuccess(doc, callback);
    }
  });
};
