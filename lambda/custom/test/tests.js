var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const assert = require('chai').assert;
const vax = require('virtual-alexa');
const constants = require('../constants');
const logger = require('../logger');

if (!process.env.SCOUT_ADDR || !process.env.JWOT_TOKEN) {
  logger.error('No env vars found.');
  throw new Error('No env vars found. Please add SCOUT_ADDR and JWOT_TOKEN.');
}

const alexa = vax.VirtualAlexa.Builder()
  .handler('index.handler') // Lambda function file and name
  .interactionModelFile('../../models/en-US.json')
  .create();
alexa.context().setAccessToken('scoutskilltest@mailinator.com');

const checkStreamingString = '.mp3';

describe('Integration Tests', function() {
  this.timeout(120 * 1000);
  it('Launch Prompt', async () => {
    let result = await alexa.launch();
    assert.include(result.prompt(), constants.strings.WELCOME_MSG);
  });
  it('Launch Reprompt', async () => {
    let result = await alexa.launch();
    assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);
  });
  it('Get my titles', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Get my titles');
    assert.include(result.prompt(), constants.strings.TITLE_ANN);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    assert.include(
      result.reprompt(),
      constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
    );
  });
  it('Get titles', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Get Titles');
    assert.include(result.prompt(), constants.strings.TITLE_ANN);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    assert.include(
      result.reprompt(),
      constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
    );
  });
  it('Titles', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Titles');
    assert.include(result.prompt(), constants.strings.TITLE_ANN);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    assert.include(
      result.reprompt(),
      constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
    );
  });
  it('Play the article about Firefox', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Play the Article about Firefox');
    assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);
    assert.include(result.reprompt(), constants.strings.TITLE_CHOICE_REPROMPT);
  });
  it('Play Firefox', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Play Firefox');
    assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);
    assert.include(result.reprompt(), constants.strings.TITLE_CHOICE_REPROMPT);
  });
  it('Play (Match fail)', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Play something');
    assert.include(result.prompt(), constants.strings.TITLE_SEARCH_MATCH_FAIL);
    assert.include(
      result.reprompt(),
      constants.strings.TITLE_SEARCH_MATCH_FAIL
    );
  });
  it('Play the article (Match fail)', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Play the article');
    assert.include(result.prompt(), constants.strings.TITLE_SEARCH_MATCH_FAIL);
    assert.include(
      result.reprompt(),
      constants.strings.TITLE_SEARCH_MATCH_FAIL
    );
  });
  it('Help prompt', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Help');
    assert.include(result.prompt(), constants.strings.START_HELP);
  });
  it('Help reprompt', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Help');
    assert.include(result.reprompt(), constants.strings.START_HELP);
  });
  it('Stop', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Stop');
    assert.include(result.prompt(), constants.strings.ALEXA_STOP_RESP);
  });
  it('Pause', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Pause');
    assert.isNotTrue(alexa.audioPlayer().isPlaying());
  });
  it('Cancel', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Cancel');
    assert.include(result.prompt(), constants.strings.ALEXA_STOP_RESP);
  });
  it('Repeat', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('Repeat');
    assert.include(result.prompt(), constants.strings.WELCOME_MSG);
    assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);
  });
  it('EndSession', async () => {
    let result = await alexa.launch();
    result = await alexa.endSession();
  });
  it('Unhandled', async () => {
    let result = await alexa.launch();
    result = await alexa.intend('AMAZON.FallbackIntent');
    assert.include(result.prompt(), constants.strings.ERROR_UNHANDLED_STATE);
    assert.include(result.reprompt(), constants.strings.ERROR_UNHANDLED_STATE);
  });
  it('ScoutMyPocket', async () => {
    let result = await alexa.launch();
    result = await alexa.utter('pocket');
    assert.isTrue(alexa.audioPlayer().isPlaying());

    result = await alexa.utter('stop');
    assert.isNotTrue(alexa.audioPlayer().isPlaying());
  });
});

