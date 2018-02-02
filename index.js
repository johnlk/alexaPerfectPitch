'use strict';

const Alexa = require('alexa-sdk');
var Speech = require('ssml-builder');

const GAME_STATES = {
    GAME: '_GAMEMODE', // Asking trivia questions.
    START: '_STARTMODE', // Entry point, start the game.
    // HELP: '_HELPMODE', // The user is asking for help.
};
const APP_ID = undefined; // TODO replace with your app ID (OPTIONAL)

const newSessionHandlers = {
    'LaunchRequest': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', true);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', true);
    },
    // 'AMAZON.HelpIntent': function () {
    //     this.handler.state = GAME_STATES.HELP;
    //     this.emitWithState('helpTheUser', true);
    // },
    'Unhandled': function () {
        console.log('unhandled event');
    },
};

function handleUserGuess(userDoesntKnow){
    if(userDoesntKnow){
        //emit the answer
        return;
    }
    var userAnswer = this.event.request.intent.slots.Answer.value;
    this.emit(':tell', 'You answered ' + userAnswer);
}

const startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    'StartGame': function (newGame) {

        var speech = new Speech();
        speech.audio('https://s3.amazonaws.com/pianonotes/A.mp3');
        
        Object.assign(this.attributes, {
            'speechOutput': 'Hello, here\'s a note.',
            'audioClip': speech.ssml(true),
            'repromptText': 'Just guess a note'
        });

        this.handler.state = GAME_STATES.GAME;
        this.emit(':ask', this.attributes['speechOutput'] + this.attributes['audioClip'], this.attributes['repromptText']);

    },
});

const gameStateHandlers = Alexa.CreateStateHandler(GAME_STATES.GAME, {
    'AnswerIntent': function () {
        handleUserGuess.call(this, false);
    },
    'DontKnowIntent': function () {
        handleUserGuess.call(this, true);
    },
    'AMAZON.StopIntent': function () {
        console.log('game stopped');
    },
    'Unhandled': function () {
        console.log('unhandled from trivia state');
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended in trivia state: ${this.event.request.reason}`);
    },
});

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.registerHandlers(newSessionHandlers, gameStateHandlers, startStateHandlers);
    alexa.execute();
};
