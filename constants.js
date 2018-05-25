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
    WELCOME_MSG: 'Welcome to Scout. You can say, get titles to begin.',
    WELCOME_REPROMPT: 'You can say, get my titles to begin.',
    TITLE_HELP:
      'You can say next to hear more titles, or repeat to repeat ' +
      'titles.  You can say play polar bears or skim polar bears to hear an ' +
      'article about polar bears',
    TITLE_LISTEN:
      'You can say next to hear more titles or repeat to repeat' +
      ' the ones you just heard',
    TITLE_POCKET:
      'No more titles in your queue.  You can say get headlines' +
      ' to hear summaries of articles pocket recommends. ',
    TITLE_LISTEN2:
      '<break />You can say play or summarize and then a keyword from the ' +
      'article',
    TITLE_ANN: 'Here are your titles: ',
    TITLE_CHOICE_EXPLAIN:
      '<break/>To pick an article say play the one about polar bears, for example.  ' +
      'To hear more titles say next.  To repeat the titles you just heard say repeat. ',
    TITLES_NEXT: 'Here are the next titles: ',
    TITLES_REPEAT: 'Repeating last titles<break />',
    TITLE_CHOOSE_SUMM_FULL:
      'Would you like to hear a summary or the full article of ',
    TITLE_CHOICE_REPROMPT:
      'You can say summary to hear a summary or full article to hear the full article',
    ARTICLE_FAIL_MSG:
      'Unable to find the article.  Please try' +
      ' saying get titles to hear your titles.',
    ALEXA_STOP_RESP: 'Goodbye!  Thanks for listening to the web with Scout',
    ERROR_UNHANDLED_STATE:
      'Sorry, I could not understand. Please say, get titles to hear your titles.',
    ERROR_UNEXPECTED_STATE: 'Sorry, unhandled intent: in state: ',
    PLAY_MODE_UNHANDLED:
      'Sorry, I could not understand that.  ' +
      'You can say pause or resume or stop to control the audio',
    WAIT_ARTICLE: 'One moment while I get that ready for you...'
  },
  TITLE_CHUNK_LEN: 5,

  // when true, the skill logs additional detail, including the full request received from Alexa
  debug: true
});
