/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */
const Alexa = require('ask-sdk-core');
const https = require('https');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const languageStrings = {
  'en': require('./languageStrings')
};
const hostUrl = 'api.myfeedbackbot.com';

function getFeedbackerName(apiAccessToken) {
  return getInformationFromAlexaApi("/v2/accounts/~current/settings/Profile.name", apiAccessToken);
}

function getFeedbackerEmailAddress(apiAccessToken) {
  return getInformationFromAlexaApi("/v2/accounts/~current/settings/Profile.email", apiAccessToken);
}

function getFeedbackerTelephoneNumber(apiAccessToken) {
  return getInformationFromAlexaApi("/v2/accounts/~current/settings/Profile.mobileNumber", apiAccessToken);
}

function getInformationFromAlexaApi(path, apiAccessToken) {
  let options = {
    method: 'GET',

    protocol: 'https:',
    hostname: 'api.eu.amazonalexa.com',
    port: 443,
    path: path,

    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + apiAccessToken
    }
  };

  return new Promise((resolve, reject) => {
    https.get(options, (response) => {
      let chunks_of_data = [];

      response.on('data', (fragments) => {
        chunks_of_data.push(fragments);
      });

      response.on('end', () => {
        let response_body = Buffer.concat(chunks_of_data);

        // promise resolved on success
        resolve(response_body.toString());
      });

      response.on('error', (error) => {
        // promise rejected on error
        reject(error);
      });
    });
  });
}

/**
 * 
 */
function postFeedbacker(feedbacker) {

  const data = JSON.stringify(feedbacker);
  let options = {
    method: 'PUT',

    protocol: 'https:',
    hostname: 'api.myfeedbackbot.com',
    port: 443,
    path: '/feedbacker',

    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    var req = https.request(options, (response) => {
      let chunks_of_data = [];

      response.on('data', (fragments) => {
        chunks_of_data.push(fragments);
      });

      response.on('end', () => {
        let response_body = Buffer.concat(chunks_of_data);

        // promise resolved on success
        resolve(response_body.toString());
      });

      response.on('error', (error) => {
        // promise rejected on error
        reject(error);
      });
    });

    req.on('error', error => {
      console.error(error);
    });

    req.write(data)
    req.end();
  });
}

/**
 * 
 */
