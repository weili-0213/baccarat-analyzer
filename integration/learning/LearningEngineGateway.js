/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/LearningEngineGateway.js
 * Purpose: Adapts the existing V7.1 Learning Engine.
 */
export const LEARNING_ENGINE_GATEWAY_VERSION = "9.5.0";
export default class LearningEngineGateway {
    constructor({learningEngine}={}) {
        if (!learningEngine||typeof learningEngine.learn!=="function") {
            throw new TypeError("LearningEngineGateway requires learningEngine.learn().");
        }
        this.learningEngine=learningEngine;
    }
    async learn(input={}){return this.learningEngine.learn(input);}
    get summary(){return {version:LEARNING_ENGINE_GATEWAY_VERSION};}
}
