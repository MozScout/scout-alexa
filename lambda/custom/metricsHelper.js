const Database = require('./database');
const database = new Database();
const logger = require('./logger');
const constants = require('./constants');
const rp = require('request-promise');

class metricsHelper {
  async add(action, stateObj, command, item_id) {
    logger.debug('Entering Metrics helper');
    if (process.env.POCKET_KEY) {
      if (!stateObj.attributes['access_token']) {
        stateObj.attributes['access_token'] = await database.getAccessToken(
          stateObj.event.session.user.accessToken
        );
      }

      const metricsLink = 'https://getpocket.com/v3/send?actions=';
      let actionKeys;
      if (action == constants.metrics.CMD_LISTEN) {
        actionKeys = [
          {
            action: action,
            time: Date.now(),
            cxt_view: 'command',
            cxt_command: command,
            item_id: item_id ? item_id : undefined
          }
        ];
      } else {
        actionKeys = [
          {
            action: action,
            time: Date.now(),
            cxt_view: 'command',
            item_id: item_id
          }
        ];
      }

      let metricsParams =
        '&access_token=' +
        stateObj.attributes['access_token'] +
        '&consumer_key=' +
        process.env.POCKET_KEY +
        '&locale_lang=en-US';

      let metricsUri = metricsLink + JSON.stringify(actionKeys) + metricsParams;

      const metricsOptions = {
        uri: encodeURI(metricsUri),
        method: 'GET',
        body: '',
        timeout: 3000,
        headers: {}
      };
      rp(metricsOptions)
        .then(metResults => {
          let sumResultsJson = JSON.parse(metResults);
          if (sumResultsJson.status == 1) {
            logger.debug('Metrics successful');
          } else {
            logger.error('Metrics failed: ' + JSON.stringify(sumResultsJson));
          }
        })
        .catch(function(err) {
          logger.error('error:' + err);
        });
    }
  }
}

module.exports = metricsHelper;
