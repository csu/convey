'use strict';

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: process.env.ES_HOST
  httpAuth: process.env.ES_HTTP_AUTH
});

var pingSuccess = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Cluster is up',
      input: event,
    }),
  };

  callback(null, response);
}

var pingFailure = (event, context, callback) => {
  const response = {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Cluster is down',
      input: event,
    }),
  };

  callback(null, response);
}

module.exports.forward = (event, context, callback) => {
  client.ping({
    // ping usually has a 3000ms timeout
    requestTimeout: 1000
  }, function (error) {
    if (error) {
      pingFailure(event, context, callback);
    } else {
      pingSuccess(event, context, callback);
    }
  });
};