function postFeedback(feedback) {
  const data = JSON.stringify(feedback);
  console.log(data);

  const options = {
    hostname: hostUrl,
    port: 443,
    path: '/feedback',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  return new Promise((resolve, reject) => {
    var req = https.request(options, (response) => {
      let chunks_of_data = [];

      response.on('data', (fragments) => {
        chunks_of_data.push(fragments);
      });

      response.on('end', () => {
        let response_body = Buffer.concat(chunks_of_data);

        // promise resolved on success
        resolve(response_body.toString());
      });

      response.on('error', (error) => {
        // promise rejected on error
        reject(error);
      });
    });

    req.on('error', error => {
      console.error(error);
    });

    req.write(data)
    req.end();
  });

}

function getUnacknowledgedReplies() {
  /*httpGet('/alexa/new-replies', (data) => { "DATA" + console.log(data) });*/
}

function saveSessionAttributes(attributesManager, sessionAttributes, speechOutput) {
  sessionAttributes.last_speech_output = speechOutput;
  sessionAttributes.botState = sessionAttributes.botState;
  attributesManager.setSessionAttributes(sessionAttributes);
}

//========== SETUP ==========

const initialSessionAttributes = {
  botState: 'SELECT_ACTION_STATE',
  product_id: 0,
  product_name: '',
  feedbacker: {}
}


//========== CUSTOM INTENT HANDLER ==========

const LaunchRequest = {
  canHandle(handlerInput) {
    console.log("LaunchRequest > Tested");

    return Alexa.isNewSession(handlerInput.requestEnvelope) ||
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    console.log("LaunchRequest > Used");
    console.log(handlerInput);
    console.log(handlerInput.requestEnvelope);

    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    var sessionAttributes = {};

    const speechOutput = requestAttributes.t('SELECT_ACTION_STATE_ENTER');
    sessionAttributes.botState = 'SELECT_ACTION_STATE';

    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    var feedbacker_telephone_number = await getFeedbackerTelephoneNumber(apiAccessToken).then((response) => {
      console.log("Feedbacker telephone number: " + response);
      return response;
    }).catch((error) => {
      console.log(error);
    });
    console.log("Feedbacker telephone number: " + feedbacker_telephone_number);
    saveSessionAttributes(attributesManager, initialSessionAttributes, speechOutput);

    return handlerInput.responseBuilder
      /*.addDelegateDirective({
        name: 'SelectDevice',
        confirmationStatus: 'NONE',
        slots: {}
      })*/
      .speak(speechOutput)
      .withAskForPermissionsConsentCard([
        "alexa::profile:name:read",
        "alexa::profile:email:read",
        "alexa::profile:mobile_number:read"
      ])
      .reprompt(speechOutput)
      .getResponse();
  },
};

/*const SelectActionHandler = {
  canHandle(handlerInput) {
    console.log("SelectActionHandler > Tested");

    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SelectAction';
  },
  async handle(handlerInput) {
    console.log("SelectActionHandler > Used");
    console.log(handlerInput);
    console.log(handlerInput.requestEnvelope);

    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    const action_type = handlerInput.requestEnvelope.request.intent.slots.action_type.value;
    const action_id = handlerInput.requestEnvelope.request.intent.slots.action_type.resolutions.resolutionsPerAuthority[0].values[0].value.id;

    let speechOutput = '';
    switch (action_id) {
      case 1:
      case '1':
        sessionAttributes.botState = 'SELECT_DEVICE_STATE';
        speechOutput = requestAttributes.t('SELECT_DEVICE_STATE_ENTER');
        break;
      case 2:
      case '2':
        sessionAttributes.botState = 'CHECK_REPLIES_STATE';
        speechOutput = requestAttributes.t('CHECK_REPLIES_STATE_ENTER');
        console.log(getUnacknowledgedReplies());
        break;
      case 3:
      case '3':
        sessionAttributes.botState = 'PRIVACY_INFORMATION_STATE';
        speechOutput = requestAttributes.t('PRIVACY_INFORMATION_ENTER');
        break;
    }
    return handlerInput.responseBuilder
      /*.addDelegateDirective({
        name: 'SelectAction',
        confirmationStatus: 'NONE',
        slots: {{
            "name": "action_type",
            "type": "ActionType",
            "elicitationRequired": true,
            "confirmationRequired": false,
            "prompts": {
              "elicitation": "Elicit.Slot.340514330560.1260777800361"
            }
          }}
      })
      .addElicitSlotDirective('product', {
        name: 'SelectDevice',
        confirmationStatus: 'NONE',
        slots: {}
      })
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  }
};*/

/*const SelectDeviceHandler = {

  canHandle(handlerInput) {
    console.log("SelectDeviceHandler > Tested");

    let stateCanHandleIntent = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.botState) {
      switch (sessionAttributes.botState) {
        case 'SELECT_DEVICE_STATE':
          stateCanHandleIntent = true;
          break;
      }
    }

    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SelectDevice';
  },

  handle(handlerInput) {
    console.log("SelectDeviceHandler > Used");
    console.log(handlerInput);
    console.log(handlerInput.requestEnvelope);

    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    const product_name = handlerInput.requestEnvelope.request.intent.slots.product.value;
    sessionAttributes.product_name = product_name;

    const product_id = parseInt(handlerInput.requestEnvelope.request.intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.id);
    sessionAttributes.product_id = product_id;

    //let speechOutput = `Thank you very much. So you want to give feedback regarding your ${product}. What type of feedback do you have? Is it a bug report, a feature request, a question, criticism or general feedback.`;
    let speechOutput = requestAttributes.t('SELECT_DEVICE_STATE_EXIT') + product_name + '. ' + requestAttributes.t('SELECT_FEEDBACK_TYPE_STATE_ENTER');

    sessionAttributes.botState = 'SELECT_FEEDBACK_TYPE_STATE';
    saveSessionAttributes(attributesManager, sessionAttributes, speechOutput);

    return handlerInput.responseBuilder
      /*.addDelegateDirective({
        name: 'SelectDevice',
        confirmationStatus: 'NONE',
        slots: {}
      })
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};*/

const FeedbackHandler = {

  canHandle(handlerInput) {
    console.log("FeedbackHandler > Tested");

    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === 'SubmitBugReport' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'SubmitFeatureRequest' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'SubmitQuestion' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'SubmitCriticism' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'SubmitGeneralFeedback');
  },

  async handle(handlerInput) {
    console.log("FeedbackHandler > Used");
    console.log(handlerInput);
    console.log(handlerInput.requestEnvelope);

    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    let feedback_contact_permission = parseInt(handlerInput.requestEnvelope.request.intent.slots.contact_permission.resolutions.resolutionsPerAuthority[0].values[0].value.id);
    var feedbacker_id = 1;
    if (feedback_contact_permission == 1) {
      const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;

      let feedbacker_name = await getFeedbackerName(apiAccessToken).then((response) => {
        console.log("feedbacker_name:" + response);
        return response;
      }).catch((error) => {
        console.log(error);
      });

      var feedbacker_email_address = await getFeedbackerEmailAddress(apiAccessToken).then((response) => {
        console.log("feedbacker_email_address:" + response);
        return response;
      }).catch((error) => {
        console.log(error);
      });

      var feedbacker_telephone_number = await getFeedbackerTelephoneNumber(apiAccessToken).then((response) => {
        console.log("feedbacker_telephone_number:" + response);
        return response;
      }).catch((error) => {
        console.log(error);
      });

      let feedbacker = {
        feedbacker_name: feedbacker_name,
        feedbacker_email_address: feedbacker_email_address
      };

      feedbacker_id = await postFeedbacker(feedbacker).then((response) => {
        console.log(response);
        let feedbacker = JSON.parse(response);
        return feedbacker[0].feedbacker_id;
      }).catch((error) => {
        console.log(error);
      });
    }
    console.log("Feedbacker id:" + feedbacker_id);

    const intent = Alexa.getIntentName(handlerInput.requestEnvelope);
    const product_name = handlerInput.requestEnvelope.request.intent.slots.product.value;
    const product_id = parseInt(handlerInput.requestEnvelope.request.intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.id);
    const feedback_content = Alexa.getSlotValue(handlerInput.requestEnvelope, 'content');
    const feedback_context = Alexa.getSlotValue(handlerInput.requestEnvelope, 'context');
    const feedback_steps_to_reproduce = Alexa.getSlotValue(handlerInput.requestEnvelope, 'steps_to_reproduce');
    const feedback_criticality = Alexa.getSlotValue(handlerInput.requestEnvelope, 'criticality');
    const feedback_problem = Alexa.getSlotValue(handlerInput.requestEnvelope, 'problem');
    const feedback_solution = Alexa.getSlotValue(handlerInput.requestEnvelope, 'solution');
    const feedback_importance = Alexa.getSlotValue(handlerInput.requestEnvelope, 'importance');
    const feedback_star_rating = Alexa.getSlotValue(handlerInput.requestEnvelope, 'star_rating');

    console.log("Product_id: " + product_id);
    let speechOutput = requestAttributes.t('FEEDBACK_SUBMIT_MESSAGE');

    var feedback;
    switch (intent) {
      case 'SubmitBugReport':
        feedback = {
          feedback_type_id: 1,
          feedbacker_id: feedbacker_id,
          product_id: product_id,
          feedback_content: feedback_content,
          feedback_context: feedback_context,
          feedback_steps_to_reproduce: feedback_steps_to_reproduce,
          feedback_criticality: feedback_criticality
        };
        console.log("Bug report: " + JSON.stringify(feedback));
        speechOutput = requestAttributes.t('SUBMIT_BUG_REPORT_MESSAGE');
        break;


      case 'SubmitFeatureRequest':
        feedback = {
          feedback_type_id: 2,
          feedbacker_id: feedbacker_id,
          product_id: product_id,
          feedback_content: feedback_content,
          feedback_context: feedback_context,
          feedback_problem: feedback_problem,
          feedback_solution: feedback_solution
        };
        console.log("Feature Request: " + JSON.stringify(feedback));
        speechOutput = requestAttributes.t('SUBMIT_FEATURE_REQUEST_MESSAGE');
        break;

      case 'SubmitQuestion':
        feedback = {
          feedback_type_id: 3,
          feedbacker_id: feedbacker_id,
          product_id: product_id,
          feedback_content: feedback_content,
          feedback_importance: feedback_importance,
        };
        console.log("Question: " + JSON.stringify(feedback));
        speechOutput = requestAttributes.t('SUBMIT_QUESTION_MESSAGE');
        break;

      case 'SubmitCriticism':
        feedback = {
          feedback_type_id: 4,
          feedbacker_id: feedbacker_id,
          product_id: product_id,
          feedback_content: feedback_content,
          feedback_star_rating: feedback_star_rating,
        };
        console.log("Criticism: " + JSON.stringify(feedback));
        speechOutput = requestAttributes.t('SUBMIT_CRITICISM_MESSAGE');
        break;

      case 'GeneralFeedback':
        feedback = {
          feedback_type_id: 5,
          feedbacker_id: feedbacker_id,
          product_id: product_id,
          feedback_content: feedback_content,
        };
        console.log("GeneralFeedback: " + JSON.stringify(feedback));
        speechOutput = requestAttributes.t('SUBMIT_GENERAL_FEEDBACK_MESSAGE');
        break;
    }
    await postFeedback(feedback).then((response) => {
      console.log(response);
    });

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

//========== SKILL CONFIGURATION ==========
const CheckRepliesHandler = {

  canHandle(handlerInput) {
    console.log("CheckRepliesHandler > Tested");

    let stateCanHandleIntent = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.botState) {
      switch (sessionAttributes.botState) {
        case 'SELECT_DEVICE_STATE':
          stateCanHandleIntent = true;
          break;
      }
    }

    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SelectDevice';

  },

  handle(handlerInput) {
    console.log("SelectDeviceHandler > Used");
    console.log(handlerInput);
    console.log(handlerInput.requestEnvelope);

    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();


    const product_name = handlerInput.requestEnvelope.request.intent.slots.product.value;
    sessionAttributes.product_name = product_name;

    const product_id = parseInt(handlerInput.requestEnvelope.request.intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.id);
    sessionAttributes.product_id = product_id;

    var speechOutput = `Thank you very much. So you want to give feedback regarding your ${product_name}. What type of feedback do you have? Is it a bug report, a feature request, a question, criticism or general feedback.`;

    sessionAttributes.botState = 'SELECT_FEEDBACK_TYPE_STATE';
    saveSessionAttributes(attributesManager, sessionAttributes, speechOutput);

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

//========== SKILL CONFIGURATION ==========

//========== DEFAULT INTENTS ==========

/**
 * 
 */
const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    var speechOutput = sessionAttributes.last_speech_output || 'Nothing found to repeat';

    attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

/**
 * Availability: [ALL-States],
 * Effect: Presents the user with a help message
 *         based on the current state.
 */
const HelpIntentHandler = {
  canHandle(handlerInput) {
    console.log("HelpIntentHandler > Tested");

    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },

  handle(handlerInput) {
    console.log("HelpIntentHandler > Used");

    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const requestAttributes = attributesManager.getRequestAttributes();

    let help_message = sessionAttributes.botState + '_HELP';
    console.log(help_message);

    var speechOutput = requestAttributes.t(help_message) || requestAttributes.t('HELP_MESSAGE');

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  }
};

/**
 * Description: Deals with intents when the user wants to skip a step.
 * Availability: [ALL-States]
 * Effect: Skips the current step or informs the user
 *         that skipping the current step is not possible.
 */
const SkipIntentHandler = {
  canHandle(handlerInput) {
    console.log("SkipIntentHandler > Tested");

    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NextIntent';

  },
  handle(handlerInput) {
    console.log("SkipIntentHandler > Used");
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();

    let speechOutput = requestAttributes.t('SKIP_MESSAGE');

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};



/**
 * Availability: [ALL-States],
 * Effect: Restarts the skill but does not reset the session
 */
const RestartIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StartOverIntent';
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();

    var speechOutput = requestAttributes.t('RESTART_MESSAGE') + requestAttributes.t('SELECT_ACTION_STATE_ENTER');
    saveSessionAttributes(attributesManager, initialSessionAttributes, speechOutput);

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

/**
 * Description: This handler accepts all stop intents from the user;
 * Availability: [ALL-States];
 * Effect: Exits the skill and resets the session;
 */
const StopIntentHandler = {
  canHandle(handlerInput) {
    console.log("StopIntentHandler > Tested")

    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    console.log("StopIntentHandler > Used")

    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();

    let speechOutput = requestAttributes.t('STOP_MESSAGE');
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(true)
      .getResponse()
  },
};

/**
 * Availability: [ALL-States],
 * Effect:
 */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    console.log("FallbackIntentHandler > Tested")
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
  },
  handle(handlerInput) {
    console.log("FallbackIntentHandler > Used")
    console.log(handlerInput);
    console.log(handlerInput.requestEnvelope);

    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();

    let speechOutput = requestAttributes.t('FALLBACK_MESSAGE');

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

/**
 * Availability: [ALL-States],
 * Effect: 
 */
const UnhandledIntentHandler = {
  canHandle() {
    console.log("UnhandledIntentHandler > Tested")
    return true;
  },
  handle(handlerInput) {
    console.log("UnhandledIntentHandler > Used")
    console.log(handlerInput);
    console.log(handlerInput.requestEnvelope);

    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const sessionAttributes = attributesManager.getSessionAttributes();

    let speechOutput = requestAttributes.t('UNHANDLED_INTENT_MESSAGE');

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    console.log(`Error full: ${error}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak(`Error: ${error.message}`)
      .reprompt(`Error: ${error.message}`)
      .getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: Alexa.getLocale(handlerInput.requestEnvelope),
      resources: languageStrings,
    });
    localizationClient.localize = function localize() {
      const args = arguments;
      const values = [];
      for (let i = 1; i < args.length; i += 1) {
        values.push(args[i]);
      }
      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: 'sprintf',
        sprintf: values,
      });
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function translate(...args) {
      return localizationClient.localize(...args);
    };
  },
};

function getPersistenceAdapter() {
  // Determines persistence adapter to be used based on environment
  const s3Adapter = require('ask-sdk-s3-persistence-adapter');
  /*return new s3Adapter.S3PersistenceAdapter({
    bucketName: ffprocess.env.S3_PERSISTENCE_BUCKET,
  });*/
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .withPersistenceAdapter(getPersistenceAdapter())
  .addRequestHandlers(
    LaunchRequest,
    //SelectDeviceHandler,
    FeedbackHandler,
    CheckRepliesHandler,

    RepeatIntentHandler,
    HelpIntentHandler,

    SkipIntentHandler,
    RestartIntentHandler,
    StopIntentHandler,

    FallbackIntentHandler,
    UnhandledIntentHandler,

    SessionEndedRequest
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
