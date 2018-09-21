# Scout Alexa Skill

[![Build Status](https://travis-ci.org/MozScout/scout-alexa.svg?branch=master)](https://travis-ci.org/MozScout/scout-alexa)
[![Coverage Status](https://coveralls.io/repos/github/MozScout/scout-alexa/badge.svg?branch=master)](https://coveralls.io/github/MozScout/scout-alexa?branch=master)

This is a lambda function that drives the Alexa skill for Scout.

Uses [Alexa Skills Kit SDK for Node.js](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs) v2.
Backwards compatibility with v1: see [ASK SDK Migration Guide](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/wiki/ASK-SDK-Migration-Guide).

## Setting up

Requirements: [scout-ua](https://github.com/MozScout/scout-ua), Auth Lamdba Functions and Auth API Gateways are deployed.

### AWS Lambda

Create an AWS Lambda Function on [AWS Lambda](https://console.aws.amazon.com/lambda/).

Add the following environment variables to your Lambda function:

* `APP_ID`: Alexa Skill ID. You can find it in the [Alexa Skills Kit Console](https://developer.amazon.com/alexa/console/ask)
* `JWOT_TOKEN`: JWOT token to access API (scout-ua). Generate using the api/auth/register endpoint from scout-ua (POST request with `name`, `email`, `password` fields).
* `SCOUT_ADDR`: API hostname for scout-ua (`yourserver.com` for instance)
* `LOG_LEVEL`: Optional. [Winston](https://github.com/winstonjs/winston) logging level.
* `SUMMARY`: Optional.  If this is there and set to 'false', the user will not get an option to hear the summary.  The only option will be the full article.

#### Cross Compiling the natural packages

In order to run this on Amazon, some of the node packages need to be cross-compiled on Amazon Linux to work properly. Here is a set of steps to do this:

* Create an EC2 instance of Amazon Linux. [Create an EC2 instance of Amazon Linux](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
* Be sure to choose Amazon Linux when you choose your instance type.
* SSH to your instance
  * ssh -i /path/to/key/yourkey.pem ec2-user@amazon-instance.hostname.com
* Install node |curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash|
* Set the node version to match your lambda version: |nvm install 8.10|
* Install dev tools: |sudo yum groupinstall "Development Tools"|
* Install git: |sudo yum install git|
* clone the source: |git clone https://github.com/MozScout/scout-alexa.git|
* |cd scout-alexa/lambda/custom && npm install|
* copy the scout-alexa/lambda/custom/node_modules directory to your local machine from the directory where your key is: |scp -i ./yourkey.pem -r ec2-user@yourhost.compute-1.amazonaws.com:/home/ec2-user/scout-alexa/ /your/local/dest/|
* Use that node_modules directory when uploading your lambda function making sure to use the same version that ou cross compiled on.

### Alexa Skill Kit

Create an Alexa Skill on [Alexa Skills Kit](https://developer.amazon.com/alexa/console/ask).
You can put `Scout` as an invocation name.

* Use the JSON Editor and upload the `skill.json` file.
* Go to _Interfaces_ and enable the _AudioPlayer_.
* Go to _Endpoint_ and add your AWS Lambda function ARN in Default Region.
* Go to _Account Linking_ and select Implicit Grant. Put your scout-auth-lambda API Gateway Invoke URL in the Authorization Grant field.
* In Client ID, put your Pocket Consumer Key.
* In Domain List, add the getpocket.com domain and the domains of your API Gateways.

## Deployment

* Fill `skill_id` in `.ask/config` with your Skill Id from [Alexa Skills Kit](https://developer.amazon.com/alexa/console/ask?).
* Fill `uri` in `.ask/config` with your ARN from your [AWS Lambda](https://console.aws.amazon.com/lambda/) function.

Deploy using `ask deploy` (require AWS command line tools). You may require to create an [AWS IAM](https://console.aws.amazon.com/iam/) user with correct permissions to deploy with command line.

### Enable on Alexa

Go to [alexa.amazon.com](https://alexa.amazon.com/).
In Skills/Your Skills/Dev Skill you should see your Skill in development. Enable-it. You should get redirected to Pocket to authorize the app. Authorize-it.

## Testing

Testing using [Bespoken virtual-alexa](https://github.com/bespoken/virtual-alexa).

To run tests, you need the following configuration: 
* AWS credentials
* define environment variables: 
  * `SCOUT_ADDR=<domain for scout-ua server (not a full URL), e.g. "scout-ua.herokuapp.com"`
  * `JWOT_TOKEN=<valid scout-ua JWT token>`
  * `SUMMARY=true`
  * `STRING_BRAND=./scout_strings.json` 
  * `TEST_ACCT1=<user1>@email.com` 
  * `TEST_ACCT2=<user2>@email.com` 
  * `TEST_ACCT_INVALID=<non-existent-user>@email.com` 
* Two Scout users with linked Pocket accounts and the following criteria:
  * User 1: `<user1>@email.com`
    * Account contains 6-8 articles linked in Pocket
    * Article titles to satisfy each of the following search terms:
      * Firefox
      * Intel resignation
      * Amazon TV
      * Boring Company
      * Donald Trump
  * User 2: `<user2>@email.com`
    * Account contains 6-10 articles saved in Pocket
  * User 3: `<non-existent-user>@email.com`
    * Account does not exist.
    
  

To run tests manually: `npm test` from inside the lambda/custom directory.  The node_modules must be generated locally on the machine your running the tests from.  Using the node_modules generated on the EC2 instance will not work.  It's best to backup any EC2 node_modules directory you have, run `npm install` and then run `npm test`.

Note that tests may fail if run from a forked repo due to lack of security keys.  Before landing a patch, please make sure that the integrations tests pass when you run them locally.