describe('Integration Tests', function() {
  this.timeout(120 * 1000);

  afterEach(async function() {
    result = await alexa.utter('stop');
    assert.isNotTrue(alexa.audioPlayer().isPlaying());
  });

  describe('Happy Dialog Paths', function() {
    it('Full Article - Test 1', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get my titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play the Article about Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Full Article - Test 2', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('Titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Blockchain');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('entire story');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Full Article - Test 3', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('Titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play the Amazon TV article');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full story');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Summary - Test 1', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get my titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play the Article about Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('summary');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Summary - Test 2', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('Titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Boring Company');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('skim');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Summary - Test 3', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('Titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Donald Trump');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('get me a summary');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Full Article - Pause/Resume', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Donald Trump');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('pause');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('resume');
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Full Article - Stop/Resume', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('resume');
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Summary - Pause/Resume', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Donald Trump');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('summary');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('pause');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('resume');
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Summary - Stop/Resume', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('summary');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('pause');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('resume');
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });
  });
  describe('Other Paths', function() {
    it('Get Titles - Repeat', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('repeat');
      assert.include(result.prompt(), constants.strings.TITLES_REPEAT);
      assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    });

    it('Get Titles - Next', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('next');
      assert.include(result.prompt(), constants.strings.TITLE_PREFIX);
      assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
      assert.include(
        result.reprompt(),
        constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
      );
    });

    it('Get Titles - Next - Repeat', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('next');
      assert.include(result.prompt(), constants.strings.TITLE_PREFIX);
      assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
      assert.include(
        result.reprompt(),
        constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
      );

      result = await alexa.utter('repeat');
      assert.include(result.prompt(), constants.strings.TITLES_REPEAT);
      assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    });

    it('Get Titles - Get Titles', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);
    });

    it('Get Titles - Relaunch', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);
    });

    it('Full article - Plays Intro/Article/Outro/EndInstructions', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );

      // intro
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // article
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // outro
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // end instructions
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Full article - Plays Article/Outro/EndInstructions (offset)', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );

      // intro
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // article
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );

      // article
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // outro
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // end instructions
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('Summary - Plays Intro/Article/Outro/EndInstructions', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('summary');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );

      // intro
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // article
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // outro
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      // end instructions
      await alexa.audioPlayer().playbackStarted();
      assert.isTrue(alexa.audioPlayer().isPlaying());
      await alexa.audioPlayer().playbackFinished();

      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('PlayMode - Get Titles', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      await alexa.audioPlayer().playbackFinished();
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('PlayMode - Play different article', async () => {
      let result = await alexa.launch();
      assert.include(result.prompt(), constants.strings.WELCOME_MSG);
      assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      let firstArticle = result.response.directives[0].audioItem.stream.url;
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('Play Donald Trump');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);
      result = await alexa.utter('full article');
      assert.isTrue(alexa.audioPlayer().isPlaying());

      await alexa.audioPlayer().playbackFinished();
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('PlayMode - ScoutMyPocket', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      let firstArticle = result.response.directives[0].audioItem.stream.url;
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('pocket');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      assert.notEqual(
        result.response.directives[0].audioItem.stream.url,
        firstArticle
      );
      assert.isTrue(alexa.audioPlayer().isPlaying());

      await alexa.audioPlayer().playbackFinished();
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });

    it('PlayMode - Cancel', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.include(
        result.response.directives[0].audioItem.stream.url,
        checkStreamingString
      );
      let firstArticle = result.response.directives[0].audioItem.stream.url;
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('cancel');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });
  });

  describe('Help Paths', function() {
    it('Get Titles - Help', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);
      assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
      assert.include(
        result.reprompt(),
        constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
      );

      result = await alexa.utter('help');
      assert.include(result.prompt(), constants.strings.TITLE_HELP);
      assert.include(result.reprompt(), constants.strings.TITLE_HELP);
    });

    it('Get Titles - Next - Help', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('next');
      assert.include(result.prompt(), constants.strings.TITLE_PREFIX);
      assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
      assert.include(
        result.reprompt(),
        constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
      );

      result = await alexa.utter('help');
      assert.include(result.prompt(), constants.strings.TITLE_HELP);
      assert.include(result.reprompt(), constants.strings.TITLE_HELP);
    });

    it('Summary or Full Article - Help', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('help');
      assert.include(result.prompt(), constants.strings.TITLE_HELP);
      assert.include(result.reprompt(), constants.strings.TITLE_HELP);
    });

    it('Playing - Help', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.utter('help');
      assert.include(result.prompt(), constants.strings.START_HELP);
      assert.include(result.reprompt(), constants.strings.START_HELP);

      result = await alexa.utter('stop');
      assert.isNotTrue(alexa.audioPlayer().isPlaying());
    });
  });

  describe('Error Paths', function() {
    it('Get Titles - Next - Next: No more titles', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('next');
      assert.include(result.prompt(), constants.strings.TITLE_PREFIX);
      assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
      assert.include(
        result.reprompt(),
        constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
      );

      result = await alexa.utter('next');
      assert.include(result.prompt(), constants.strings.END_OF_TITLES);
      assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
      assert.include(result.reprompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    });

    it('Get Titles - EndSession', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.endSession();
    });

    it('Get Titles - Play undefined: No match', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play undefined');
      assert.include(
        result.prompt(),
        constants.strings.TITLE_SEARCH_MATCH_FAIL
      );
      assert.include(
        result.reprompt(),
        constants.strings.TITLE_SEARCH_MATCH_FAIL
      );
    });

    it('Get Titles - Unhandled', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.intend('AMAZON.FallbackIntent');
      assert.include(result.prompt(), constants.strings.ERROR_UNEXPECTED_STATE);
      assert.include(
        result.reprompt(),
        constants.strings.ERROR_UNEXPECTED_STATE
      );
    });

    it('Playing - EndSession', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.endSession();
    });

    it('Playing - Unhandled', async () => {
      let result = await alexa.launch();

      result = await alexa.utter('get titles');
      assert.include(result.prompt(), constants.strings.TITLE_ANN);

      result = await alexa.utter('Play Firefox');
      assert.include(result.prompt(), constants.strings.TITLE_CHOOSE_SUMM_FULL);

      result = await alexa.utter('full article');
      assert.isTrue(alexa.audioPlayer().isPlaying());

      result = await alexa.intend('AMAZON.FallbackIntent');
      assert.include(result.prompt(), constants.strings.PLAY_MODE_UNHANDLED);
      assert.include(result.reprompt(), constants.strings.PLAY_MODE_UNHANDLED);
    });
  });
});

