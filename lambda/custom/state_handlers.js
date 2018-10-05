'use strict';

var Alexa = require('ask-sdk-v1adapter');
var https = require('https');
var rp = require('request-promise');
var audio_controller = require('./audio_controller');
var constants = require('./constants');
var natural = require('natural');
var TfIdf = natural.TfIdf;
const metricsHelper = require('./metricsHelper');
const mh = new metricsHelper();
const logger = require('./logger');

var state_handlers = {
  startModeIntentHandlers: Alexa.CreateStateHandler(
    constants.states.START_MODE,
    {
      /*
         *  All Intent Handlers for state : START_MODE
         */
      LaunchRequest: function() {
        logger.info('START_MODE:LaunchRequest');
        //  Change state to START_MODE
        this.handler.state = constants.states.START_MODE;
        this.attributes['offsetInMilliseconds'] = 0;

        this.response
          .speak(this.t('WELCOME_MSG'))
          .listen(this.t('WELCOME_REPROMPT'));
        this.emit(':responseReady');
        mh.add(
          constants.metrics.CMD_LISTEN,
          this,
          constants.metrics.CXT_CMD_OPEN_POCKET,
          null
        );
      },
      SearchAndPlayArticle: function() {
        logger.info('START_MODE:SearchAndPlayArticle');
        searchAndPlayArticleHelper(this);
      },
      SearchAndSummarizeArticle: function() {
        logger.info('START_MODE:SearchAndSummarizeArticle');
        synthesisHelper(this);
      },
      PlayFirst: function() {
        logger.info('START_MODE:PlayFirst');
        ordinalHelper(this, 0);
      },
      PlaySecond: function() {
        logger.info('START_MODE:PlaySecond');
        ordinalHelper(this, 1);
      },
      PlayThird: function() {
        logger.info('START_MODE:PlayThird');
        ordinalHelper(this, 2);
      },
      PlayFourth: function() {
        logger.info('START_MODE:PlayFourth');
        ordinalHelper(this, 3);
      },
      PlayFifth: function() {
        logger.info('START_MODE:PlayFifth');
        ordinalHelper(this, 4);
      },
      ScoutMyPocket: function() {
        logger.info('START_MODE:ScoutMyPocket');
        synthesisHelper(this);
      },
      ScoutTitles: function() {
        logger.info('START_MODE:ScoutTitles');
        getTitlesHelper(this);
      },
      'AMAZON.HelpIntent': function() {
        logger.info('START_MODE:AMAZON.HelpIntent');

        this.response.speak(this.t('START_HELP')).listen(this.t('START_HELP'));
        this.emit(':responseReady');
      },
      'AMAZON.StopIntent': function() {
        logger.info('START_MODE:AMAZON.StopIntent');
        this.response.speak(this.t('ALEXA_STOP_RESP'));
        this.emit(':responseReady');
      },
      'AMAZON.CancelIntent': function() {
        logger.info('START_MODE:AMAZON.CancelIntent');
        this.response.speak(this.t('ALEXA_STOP_RESP'));
        this.emit(':responseReady');
      },
      'AMAZON.PauseIntent': function() {
        logger.info('START_MODE:AMAZON.PauseIntent');
        audio_controller.stop.call(this);
      },
      'AMAZON.ResumeIntent': function() {
        logger.info('START_MODE:AMAZON.ResumeIntent');
        audio_controller.play.call(this);
      },
      'AMAZON.RepeatIntent': function() {
        logger.info('START_MODE:AMAZON.RepeatIntent');
        this.response
          .speak(this.t('WELCOME_MSG'))
          .listen(this.t('WELCOME_REPROMPT'));
        this.emit(':responseReady');
      },
      SessionEndedRequest: function() {
        logger.info('START_MODE:AMAZON.SessionEndedRequest');
        // No session ended logic
      },
      FinishedArticle: function() {
        logger.info('START_MODE:FinishedArticle');

        if (
          this.attributes['full'] &&
          this.attributes['playing'] == String(this.attributes['url'])
        ) {
          scout_agent
            .updateArticleStatus(
              this.attributes['userId'],
              this.attributes['articleId'],
              0
            )
            .catch(function(err) {
              logger.error(`Error during offset update: ${err}`);
            });
        }
        this.emit(':saveState', true);
      },
      Unhandled: function() {
        logger.info('START_MODE:Unhandled');
        this.response
          .speak(this.t('ERROR_UNHANDLED_STATE'))
          .listen(this.t('ERROR_UNHANDLED_STATE'));
        this.emit(':responseReady');
      }
    }
  ),
  playModeIntentHandlers: Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    //Intent handlers for PLAY_MODE
    LaunchRequest: function() {
      logger.info('PLAY_MODE:LaunchRequest');
      this.handler.state = constants.states.START_MODE;

      this.response
        .speak(this.t('WELCOME_MSG'))
        .listen(this.t('WELCOME_REPROMPT'));
      this.emit(':responseReady');
      mh.add(
        constants.metrics.CMD_LISTEN,
        this,
        constants.metrics.CXT_CMD_OPEN_POCKET,
        null
      );
    },
    SearchAndPlayArticle: function() {
      logger.info('PLAY_MODE:SearchAndPlayArticle');
      searchAndPlayArticleHelper(this);
    },
    SearchAndSummarizeArticle: function() {
      logger.info('PLAY_MODE:SearchAndSummarizeArticle');
      synthesisHelper(this);
    },
    PlayFirst: function() {
      logger.info('PLAY_MODE:PlayFirst');
      ordinalHelper(this, 0);
    },
    PlaySecond: function() {
      logger.info('PLAY_MODE:PlaySecond');
      ordinalHelper(this, 1);
    },
    PlayThird: function() {
      logger.info('PLAY_MODE:PlayThird');
      ordinalHelper(this, 2);
    },
    PlayFourth: function() {
      logger.info('PLAY_MODE:PlayFourth');
      ordinalHelper(this, 3);
    },
    PlayFifth: function() {
      logger.info('PLAY_MODE:PlayFifth');
      ordinalHelper(this, 4);
    },
    ScoutMyPocket: function() {
      logger.info('PLAY_MODE:ScoutMyPocket');
      synthesisHelper(this);
    },
    ScoutTitles: function() {
      logger.info('PLAY_MODE:ScoutTitles');
      getTitlesHelper(this);
    },
    'AMAZON.PauseIntent': function() {
      logger.info('PLAY_MODE:AMAZON.PauseIntent');
      audio_controller.stop.call(this);
      this.emit('StoppedArticle');
    },
    StoppedArticle: function() {
      logger.info('PLAY_MODE:StoppedArticle');
      if (
        this.attributes['full'] &&
        this.attributes['playing'] == String(this.attributes['url'])
      ) {
        scout_agent
          .updateArticleStatus(
            this.attributes['userId'],
            this.attributes['articleId'],
            this.attributes['offsetInMilliseconds']
          )
          .catch(function(err) {
            logger.error(`Error during offset update: ${err}`);
          });
      }
      this.emit(':saveState', true);
    },
    'AMAZON.ResumeIntent': function() {
      logger.info('PLAY_MODE:AMAZON.ResumeIntent');
      audio_controller.play.call(this);
    },
    'AMAZON.StopIntent': function() {
      logger.info('PLAY_MODE:AMAZON.StopIntent');
      audio_controller.stop.call(this);
      this.response.speak(this.t('ALEXA_STOP_RESP'));
      this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function() {
      logger.info('PLAY_MODE:AMAZON.CancelIntent');
      audio_controller.stop.call(this);
    },
    'AMAZON.HelpIntent': function() {
      logger.info('PLAY_MODE:AMAZON.HelpIntent');

      this.response.speak(this.t('START_HELP')).listen(this.t('START_HELP'));
      this.emit(':responseReady');
    },
    SessionEndedRequest: function() {
      // No session ended logic
      logger.info('PLAY_MODE:SessionEndedRequest');
      audio_controller.stop.call(this);

      this.handler.state = '';
      delete this.attributes['STATE'];
      this.emit(':saveState', true);
    },
    Unhandled: function() {
      logger.info('PLAY_MODE:Unhandled');

      this.response
        .speak(this.t('PLAY_MODE_UNHANDLED'))
        .listen(this.t('PLAY_MODE_UNHANDLED'));
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
        logger.info('TITLES_DECISION_MODE:LaunchRequest');
        this.handler.state = constants.states.START_MODE;

        this.response
          .speak(this.t('WELCOME_MSG'))
          .listen(this.t('WELCOME_REPROMPT'));
        this.emit(':responseReady');
        mh.add(
          constants.metrics.CMD_LISTEN,
          this,
          constants.metrics.CXT_CMD_OPEN_POCKET,
          null
        );
      },
      'AMAZON.YesIntent': function() {
        logger.info('TITLES_DECISION_MODE:AMAZON.YesIntent');
        synthesisHelper(this);
      },
      'AMAZON.NoIntent': function() {
        logger.info('TITLES_DECISION_MODE:AMAZON.NoIntent');
        synthesisHelper(this);
      },
      skim: function() {
        logger.info('TITLES_DECISION_MODE:skim');
        synthesisHelperUrl(this);
      },
      fullarticle: function() {
        logger.info('TITLES_DECISION_MODE:fullarticle');
        synthesisHelperUrl(this);
      },
      SearchAndPlayArticle: function() {
        logger.info('TITLES_DECISION_MODE:SearchAndPlayArticle');
        matchArticleToTitlesHelper(this);
      },
      PlayFirst: function() {
        logger.info('TITLES_DECISION_MODE:PlayFirst');
        playOrdinal(this, 0);
      },
      PlaySecond: function() {
        logger.info('TITLES_DECISION_MODE:PlaySecond');
        playOrdinal(this, 1);
      },
      PlayThird: function() {
        logger.info('TITLES_DECISION_MODE:PlayThird');
        playOrdinal(this, 2);
      },
      PlayFourth: function() {
        logger.info('TITLES_DECISION_MODE:PlayFourth');
        playOrdinal(this, 3);
      },
      PlayFifth: function() {
        logger.info('TITLES_DECISION_MODE:PlayFifth');
        playOrdinal(this, 4);
      },
      ScoutTitles: function() {
        logger.info('TITLES_DECISION_MODE:ScoutTitles');
        getTitlesHelper(this);
      },
      'AMAZON.PauseIntent': function() {
        logger.info('TITLES_DECISION_MODE:AMAZON.PauseIntent');
        audio_controller.stop.call(this);
      },
      'AMAZON.ResumeIntent': function() {
        logger.info('TITLES_DECISION_MODE:AMAZON.ResumeIntent');
        audio_controller.play.call(this);
      },
      'AMAZON.StopIntent': function() {
        logger.info('TITLES_DECISION_MODE:AMAZON.StopIntent');
        this.handler.state = constants.states.START_MODE;
        this.response.speak(this.t('ALEXA_STOP_RESP'));
        this.handler.state = '';
        delete this.attributes['STATE'];
        this.emit(':saveState', true);

        this.emit(':responseReady');
      },
      'AMAZON.HelpIntent': function() {
        logger.info('TITLES_DECISION_MODE:AMAZON.HelpIntent');
        this.response.speak(this.t('TITLE_HELP')).listen(this.t('TITLE_HELP'));
        this.emit(':responseReady');
      },
      'AMAZON.RepeatIntent': function() {
        logger.info('TITLES_DECISION_MODE:AMAZON.RepeatIntent');

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
            this.t('TITLES_REPEAT') +
              respTitles +
              this.t('TITLE_CHOICE_EXPLAIN')
          )
          .listen(this.t('TITLE_CHOICE_EXPLAIN_REPROMPT'));

        this.emit(':responseReady');
      },
      'AMAZON.NextIntent': function() {
        //Get the next chunk of titles
        logger.info('TITLES_DECISION_MODE:AMAZON.NextIntent');
        let respTitles = getTitleChunk(
          this.attributes['titles'].articles,
          this
        );
        let message;
        let reprompt;
        if (!respTitles) {
          message = `${this.t('END_OF_TITLES')} ${this.t(
            'TITLE_CHOICE_EXPLAIN'
          )}`;
          reprompt = this.t('TITLE_CHOICE_EXPLAIN');
        } else {
          message = `${this.t('TITLE_PREFIX')} ${respTitles} ${this.t(
            'TITLE_CHOICE_EXPLAIN'
          )}`;
          reprompt = this.t('TITLE_CHOICE_EXPLAIN_REPROMPT');
        }
        this.response.speak(message).listen(reprompt);

        this.emit(':responseReady');
      },
      SessionEndedRequest: function() {
        // No session ended logic
        logger.info('TITLES_DECISION_MODE:SessionEndedRequest');
        this.handler.state = '';
        delete this.attributes['State'];
        this.emit(':saveState', true);
      },
      Unhandled: function() {
        logger.info('TITLES_DECISION_MODE:Unhandled');

        var message =
          this.t('ERROR_UNEXPECTED_STATE') +
          constants.states.TITLES_DECISION_MODE;
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
      }
    }
  )
};

