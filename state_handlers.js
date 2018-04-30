'use strict';

var Alexa = require('alexa-sdk');
var https = require('https');
var rp = require('request-promise');
var audio_controller = require('./audio_controller');
var constants = require('./constants');

var state_handlers = {
  startModeIntentHandlers: Alexa.CreateStateHandler(
    constants.states.START_MODE,
    {
      /*
         *  All Intent Handlers for state : START_MODE
         */
      LaunchRequest: function() {
        //  Change state to START_MODE
        this.handler.state = constants.states.START_MODE;
        this.attributes['offsetInMilliseconds'] = 0;

        var message = 'Welcome to Scout! You can say, get my titles to begin.';
        var reprompt = 'You can say, get my titles to begin.';

        this.response.speak(message).listen(reprompt);
        this.emit(':responseReady');
      },
      SearchAndPlayArticle: function() {
        synthesisHelper(this);
      },
      ScoutMyPocketSummary: function() {
        synthesisHelper(this);
      },
      ScoutHeadlines: function() {
        synthesisHelper(this);
      },
      ScoutTitles: function() {
        getTitlesHelper(this);
      },
      'AMAZON.HelpIntent': function() {
        var message = 'Welcome to Scout. You can say, get titles to begin.';
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
      },
      'AMAZON.StopIntent': function() {
        var message = 'Good bye.';
        this.response.speak(message);
        this.emit(':responseReady');
      },
      'AMAZON.CancelIntent': function() {
        var message = 'Good bye.';
        this.response.speak(message);
        this.emit(':responseReady');
      },
      SessionEndedRequest: function() {
        // No session ended logic
      },
      Unhandled: function() {
        var message =
          'Sorry, I could not understand. Please say, get titles to hear your titles.';
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
      }
    }
  ),
  playModeIntentHandlers: Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    //Intent handlers for PLAY_MODE
    LaunchRequest: function() {
      console.log('PLAY_MODE|LaunchRequest');
      this.handler.state = constants.states.START_MODE;

      var message = 'Welcome to Scout! You can say, get my titles to begin.';
      var reprompt = 'You can say, get my titles to begin.';

      this.response.speak(message).listen(reprompt);
      this.emit(':responseReady');
    },
    SearchAndPlayArticle: function() {
      synthesisHelper(this);
    },
    ScoutMyPocketSummary: function() {
      synthesisHelper(this);
    },
    ScoutHeadlines: function() {
      synthesisHelper(this);
    },
    ScoutTitles: function() {
      getTitlesHelper(this);
    },
    'AMAZON.PauseIntent': function() {
      console.log('pause intent');
      audio_controller.stop.call(this);
    },
    'AMAZON.StopIntent': function() {
      console.log('stop intent');
      audio_controller.stop.call(this);
    },
    'AMAZON.CancelIntent': function() {
      console.log('cancel intent');
      audio_controller.stop.call(this);
    },
    'AMAZON.ResumeIntent': function() {
      console.log('resume intent');
      audio_controller.play.call(this);
    },
    'AMAZON.HelpIntent': function() {
      var message = 'Welcome to Scout. You can say, get titles to begin.';
      this.response.speak(message).listen(message);
      this.emit(':responseReady');
    },
    SessionEndedRequest: function() {
      // No session ended logic
      this.handler.state = '';
      delete this.attributes['State'];
      this.emit(':saveState', true);
    },
    Unhandled: function() {
      var message =
        'Sorry, I could not understand Play Mode. You can say, Next or Previous to navigate through the playlist.';
      this.response.speak(message).listen(message);
      this.emit(':responseReady');
    }
  })
};

var scout_agent = (function() {
  const scoutOptions = {
    uri: 'http://' + process.env.SCOUT_ADDR + '/command/intent',
    method: 'POST',
    body: '',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Accept': 'application/json',
      Content: 'application/json',
      'x-access-token': process.env.JWOT_TOKEN
    }
  };

  return {
    handle: function(event) {
      return new Promise((resolve, reject) => {
        let slots = event.request.intent.slots;
        let search = '';
        for (var p in slots) {
          if (slots.hasOwnProperty(p)) {
            console.log(p + ': ' + slots[p].value);
            if (p == 'CatchAllSlot') {
              search = slots[p].value;
            }
          }
        }
        let reqBody = {
          cmd: event.request.intent.name,
          searchTerms: search,
          userid: event.session.user.accessToken
        };
        scoutOptions.body = JSON.stringify(reqBody);

        rp(scoutOptions)
          .then(function(body) {
            console.log('before parsing json');
            var jsonBody = JSON.parse(body);
            console.log('Body is: ' + jsonBody);
            resolve(jsonBody);
          })
          .catch(function(err) {
            console.log('Scout unavailable');
            reject('Scout Unavailable');
          });
      });
    }
  };
})();

//Handler to get the titles for Alexa to read
function getTitlesHelper(stateObj) {
  console.log('ScoutTitles');
  scout_agent.handle(stateObj.event).then(
    titles => {
      console.log('promise resolved');
      stateObj.response
        .speak(
          'Here are your titles: ' +
            titles.speech +
            '.  You can say play that article about polar bears'
        )
        .listen('goodbye');
      stateObj.emit(':responseReady');
    },
    error => {
      stateObj.response.speak('Error Getting titles');
      stateObj.emit(':responseReady');
    }
  );
}

//Helper to get anything that needs to be
//synthesized as speech and return as a url
// to play with audioPlayer.
function synthesisHelper(stateObj) {
  console.log('synthesisHelper');
  const directiveServiceCall = callDirectiveService(stateObj.event).catch(
    error => {
      console.log('Unable to play a progressive response' + error);
    }
  );

  const getArticle = scout_agent.handle(stateObj.event).then(
    url => {
      console.log('promise resolved: ' + url.url);
      stateObj.attributes['url'] = url.url;
      stateObj.attributes['offsetInMilliseconds'] = 0;
      audio_controller.play.call(stateObj);
    },
    error => {
      stateObj.response.speak(
        'Unable to find the article.  Please try' +
          ' saying get titles to hear your titles.'
      );
      stateObj.emit(':responseReady');
    }
  );

  Promise.all([directiveServiceCall, getArticle]).then(function(values) {
    console.log(values);
  });
}

function callDirectiveService(event) {
  // Call Alexa Directive Service.
  const ds = new Alexa.services.DirectiveService();
  const requestId = event.request.requestId;
  const endpoint = event.context.System.apiEndpoint;
  const token = event.context.System.apiAccessToken;
  const directive = new Alexa.directives.VoicePlayerSpeakDirective(
    requestId,
    'One moment while I get that article ready for you...'
  );
  return ds.enqueue(directive, endpoint, token);
}

module.exports = state_handlers;