describe('Integration Tests - Account 2', function() {
  this.timeout(120 * 1000);
  before(function() {
    alexa.context().setAccessToken('scoutskilltest2@mailinator.com');
  });
  afterEach(async function() {
    result = await alexa.utter('stop');
    assert.isNotTrue(alexa.audioPlayer().isPlaying());
  });

  it('Get Titles - Next - Next: No more titles', async () => {
    let result = await alexa.launch();

    result = await alexa.utter('get titles');
    assert.include(result.prompt(), constants.strings.TITLE_ANN);

    result = await alexa.utter('next');
    assert.include(result.prompt(), constants.strings.TITLE_PREFIX);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    assert.include(
      result.reprompt(),
      constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
    );

    result = await alexa.utter('next');
    assert.include(result.prompt(), constants.strings.END_OF_TITLES);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    assert.include(result.reprompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
  });

  it('Get Titles - Repeat', async () => {
    let result = await alexa.launch();
    assert.include(result.prompt(), constants.strings.WELCOME_MSG);
    assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

    result = await alexa.utter('get titles');
    assert.include(result.prompt(), constants.strings.TITLE_ANN);

    result = await alexa.utter('repeat');
    assert.include(result.prompt(), constants.strings.TITLES_REPEAT);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
  });

  it('Get Titles - Next', async () => {
    let result = await alexa.launch();
    assert.include(result.prompt(), constants.strings.WELCOME_MSG);
    assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

    result = await alexa.utter('get titles');
    assert.include(result.prompt(), constants.strings.TITLE_ANN);

    result = await alexa.utter('next');
    assert.include(result.prompt(), constants.strings.TITLE_PREFIX);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    assert.include(
      result.reprompt(),
      constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
    );
  });

  it('Get Titles - Next - Repeat', async () => {
    let result = await alexa.launch();
    assert.include(result.prompt(), constants.strings.WELCOME_MSG);
    assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

    result = await alexa.utter('get titles');
    assert.include(result.prompt(), constants.strings.TITLE_ANN);

    result = await alexa.utter('next');
    assert.include(result.prompt(), constants.strings.TITLE_PREFIX);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
    assert.include(
      result.reprompt(),
      constants.strings.TITLE_CHOICE_EXPLAIN_REPROMPT
    );

    result = await alexa.utter('repeat');
    assert.include(result.prompt(), constants.strings.TITLES_REPEAT);
    assert.include(result.prompt(), constants.strings.TITLE_CHOICE_EXPLAIN);
  });
});

describe('Integration Tests - Unregistered account / API down', function() {
  this.timeout(120 * 1000);
  before(function() {
    alexa.context().setAccessToken('unregistered-user@mailinator.com');
  });
  it('Get Titles - Next', async () => {
    let result = await alexa.launch();
    assert.include(result.prompt(), constants.strings.WELCOME_MSG);
    assert.include(result.reprompt(), constants.strings.WELCOME_REPROMPT);

    result = await alexa.utter('get titles');
    assert.include(result.prompt(), constants.strings.ERROR_GETTING_TITLES);
  });
});
