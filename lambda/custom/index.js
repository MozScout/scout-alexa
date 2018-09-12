var https = require('https');
var rp = require('request-promise');
var Alexa = require('ask-sdk-v1adapter');
var constants = require('./constants');
var stateHandlers = require('./state_handlers');
var audioEventHandlers = require('./audioEventHandlers');
const stringResources = require(process.env.STRING_BRAND);

console.log('Strings are: ' + process.env.STRING_BRAND);
exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context, callback);
  alexa.dynamoDBTableName = constants.dynamoDBTableName;
  alexa.appId = process.env.APP_ID;
  alexa.resources = stringResources;
  // Each state handler is mapped to a specific state.
  alexa.registerHandlers(
    stateHandlers.startModeIntentHandlers,
    stateHandlers.playModeIntentHandlers,
    stateHandlers.titlesDecisionIntentHandlers,
    audioEventHandlers
  );

  alexa.execute();
};
