'use strict';

module.exports = Object.freeze({
  // App-ID. TODO: set to your own Skill App ID from the developer portal.
  appId: '',

  dynamoDBTableName: 'ScoutDB',

  /*
     *  States:
     *  START_MODE : Welcome state when the audio list has not begun.
     *  PLAY_MODE :  When a playlist is being played. Does not imply only active play.
     *               It remains in the state as long as the playlist is not finished.
     *  RESUME_DECISION_MODE : When a user invokes the skill in PLAY_MODE with a LaunchRequest,
     *                         the skill provides an option to resume from last position, or to start over the playlist.
     */
  states: {
    START_MODE: '',
    PLAY_MODE: '_PLAY_MODE',
    RESUME_DECISION_MODE: '_RESUME_DECISION_MODE',
    TITLES_DECISION_MODE: '_TITLES_DECISION_MODE'
  },
  strings: {
    WELCOME_MSG: 'Welcome to Scout. To begin, say get titles.',
    WELCOME_REPROMPT: 'Begin by saying get my titles.',
    START_HELP:
      'To listen to an article say “Play” followed by the title or' +
      ' a few keywords. For example, say “Play the one about polar bears.” ' +
      'Say “Get my titles” to hear the first 5 articles in Pocket queue.',
    TITLE_HELP:
      'To listen to an article say “Play” followed by the title or' +
      ' a few keywords. For example, say “Play the one about polar bears.” ' +
      'Say “Get my titles” to hear the first 5 articles in Pocket queue, ' +
      'next to hear another 5 and repeat to hear them again.',
    TITLE_PREFIX: 'Here are the next titles:',
    END_OF_TITLES: 'There are no more titles in your queue.',
    TITLE_ANN: 'Here are your titles: ',
    TITLE_SEARCH_MATCH_FAIL:
      'Sorry, I couldn’t find a match.  Say Play followed by a few words in the title ' +
      'or say Repeat to hear the titles again.',
    TITLE_CHOICE_EXPLAIN: 'What would you like to listen to?',
    TITLE_CHOICE_EXPLAIN_REPROMPT:
      'What would you like to listen to?' + 'You can say next for more titles.',
    TITLES_NEXT: 'Here are the next titles: ',
    TITLES_REPEAT: 'Repeating last titles<break />',
    TITLE_CHOOSE_SUMM_FULL:
      'Would you like to hear a summary or the full article?',
    TITLE_CHOICE_REPROMPT: 'You can say summary or full article.',
    ARTICLE_FAIL_MSG:
      'Unable to find the article.  Please try' +
      ' saying get titles to hear your titles.',
    ALEXA_STOP_RESP: 'Goodbye!  Thanks for listening to the web with Scout',
    ERROR_UNHANDLED_STATE:
      'Sorry, I could not understand. Please say, get titles to hear your titles.',
    ERROR_UNEXPECTED_STATE: 'Sorry, unhandled intent: in state: ',
    ERROR_GETTING_TITLES: 'Error Getting titles',
    PLAY_MODE_UNHANDLED:
      'Sorry, I could not understand that.  ' +
      'You can say pause or resume or stop to control the audio',
    WAIT_ARTICLE: 'One moment while I get that ready for you...'
  },
  TITLE_CHUNK_LEN: 5,

  // when true, the skill logs additional detail, including the full request received from Alexa
  debug: true
});
