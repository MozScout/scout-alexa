'use strict';

var Alexa = require('alexa-sdk');
var constants = require('./constants');

// Binding audio handlers to PLAY_MODE State since they are expected only in this mode.
var audioEventHandlers = Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
  PlaybackStarted: function() {
    /*
         * AudioPlayer.PlaybackStarted Directive received.
         * Confirming that requested audio file began playing.
         * Storing details in dynamoDB using attributes.
         */
    console.log('State is: ' + this.handler.state);

    this.handler.state = constants.states.PLAY_MODE;
    this.emit(':saveState', true);
  },
  PlaybackFinished: function() {
    this.emit(':saveState', true);
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
    this.emit(':saveState', true);
  },

  PlaybackNearlyFinished: function() {
    this.emit(':saveState', true);
  },
  PlaybackFailed: function() {
    console.log('Playback Failed : %j', this.event.request.error);
    this.context.succeed({});
  }
});

function getOffsetInMilliseconds() {
  // Extracting offsetInMilliseconds received in the request.
  console.log('millisecs are: ' + this.event.request.offsetInMilliseconds);
  return this.event.request.offsetInMilliseconds;
}

module.exports = audioEventHandlers;
