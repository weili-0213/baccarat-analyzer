/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopUIIntegration.js
 * Purpose: Connects Store, Renderer, Controller and EventBinder.
 */
export const CLOSED_LOOP_UI_INTEGRATION_VERSION="10.1.0";
export default class ClosedLoopUIIntegration{
 constructor({store,viewModel,renderer,controller,eventBinder}={}){if(!store||!viewModel||!renderer||!controller||!eventBinder)throw new TypeError("all UI modules required");Object.assign(this,{store,viewModel,renderer,controller,eventBinder});this.unsubscribe=null;this.connected=false;this.destroyed=false;}
 connect(){if(this.destroyed)throw new Error("integration destroyed");if(this.connected)return this;this.unsubscribe=this.store.subscribe(s=>this.renderer.render(s));this.eventBinder.bind();this.controller.connect();this.renderer.render(this.store.getSnapshot());this.connected=true;return this;}
 runAnalysis(input={}){return this.controller.runAnalysis(input);}
 submitRoundResult(input={}){return this.controller.submitRoundResult(input);}
 pause(){return this.controller.pause();}resume(){return this.controller.resume();}reset(){return this.controller.reset();}
 destroy(){if(this.destroyed)return this;this.unsubscribe?.();this.eventBinder.destroy();this.controller.destroy();this.renderer.destroy();this.store.clearListeners();this.connected=false;this.destroyed=true;return this;}
 get summary(){return {version:CLOSED_LOOP_UI_INTEGRATION_VERSION,connected:this.connected,destroyed:this.destroyed,controller:this.controller?.summary??null,store:this.store.summary,binder:this.eventBinder?.summary??null};}
}
