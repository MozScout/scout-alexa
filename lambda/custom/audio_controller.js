'use strict';
var constants = require('./constants');
const logger = require('./logger');
const metricsHelper = require('./metricsHelper');
const mh = new metricsHelper();

var audio_controller = (function() {
  return {
    play: function(hasMetaAudio) {
      this.handler.state = constants.states.PLAY_MODE;
      if (this.attributes['playbackFinished']) {
        // Reset to top of the playlist when reached end.
        this.attributes['index'] = 0;
        this.attributes['offsetInMilliseconds'] = 0;
        this.attributes['playbackIndexChanged'] = true;
        this.attributes['playbackFinished'] = false;
      }
      var playBehavior = 'REPLACE_ALL';
      // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
      var offsetInMilliseconds = this.attributes['offsetInMilliseconds'];

      logger.debug('URL is: ' + this.attributes['url']);
      this.attributes['queue'] = [];
      if (hasMetaAudio) {
        if (this.attributes['offsetInMilliseconds'] == 0) {
          this.attributes['queue'].push(this.attributes['intro_url']);
        } // don't play intro if the user has an offset on article
        this.attributes['queue'].push(this.attributes['url']);
        this.attributes['queue'].push(this.attributes['outro_url']);
        this.attributes['queue'].push(this.attributes['instructions_url']);
      } else {
        this.attributes['queue'].push(this.attributes['url']);
      }
      var token = String(this.attributes['queue'][0]);
      this.response.audioPlayerPlay(
        playBehavior,
        this.attributes['queue'][0],
        token,
        null,
        this.attributes['queue'][0] == this.attributes['url']
          ? offsetInMilliseconds
          : 0
      );
      this.attributes['enqueuedToken'] = token;
      this.attributes['queue'].shift();
      this.emit(':responseReady');
      mh.add(
        constants.metrics.CMD_START_LISTEN,
        this,
        null,
        this.attributes['articleId']
      );
    },
    stop: function() {
      logger.debug('received a stop request');
      this.response.audioPlayerStop();
      this.emit(':responseReady');
    }
  };
})();

module.exports = audio_controller;
