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
        console.log('SearchAndPlayArticle');
        const directiveServiceCall = callDirectiveService(this.event).catch(
          error => {
            console.log('Unable to play a progressive response' + error);
          }
        );

        const getArticle = scout_agent.handle(this.event).then(
          url => {
            console.log('promise resolved: ' + url.url);
            // this.attributes['title'] = 'Place holder for a cool story';
            this.attributes['url'] = url.url;
            audio_controller.play.call(this);
          },
          error => {
            this.response.speak(
              'Unable to find the article.  Please try' +
                ' saying get titles to hear your titles.'
            );
            this.emit(':responseReady');
          }
        );

        Promise.all([directiveServiceCall, getArticle]).then(function(values) {
          console.log(values);
        });
      },
      ScoutMyPocketSummary: function() {
        console.log('ScoutMyPocketSummary');
        scout_agent.handle(this.event).then(
          url => {
            console.log('promise resolved');
            this.attributes['title'] = 'Here is your pocket summary';
            this.attributes['url'] = url.url;
            audio_controller.play.call(this);
          },
          error => {
            this.response.speak('Error Getting Summaries');
            this.emit(':responseReady');
          }
        );
      },
      ScoutHeadlines: function() {
        console.log('ScoutHeadlines');
        scout_agent.handle(this.event).then(
          headlines => {
            console.log('promise resolved');
            this.response.speak(headlines.text).listen('goodbye');
            this.emit(':responseReady');
          },
          error => {
            this.response.speak('Error Getting titles');
            this.emit(':responseReady');
          }
        );
      },
      ScoutTitles: function() {
        console.log('ScoutTitles');
        scout_agent.handle(this.event).then(
          titles => {
            console.log('promise resolved');
            this.response
              .speak(
                'Here are your titles: ' +
                  titles.speech +
                  '.  You can say play that article about polar bears'
              )
              .listen('goodbye');
            this.emit(':responseReady');
          },
          error => {
            this.response.speak('Error Getting titles');
            this.emit(':responseReady');
          }
        );
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
      console.log('SearchAndPlayArticle');
      const directiveServiceCall = callDirectiveService(this.event).catch(
        error => {
          console.log('Unable to play a progressive response' + error);
        }
      );

      const getArticle = scout_agent.handle(this.event).then(
        url => {
          console.log('promise resolved: ' + url.url);
          // this.attributes['title'] = 'Place holder for a cool story';
          this.attributes['url'] = url.url;
          audio_controller.play.call(this);
        },
        error => {
          this.response.speak(
            'Unable to find the article.  Please try' +
              ' saying get titles to hear your titles.'
          );
          this.emit(':responseReady');
        }
      );

      Promise.all([directiveServiceCall, getArticle]).then(function(values) {
        console.log(values);
      });
    },
    ScoutTitles: function() {
      console.log('ScoutTitles');
      scout_agent.handle(this.event).then(
        titles => {
          console.log('promise resolved');
          this.response
            .speak(
              'Here are your titles: ' +
                titles.speech +
                '.  You can say play that article about polar bears'
            )
            .listen('goodbye');
          this.emit(':responseReady');
        },
        error => {
          this.response.speak('Error Getting titles');
          this.emit(':responseReady');
        }
      );
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

function stateSet(thisParam, state) {}

module.exports = state_handlers;
