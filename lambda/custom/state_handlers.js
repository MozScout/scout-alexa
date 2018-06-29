'use strict';

var Alexa = require('alexa-sdk');
var https = require('https');
var rp = require('request-promise');
var audio_controller = require('./audio_controller');
var constants = require('./constants');
var natural = require('natural');
var TfIdf = natural.TfIdf;

var state_handlers = {
  startModeIntentHandlers: Alexa.CreateStateHandler(
    constants.states.START_MODE,
    {
      /*
         *  All Intent Handlers for state : START_MODE
         */
      LaunchRequest: function() {
        console.log('START_MODE:LaunchRequest');
        //  Change state to START_MODE
        this.handler.state = constants.states.START_MODE;
        this.attributes['offsetInMilliseconds'] = 0;

        this.response
          .speak(constants.strings.WELCOME_MSG)
          .listen(constants.strings.WELCOME_REPROMPT);
        this.emit(':responseReady');
      },
      SearchAndPlayArticle: function() {
        console.log('START_MODE:SearchAndPlayArticle');
        searchAndPlayArticleHelper(this);
      },
      SearchAndSummarizeArticle: function() {
        console.log('START_MODE:SearchAndSummarizeArticle');
        synthesisHelper(this);
      },
      ScoutMyPocket: function() {
        console.log('START_MODE:ScoutMyPocket');
        synthesisHelper(this);
      },
      ScoutTitles: function() {
        console.log('START_MODE:ScoutTitles');
        getTitlesHelper(this);
      },
      'AMAZON.HelpIntent': function() {
        console.log('START_MODE:AMAZON.HelpIntent');

        this.response
          .speak(constants.strings.START_HELP)
          .listen(constants.strings.START_HELP);
        this.emit(':responseReady');
      },
      'AMAZON.StopIntent': function() {
        console.log('START_MODE:AMAZON.StopIntent');
        this.response.speak(constants.strings.ALEXA_STOP_RESP);
        this.emit(':responseReady');
      },
      'AMAZON.CancelIntent': function() {
        console.log('START_MODE:AMAZON.CancelIntent');
        this.response.speak(constants.strings.ALEXA_STOP_RESP);
        this.emit(':responseReady');
      },
      'AMAZON.PauseIntent': function() {
        console.log('PLAY_MODE:AMAZON.PauseIntent');
        audio_controller.stop.call(this);
      },
      'AMAZON.ResumeIntent': function() {
        console.log('PLAY_MODE:AMAZON.ResumeIntent');
        audio_controller.play.call(this);
      },
      SessionEndedRequest: function() {
        console.log('START_MODE:AMAZON.SessionEndedRequest');
        // No session ended logic
      },
      FinishedArticle: function() {
        console.log('START_MODE:FinishedArticle');
        if (this.attributes['full']) {
          scout_agent
            .updateArticleStatus(
              this.attributes['userId'],
              this.attributes['articleId'],
              0
            )
            .catch(function(err) {
              console.log(`Error during offset update: ${err}`);
            });
        }
        this.emit(':saveState', true);
      },
      Unhandled: function() {
        console.log('START_MODE:Unhandled');
        this.response
          .speak(constants.strings.ERROR_UNHANDLED_STATE)
          .listen(constants.strings.ERROR_UNHANDLED_STATE);
        this.emit(':responseReady');
      }
    }
  ),
  playModeIntentHandlers: Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    //Intent handlers for PLAY_MODE
    LaunchRequest: function() {
      console.log('PLAY_MODE:LaunchRequest');
      this.handler.state = constants.states.START_MODE;

      this.response
        .speak(constants.strings.WELCOME_MSG)
        .listen(constants.strings.WELCOME_REPROMPT);
      this.emit(':responseReady');
    },
    SearchAndPlayArticle: function() {
      console.log('PLAY_MODE:SearchAndPlayArticle');
      searchAndPlayArticleHelper(this);
    },
    SearchAndSummarizeArticle: function() {
      console.log('PLAY_MODE:SearchAndSummarizeArticle');
      synthesisHelper(this);
    },
    ScoutMyPocket: function() {
      console.log('PLAY_MODE:ScoutMyPocket');
      synthesisHelper(this);
    },
    ScoutTitles: function() {
      console.log('PLAY_MODE:ScoutTitles');
      getTitlesHelper(this);
    },
    'AMAZON.PauseIntent': function() {
      console.log('PLAY_MODE:AMAZON.PauseIntent');
      audio_controller.stop.call(this);
      this.emit('StoppedArticle');
    },
    StoppedArticle: function() {
      console.log('PLAY_MODE:StoppedArticle');
      if (this.attributes['full']) {
        scout_agent
          .updateArticleStatus(
            this.attributes['userId'],
            this.attributes['articleId'],
            this.attributes['offsetInMilliseconds']
          )
          .catch(function(err) {
            console.log(`Error during offset update: ${err}`);
          });
      }
      this.emit(':saveState', true);
    },
    'AMAZON.ResumeIntent': function() {
      console.log('PLAY_MODE:AMAZON.ResumeIntent');
      audio_controller.play.call(this);
    },
    'AMAZON.StopIntent': function() {
      console.log('PLAY_MODE:AMAZON.StopIntent');
      audio_controller.stop.call(this);
      this.response.speak(constants.strings.ALEXA_STOP_RESP);
      this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function() {
      console.log('PLAY_MODE:AMAZON.CancelIntent');
      audio_controller.stop.call(this);
    },
    'AMAZON.HelpIntent': function() {
      console.log('PLAY_MODE:AMAZON.HelpIntent');

      this.response
        .speak(constants.strings.START_HELP)
        .listen(constants.strings.START_HELP);
      this.emit(':responseReady');
    },
    SessionEndedRequest: function() {
      // No session ended logic
      console.log('PLAY_MODE:SessionEndedRequest');
      audio_controller.stop.call(this);

      this.handler.state = '';
      delete this.attributes['STATE'];
      this.emit(':saveState', true);
    },
    Unhandled: function() {
      console.log('PLAY_MODE:Unhandled');

      this.response
        .speak(constants.strings.PLAY_MODE_UNHANDLED)
        .listen(constants.strings.PLAY_MODE_UNHANDLED);
      this.emit(':responseReady');
    }
  }),
  /* This is a state handler for when the user has asked to hear a list of
  * titles and is trying to find/decide what to listen to.  Within this state,
  * Scout can 1) get more titles, 2) play a title and transition to PLAY_MODE,
  * 3) Ask Scout to repeat the titles, and 4)eventually, choose a numbered
  * title to play which would transition them to PLAY_MODE.
  */
  titlesDecisionIntentHandlers: Alexa.CreateStateHandler(
    constants.states.TITLES_DECISION_MODE,
    {
      //Intent handlers for TITLES_DECISION_MODE
      LaunchRequest: function() {
        console.log('TITLES_DECISION_MODE:LaunchRequest');
        this.handler.state = constants.states.START_MODE;

        this.response
          .speak(constants.strings.WELCOME_MSG)
          .listen(constants.strings.WELCOME_REPROMPT);
        this.emit(':responseReady');
      },
      'AMAZON.YesIntent': function() {
        console.log('TITLES_DECISION_MODE:AMAZON.YesIntent');
        synthesisHelper(this);
      },
      'AMAZON.NoIntent': function() {
        console.log('TITLES_DECISION_MODE:AMAZON.NoIntent');
        synthesisHelper(this);
      },
      skim: function() {
        console.log('TITLES_DECISION_MODE:skim');
        synthesisHelperUrl(this);
      },
      fullarticle: function() {
        console.log('TITLES_DECISION_MODE:fullarticle');
        synthesisHelperUrl(this);
      },
      SearchAndPlayArticle: function() {
        console.log('TITLES_DECISION_MODE:SearchAndPlayArticle');
        matchArticleToTitlesHelper(this);
      },
      ScoutTitles: function() {
        console.log('TITLES_DECISION_MODE:ScoutTitles');
        getTitlesHelper(this);
      },
      'AMAZON.PauseIntent': function() {
        console.log('PLAY_MODE:AMAZON.PauseIntent');
        audio_controller.stop.call(this);
      },
      'AMAZON.ResumeIntent': function() {
        console.log('PLAY_MODE:AMAZON.ResumeIntent');
        audio_controller.play.call(this);
      },
      'AMAZON.StopIntent': function() {
        console.log('TITLES_DECISION_MODE:AMAZON.StopIntent');
        this.handler.state = constants.states.START_MODE;
        this.response.speak(constants.strings.ALEXA_STOP_RESP);
        this.handler.state = '';
        delete this.attributes['STATE'];
        this.emit(':saveState', true);

        this.emit(':responseReady');
      },
      'AMAZON.HelpIntent': function() {
        console.log('TITLES_DECISION_MODE:AMAZON.HelpIntent');
        this.response
          .speak(constants.strings.TITLE_HELP)
          .listen(constants.strings.TITLE_HELP);
        this.emit(':responseReady');
      },
      'AMAZON.RepeatIntent': function() {
        console.log('TITLES_DECISION_MODE:AMAZON.RepeatIntent');

        //Backup the title count.
        if (this.attributes['titleCount'] % constants.TITLE_CHUNK_LEN !== 0) {
          this.attributes['titleCount'] -=
            this.attributes['titleCount'] % constants.TITLE_CHUNK_LEN;
        } else {
          this.attributes['titleCount'] -= constants.TITLE_CHUNK_LEN;
        }

        let respTitles = getTitleChunk(
          this.attributes['titles'].articles,
          this
        );
        this.response
          .speak(
            constants.strings.TITLES_REPEAT +
              respTitles +
              constants.strings.TITLE_CHOICE_EXPLAIN
          )
          .listen(constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT);

        this.emit(':responseReady');
      },
      'AMAZON.NextIntent': function() {
        //Get the next chunk of titles
        console.log('TITLES_DECISION_MODE:AMAZON.NextIntent');
        let respTitles = getTitleChunk(
          this.attributes['titles'].articles,
          this
        );
        let message;
        let reprompt;
        if (!respTitles) {
          message = `${constants.strings.END_OF_TITLES} ${
            constants.strings.TITLE_CHOICE_EXPLAIN
          }`;
          reprompt = constants.strings.TITLE_CHOICE_EXPLAIN;
        } else {
          message = `${constants.strings.TITLE_PREFIX} ${respTitles} ${
            constants.strings.TITLE_CHOICE_EXPLAIN
          }`;
          reprompt = constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT;
        }
        this.response.speak(message).listen(reprompt);

        this.emit(':responseReady');
      },
      SessionEndedRequest: function() {
        // No session ended logic
        console.log('TITLES_DECISION_MODE:SessionEndedRequest');
        this.handler.state = '';
        delete this.attributes['State'];
        this.emit(':saveState', true);
      },
      Unhandled: function() {
        console.log('TITLES_DECISION_MODE:Unhandled');

        var message =
          constants.strings.ERROR_UNEXPECTED_STATE +
          constants.states.TITLES_DECISION_MODE;
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
      }
    }
  )
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
      'x-access-token': process.env.JWOT_TOKEN,
      'User-Agent': constants.strings.USER_AGENT
    }
  };

  return {
    handleTitles: function(event) {
      return new Promise((resolve, reject) => {
        let reqBody = {
          cmd: 'ScoutTitles',
          userid: event.session.user.accessToken
        };
        scoutOptions.body = JSON.stringify(reqBody);

        rp(scoutOptions)
          .then(function(body) {
            var jsonBody = JSON.parse(body);
            resolve(jsonBody);
          })
          .catch(function(err) {
            console.log('Scout unavailable');
            reject('Scout Unavailable');
          });
      });
    },
    handle: function(event) {
      return new Promise((resolve, reject) => {
        let search = getTitleFromSlotEvent(event);
        let reqBody = {
          cmd: event.request.intent.name,
          search_terms: search,
          userid: event.session.user.accessToken
        };
        scoutOptions.body = JSON.stringify(reqBody);

        rp(scoutOptions)
          .then(function(body) {
            var jsonBody = JSON.parse(body);
            resolve(jsonBody);
          })
          .catch(function(err) {
            console.log('Scout unavailable');
            reject('Scout Unavailable');
          });
      });
    },
    handleUrl: function(chosenArticle, event) {
      return new Promise((resolve, reject) => {
        let synthType =
          event.request.intent.name == 'skim' ? 'summary' : 'article';
        console.log('synth type is: ' + synthType);
        let scoutOptions = {
          uri: 'http://' + process.env.SCOUT_ADDR + '/command/' + synthType,
          body: JSON.stringify({
            userid: event.session.user.accessToken,
            url: chosenArticle
          }),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json',
            Content: 'application/json',
            'x-access-token': process.env.JWOT_TOKEN,
            'User-Agent': constants.strings.USER_AGENT
          }
        };

        rp(scoutOptions)
          .then(function(body) {
            var jsonBody = JSON.parse(body);
            resolve(jsonBody);
          })
          .catch(function(err) {
            console.log('Scout unavailable');
            reject('Scout Unavailable');
          });
      });
    },
    updateArticleStatus: function(userId, articleId, offset) {
      return new Promise((resolve, reject) => {
        console.log(
          `updateArticleStatus: ${articleId} for ${userId}. Offset: ${offset}`
        );
        let scoutOptions = {
          uri: `http://${process.env.SCOUT_ADDR}/article-status/`,
          method: 'POST',
          body: JSON.stringify({
            pocket_user_id: userId,
            article_id: articleId,
            offset_ms: offset
          }),
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json',
            Content: 'application/json',
            'x-access-token': process.env.JWOT_TOKEN
          }
        };

        rp(scoutOptions)
          .then(function(body) {
            resolve();
          })
          .catch(function(err) {
            console.log(`updateArticle API unavailable: ${err}`);
            reject(`updateArticle API unavailable: ${err}`);
          });
      });
    }
  };
})();