var scout_agent = (function() {
  const scoutOptions = {
    uri: 'https://' + process.env.SCOUT_ADDR + '/command/intent',
    method: 'POST',
    body: '',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Accept': 'application/json',
      Content: 'application/json',
      'x-access-token': process.env.JWOT_TOKEN,
      'User-Agent': constants.USER_AGENT
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
            logger.error('Scout unavailable');
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
            logger.error('Scout unavailable');
            reject('Scout Unavailable');
          });
      });
    },
    handleUrl: function(chosenArticle, event) {
      return new Promise((resolve, reject) => {
        let synthType =
          event.request.intent.name == 'skim' ? 'summary' : 'article';
        logger.debug('synth type is: ' + synthType);
        let scoutOptions = {
          uri: 'https://' + process.env.SCOUT_ADDR + '/command/' + synthType,
          body: JSON.stringify({
            userid: event.session.user.accessToken,
            url: chosenArticle,
            meta_audio: 1
          }),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json',
            Content: 'application/json',
            'x-access-token': process.env.JWOT_TOKEN,
            'User-Agent': constants.USER_AGENT
          }
        };

        rp(scoutOptions)
          .then(function(body) {
            var jsonBody = JSON.parse(body);
            resolve(jsonBody);
          })
          .catch(function(err) {
            logger.error('Scout unavailable');
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
          uri: `https://${process.env.SCOUT_ADDR}/article-status/`,
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
      stateObj,
      searchTerm,
      stateObj.attributes['titles'].articles
    ).then(
      function(article) {
        thisVar.attributes['chosenArticle'] = article.resolved_url;
        thisVar.attributes['articleId'] = article.item_id;
        if (process.env.SUMMARY && process.env.SUMMARY == 'false') {
          synthesisHelperUrl(thisVar);
          mh.add(
            constants.metrics.CMD_LISTEN,
            stateObj,
            constants.metrics.CXT_CMD_PLAY_SUBJECT,
            article.item_id
          );
        } else {
          thisVar.response
            .speak(thisVar.t('TITLE_CHOOSE_SUMM_FULL'))
            .listen(thisVar.t('TITLE_CHOICE_REPROMPT'));
          thisVar.emit(':responseReady');
        }
      },
      function(rejectReason) {
        thisVar.response
          .speak(thisVar.t('TITLE_SEARCH_MATCH_FAIL'))
          .listen(thisVar.t('TITLE_SEARCH_MATCH_FAIL'));
        thisVar.attributes['chosenArticle'] = 'none';
        thisVar.emit(':responseReady');
      }
    );
  }
}

// helper fetches titles before playing ordinal
async function ordinalHelper(stateObj, position) {
  if (stateObj.event.session.new || !stateObj.attributes['titles']) {
    const titles = await scout_agent.handleTitles(stateObj.event);
    stateObj.attributes['titles'] = titles;
  }
  stateObj.handler.state = constants.states.TITLES_DECISION_MODE;
  playOrdinal(stateObj, position);
}

// play the article depending on the ordinal
// position is indexed from 0: first=0, second=1...
function playOrdinal(stateObj, position) {
  // update position if the user said next before
  position = stateObj.attributes['currentTitleCount'] + position;

  let article = stateObj.attributes['titles'].articles[position];
  if (article) {
    stateObj.attributes['chosenArticle'] = article.resolved_url;
    stateObj.attributes['articleId'] = article.item_id;
    if (process.env.SUMMARY && process.env.SUMMARY == 'false') {
      synthesisHelperUrl(stateObj);
      // Log a metric for Pocket
      mh.add(
        constants.metrics.CMD_LISTEN,
        stateObj,
        constants.metrics.CXT_CMD_PLAY_NUMBER,
        article.item_id
      );
    } else {
      stateObj.response
        .speak(stateObj.t('TITLE_CHOOSE_SUMM_FULL'))
        .listen(stateObj.t('TITLE_CHOICE_REPROMPT'));
      stateObj.emit(':responseReady');
    }
  } else {
    stateObj.response
      .speak(stateObj.t('ORDINAL_FAIL'))
      .listen(stateObj.t('ORDINAL_FAIL'));
    stateObj.attributes['chosenArticle'] = 'none';
    stateObj.emit(':responseReady');
  }
}

async function searchAndPlayArticleHelper(stateObj) {
  if (stateObj.event.session.new || !stateObj.attributes['titles']) {
    const titles = await scout_agent.handleTitles(stateObj.event);
    stateObj.attributes['titles'] = titles;
  }
  stateObj.handler.state = constants.states.TITLES_DECISION_MODE;
  matchArticleToTitlesHelper(stateObj);
}

//Handler to get the titles for Alexa to read
function getTitlesHelper(stateObj) {
  logger.debug('ScoutTitles');
  mh.add(
    constants.metrics.CMD_LISTEN,
    stateObj,
    constants.metrics.CXT_CMD_GET_TITLES,
    null
  );

  stateObj.attributes['chosenArticle'] = 'none';
  scout_agent.handle(stateObj.event).then(
    titles => {
      logger.debug('promise resolved');
      stateObj.handler.state = constants.states.TITLES_DECISION_MODE;
      stateObj.attributes['titleCount'] = 0;
      stateObj.attributes['titles'] = titles;
      let respTitles = getTitleChunk(titles.articles, stateObj);
      stateObj.response
        .speak(
          stateObj.t('TITLE_ANN') +
            respTitles +
            stateObj.t('TITLE_CHOICE_EXPLAIN')
        )
        .listen(stateObj.t('TITLE_CHOICE_EXPLAIN_REPROMPT'));
      stateObj.emit(':responseReady');
    },
    error => {
      stateObj.response.speak(stateObj.t('ERROR_GETTING_TITLES'));
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
      logger.debug(`article title: ${cleanTitle}`);

      retSpeech = `${retSpeech} ${index + 1}. ${cleanTitle}. ${
        element.length_minutes
      } minute${element.length_minutes === 1 ? '' : 's'}.  `;
    });

    // store currentTitleCount for Ordinal
    stateObj.attributes['currentTitleCount'] =
      stateObj.attributes['titleCount'];
    stateObj.attributes['titleCount'] += arrChunk.length;

    return retSpeech;
  }
}

