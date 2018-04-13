var https = require('https');
var rp = require('request-promise');

exports.handler = (event, context) => {
  console.log('SCOUT_ADDR IS:  ' + process.env.SCOUT_ADDR);
  const scoutOptions = {
    uri: 'http://' + process.env.SCOUT_ADDR + '/command/intent',
    method: 'POST',
    body: '',
    headers: {'Content-Type': 'application/json; charset=UTF-8',
    'X-Accept': 'application/json', 'Content': 'application/json',
    'x-access-token': process.env.JWOT_TOKEN
    }
  };
  console.log('SCOUT LINK IS:  ' + scoutOptions.uri);
  
  try {
    if (event.session.new) {
      // New Session
      console.log("NEW SESSION")
    }

    switch (event.request.type) {
      case "LaunchRequest":
        // Launch Request
        console.log(`LAUNCH REQUEST`)
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to an Alexa Skill, this is running on a deployed lambda function", true),
            {}
          )
        )
        break;

      case "IntentRequest":
        // Intent Request
        if (!event.session.user.accessToken) {
          context.succeed(
            generateResponse(
              buildSpeechletResponse(`Please link your account`, true),
            {}
            )
          )
        } else {
          console.log(`INTENT REQUEST:` + event.request.intent.name);
          let slots = event.request.intent.slots;
          let search = '';
          for (var p in slots) {
            if( slots.hasOwnProperty(p) ) {
              console.log(p + ': ' + slots[p].value);
              search = slots[p].value;
            } 
          }   
          console.log('user token is: '+ event.session.user.accessToken);
          let reqBody = {
            cmd: event.request.intent.name,
            searchTerms: search,
            userid: event.session.user.accessToken
          };
          scoutOptions.body = JSON.stringify(reqBody);

          rp(scoutOptions)
          .then(function(body) {
            var jsonBody = JSON.parse(body);
            console.log(body);
            context.succeed(
              generateResponse(
                buildSpeechletResponse(body, true),
                {}
              )
            )
          });
        }
        break;
      case "SessionEndedRequest":
        // Session Ended Request
        console.log(`SESSION ENDED REQUEST`)
        break;
      case 'Unhandled':
        context.succeed(
            generateResponse(
            buildSpeechletResponse(`Error found here`, true),
            {}
            )
        )
        break;
      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`)
    }
  } catch(error) { context.fail(`Exception: ${error}`) }
}

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }
}

generateResponse = (speechletResponse, sessionAttributes) => {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }
}