function matchArticleToTitlesHelper(stateObj) {
  let searchTerm = getTitleFromSlotEvent(stateObj.event);
  if (searchTerm) {
    let thisVar = stateObj;
    findBestScoringTitle(
      searchTerm,
      stateObj.attributes['titles'].articles
    ).then(
      function(article) {
        thisVar.attributes['chosenArticle'] = article.resolved_url;
        thisVar.attributes['articleId'] = article.item_id;
        thisVar.response
          .speak(constants.strings.TITLE_CHOOSE_SUMM_FULL)
          .listen(constants.strings.TITLE_CHOICE_REPROMPT);
        thisVar.emit(':responseReady');
      },
      function(rejectReason) {
        thisVar.response
          .speak(constants.strings.TITLE_SEARCH_MATCH_FAIL)
          .listen(constants.strings.TITLE_SEARCH_MATCH_FAIL);
        thisVar.attributes['chosenArticle'] = 'none';
        thisVar.emit(':responseReady');
      }
    );
  }
}

async function searchAndPlayArticleHelper(stateObj) {
  if (stateObj.event.session.new) {
    const titles = await scout_agent.handleTitles(stateObj.event);
    stateObj.attributes['titles'] = titles;
  }
  stateObj.handler.state = constants.states.TITLES_DECISION_MODE;
  matchArticleToTitlesHelper(stateObj);
}

