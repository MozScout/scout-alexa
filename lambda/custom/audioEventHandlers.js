'use strict';

var Alexa = require('ask-sdk-v1adapter');
var constants = require('./constants');
const metricsHelper = require('./metricsHelper');
const mh = new metricsHelper();
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
    this.attributes['playing'] = this.attributes['enqueuedToken'];

    this.handler.state = constants.states.PLAY_MODE;
    this.emit(':saveState', true);
  },

  PlaybackFinished: function() {
    this.handler.state = constants.states.START_MODE;
    this.emit('FinishedArticle');
    // Send a metric if this is the end of the article
    if (this.event.request.token == this.attributes['url']) {
      mh.add(
        constants.metrics.CMD_REACH_END_LISTEN,
        this,
        null,
        this.attributes['articleId']
      );
    }
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
    if (this.attributes['queue'].length > 0) {
      logger.debug('Enqueuing next audio file');
      let token = String(this.attributes['queue'][0]);
      this.response.audioPlayerPlay(
        'ENQUEUE',
        this.attributes['queue'][0],
        token,
        this.attributes['enqueuedToken'],
        this.attributes['queue'][0] == this.attributes['url']
          ? this.attributes['offsetInMilliseconds']
          : 0 // only set offset if the audiofile is the article
      );
      this.attributes['enqueuedToken'] = token;
      this.attributes['queue'].shift();
    }
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