//Helper to get anything that needs to be
//synthesized as speech and return as a url
// to play with audioPlayer.
function synthesisHelper(stateObj) {
  logger.debug('synthesisHelper');
  const directiveServiceCall = callDirectiveService(stateObj).catch(error => {
    logger.error('Unable to play a progressive response' + error);
  });

  const getArticle = scout_agent.handle(stateObj.event).then(
    url => {
      logger.debug('promise resolved: ' + url.url);
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
    logger.debug(values);
  });
}

//Helper to get anything that needs to be
//synthesized as speech and return as a url
// to play with audioPlayer.
function synthesisHelperUrl(stateObj) {
  logger.debug('synthesisHelperUrl');

  // Check to make sure that there is a chosen article first
  if (stateObj.attributes['chosenArticle'] === 'none') {
    logger.error('No chosenArticle.  User probably did not use an intent.');
    stateObj.response
      .speak(stateObj.t('TITLE_SEARCH_MATCH_FAIL'))
      .listen(stateObj.t('TITLE_SEARCH_MATCH_FAIL'));
    stateObj.attributes['chosenArticle'] = 'none';
    stateObj.emit(':responseReady');
  } else {
    const directiveServiceCall = callDirectiveService(stateObj).catch(error => {
      logger.error('Unable to play a progressive response' + error);
    });
    logger.info('Chosen Article is: ' + stateObj.attributes['chosenArticle']);
    if (process.env.SUMMARY && process.env.SUMMARY == false) {
      stateObj.attributes['full'] = true;
    } else {
      stateObj.attributes['full'] =
        stateObj.event.request.intent.name == 'fullarticle';
    }
    stateObj.attributes['userId'] = stateObj.event.session.user.accessToken;
    const article = scout_agent
      .handleUrl(stateObj.attributes['chosenArticle'], stateObj.event)
      .then(function(article) {
        logger.debug('promise resolved: ' + article.url);
        stateObj.attributes['url'] = article.url;
        stateObj.attributes['instructions_url'] = article.instructions_url;
        stateObj.attributes['intro_url'] = article.intro_url;
        stateObj.attributes['outro_url'] = article.outro_url;
        stateObj.attributes['offsetInMilliseconds'] = article.offset_ms;
        audio_controller.play.call(stateObj, true);
      })
      .catch(function(err) {
        logger.error(`handleURL promise failed: ${err}`);
        stateObj.response.speak(stateObj.t('ARTICLE_FAIL_MSG'));
        stateObj.emit(':responseReady');
      });

    Promise.all([directiveServiceCall, article]).then(function(values) {
      logger.debug(values);
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
      logger.debug(p + ': ' + slots[p].value);
      if (p == 'CatchAllSlot') {
        search = slots[p].value;
      }
    }
  }
  return search;
}

function findBestScoringTitle(stateObj, searchPhrase, articleArr) {
  return new Promise((resolve, reject) => {
    natural.PorterStemmer.attach();
    //tokenize and stem the search utterance that user said
    let wordsStem = searchPhrase.tokenizeAndStem();

    let tfidf = new TfIdf();
    //tokenize and Stem each title and then add to our dataset
    for (var i = 0; i < articleArr.length; i++) {
      logger.debug(articleArr[i].title);
      let stemmed = articleArr[i].title.tokenizeAndStem();
      tfidf.addDocument(stemmed);
    }

    let maxValue = 0;
    let curMaxIndex = 0;
    let iCount = 0;
    tfidf.tfidfs(wordsStem, function(i, measure) {
      logger.debug('document #' + i + ' is ' + measure);
      if (measure > maxValue) {
        maxValue = measure;
        curMaxIndex = i;
      }
      iCount++;
      if (iCount >= articleArr.length) {
        logger.debug('Max Score is: ' + maxValue);
        // Check to make sure something matched above score of 0.
        if (maxValue === 0) {
          logger.error('Error, no search match with utterance');
          reject(stateObj.t('TITLE_SEARCH_MATCH_FAIL'));
        } else {
          logger.debug('Article is: ' + articleArr[curMaxIndex].title);
          resolve(articleArr[curMaxIndex]);
        }
      }
    });
  });
}

function callDirectiveService(stateObj) {
  // Call Alexa Directive Service.
  const ds = new Alexa.services.DirectiveService();
  const requestId = stateObj.event.request.requestId;
  const endpoint = stateObj.event.context.System.apiEndpoint;
  const token = stateObj.event.context.System.apiAccessToken;
  const directive = new Alexa.directives.VoicePlayerSpeakDirective(
    requestId,
    stateObj.t('WAIT_ARTICLE')
  );
  return ds.enqueue(directive, endpoint, token);
}

module.exports = state_handlers;