//Handler to get the titles for Alexa to read
function getTitlesHelper(stateObj) {
  console.log('ScoutTitles');
  stateObj.attributes['chosenArticle'] = 'none';
  scout_agent.handle(stateObj.event).then(
    titles => {
      console.log('promise resolved');
      stateObj.handler.state = constants.states.TITLES_DECISION_MODE;
      stateObj.attributes['titleCount'] = 0;
      stateObj.attributes['titles'] = titles;
      let respTitles = getTitleChunk(titles.articles, stateObj);
      stateObj.response
        .speak(
          constants.strings.TITLE_ANN +
            respTitles +
            constants.strings.TITLE_CHOICE_EXPLAIN
        )
        .listen(constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT);
      stateObj.emit(':responseReady');
    },
    error => {
      stateObj.response.speak('Error Getting titles');
      stateObj.emit(':responseReady');
    }
  );
}

function getTitleChunk(articleJson, stateObj) {
  let curCount = stateObj.attributes['titleCount'];
  let arrChunk = Object.values(articleJson).slice(
    curCount,
    curCount + constants.TITLE_CHUNK_LEN
  );

  if (arrChunk.length === 0) {
    return '';
  } else {
    let retSpeech = '<break />';
    arrChunk.forEach(function(element, index) {
      const cleanTitle = cleanStringForSsml(element.title);
      console.log(`article title: ${cleanTitle}`);

      retSpeech = `${retSpeech} ${index + 1}. ${cleanTitle}. ${
        element.length_minutes
      } minute${element.length_minutes === 1 ? '' : 's'}.  `;
    });
    stateObj.attributes['titleCount'] += arrChunk.length;

    return retSpeech;
  }
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

//Helper to get anything that needs to be
//synthesized as speech and return as a url
// to play with audioPlayer.
function synthesisHelperUrl(stateObj) {
  console.log('synthesisHelperUrl');

  // Check to make sure that there is a chosen article first
  if (stateObj.attributes['chosenArticle'] === 'none') {
    console.log('No chosenArticle.  User probably did not use an intent.');
    stateObj.response
      .speak(constants.strings.TITLE_SEARCH_MATCH_FAIL)
      .listen(constants.strings.TITLE_SEARCH_MATCH_FAIL);
    stateObj.attributes['chosenArticle'] = 'none';
    stateObj.emit(':responseReady');
  } else {
    const directiveServiceCall = callDirectiveService(stateObj.event).catch(
      error => {
        console.log('Unable to play a progressive response' + error);
      }
    );
    console.log('Chosen Article is: ' + stateObj.attributes['chosenArticle']);
    stateObj.attributes['full'] =
      stateObj.event.request.intent.name == 'fullarticle';
    stateObj.attributes['userId'] = stateObj.event.session.user.accessToken;
    const article = scout_agent
      .handleUrl(stateObj.attributes['chosenArticle'], stateObj.event)
      .then(function(article) {
        console.log('promise resolved: ' + article.url);
        stateObj.attributes['url'] = article.url;
        stateObj.attributes['offsetInMilliseconds'] = article.offset_ms;
        audio_controller.play.call(stateObj);
      })
      .catch(function(err) {
        console.log(`handleURL promise failed: ${err}`);
        stateObj.response.speak(constants.strings.ARTICLE_FAIL_MSG);
        stateObj.emit(':responseReady');
      });

    Promise.all([directiveServiceCall, article]).then(function(values) {
      console.log(values);
    });
  }
}

function cleanStringForSsml(alexaString) {
  let cleanedString = alexaString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  return cleanedString;
}

function getTitleFromSlotEvent(event) {
  let slots = event.request.intent.slots;
  let search = 0;
  for (var p in slots) {
    if (slots.hasOwnProperty(p)) {
      console.log(p + ': ' + slots[p].value);
      if (p == 'CatchAllSlot') {
        search = slots[p].value;
      }
    }
  }
  return search;
}

function findBestScoringTitle(searchPhrase, articleArr) {
  return new Promise((resolve, reject) => {
    natural.PorterStemmer.attach();
    //tokenize and stem the search utterance that user said
    let wordsStem = searchPhrase.tokenizeAndStem();

    let tfidf = new TfIdf();
    //tokenize and Stem each title and then add to our dataset
    for (var i = 0; i < articleArr.length; i++) {
      console.log(articleArr[i].title);
      let stemmed = articleArr[i].title.tokenizeAndStem();
      tfidf.addDocument(stemmed);
    }

    let maxValue = 0;
    let curMaxIndex = 0;
    let iCount = 0;
    tfidf.tfidfs(wordsStem, function(i, measure) {
      console.log('document #' + i + ' is ' + measure);
      if (measure > maxValue) {
        maxValue = measure;
        curMaxIndex = i;
      }
      iCount++;
      if (iCount >= articleArr.length) {
        console.log('Max Score is: ' + maxValue);
        // Check to make sure something matched above score of 0.
        if (maxValue === 0) {
          console.log('Error, no search match with utterance');
          reject(constants.strings.TITLE_SEARCH_MATCH_FAIL);
        } else {
          console.log('Article is: ' + articleArr[curMaxIndex].title);
          resolve(articleArr[curMaxIndex]);
        }
      }
    });
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
    constants.strings.WAIT_ARTICLE
  );
  return ds.enqueue(directive, endpoint, token);
}

module.exports = state_handlers;
