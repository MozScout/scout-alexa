'use strict';

var Alexa = require('ask-sdk-v1adapter');
var constants = require('./constants');
const logger = require('./logger');

// Binding audio handlers to PLAY_MODE State since they are expected only in this mode.
var audioEventHandlers = Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
  PlaybackStarted: function() {
    /*
         * AudioPlayer.PlaybackStarted Directive received.
         * Confirming that requested audio file began playing.
         * Storing details in dynamoDB using attributes.
         */
    logger.debug('State is: ' + this.handler.state);

    this.handler.state = constants.states.PLAY_MODE;
    this.emit(':saveState', true);
  },
  PlaybackFinished: function() {
    this.handler.state = constants.states.START_MODE;
    this.emit('FinishedArticle');
  },
  PlaybackStopped: function() {
    /*
       * AudioPlayer.PlaybackStopped Directive received.
       * Confirming that audio file stopped playing.
       * Storing details in dynamoDB using attributes.
       */
    // this.attributes['index'] = getIndex.call(this);
    this.attributes['offsetInMilliseconds'] = getOffsetInMilliseconds.call(
      this
    );
    this.handler.state = constants.states.PLAY_MODE;
    this.emitWithState('StoppedArticle');
  },

  PlaybackNearlyFinished: function() {
    this.response.audioPlayerPlay(
      'ENQUEUE',
      this.attributes['instructions_url'],
      String(this.attributes['instructions_url']),
      this.attributes['enqueue_token'],
      0
    );
    this.emit(':saveState', true);
  },
  PlaybackFailed: function() {
    logger.error('Playback Failed: ' + this.event.request.error);
    this.context.succeed({});
  }
});

function getOffsetInMilliseconds() {
  // Extracting offsetInMilliseconds received in the request.
  logger.debug('millisecs are: ' + this.event.request.offsetInMilliseconds);
  return this.event.request.offsetInMilliseconds;
}

module.exports = audioEventHandlers;
