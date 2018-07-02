'use strict';
var constants = require('./constants');
const logger = require('./logger');

var audio_controller = (function() {
  return {
    play: function() {
      this.handler.state = constants.states.PLAY_MODE;
      if (this.attributes['playbackFinished']) {
        // Reset to top of the playlist when reached end.
        this.attributes['index'] = 0;
        this.attributes['offsetInMilliseconds'] = 0;
        this.attributes['playbackIndexChanged'] = true;
        this.attributes['playbackFinished'] = false;
      }
      var token = String(this.attributes.url);
      var playBehavior = 'REPLACE_ALL';
      // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
      this.attributes['enqueuedToken'] = null;
      var offsetInMilliseconds = this.attributes['offsetInMilliseconds'];
      logger.debug('URL is: ' + this.attributes['url']);
      this.response.audioPlayerPlay(
        playBehavior,
        this.attributes['url'],
        token,
        null,
        offsetInMilliseconds
      );

      this.emit(':responseReady');
    },
    stop: function() {
      logger.debug('received a stop request');
      this.response.audioPlayerStop();
      this.emit(':responseReady');
    }
  };
})();

module.exports = audio_controller;
