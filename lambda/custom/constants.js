'use strict';

module.exports = Object.freeze({
  // App-ID. TODO: set to your own Skill App ID from the developer portal.
  appId: '',
  dynamoDBTableName: 'ScoutDB',
  TITLE_CHUNK_LEN: Number(process.env.ARTICLE_BATCH_SIZE) || 3,
  USER_AGENT: 'Alexa Skill',
  // when true, the skill logs additional detail, including the full request received from Alexa
  debug: true,
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
  metrics: {
    CMD_LISTEN: 'listen_command',
    CMD_START_LISTEN: 'start_listen',
    CMD_REACH_END_LISTEN: 'reach_end_listen',
    CXT_CMD_GET_TITLES: 'get_titles',
    CXT_CMD_OPEN_POCKET: 'open_pocket',
    CXT_CMD_PLAY_SUBJECT: 'play_article_subject',
    CXT_CMD_PLAY_NUMBER: 'play_article_number'
  }
});
