/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopUIEventBinder.js
 * Purpose: Binds Dashboard buttons to ClosedLoopUIController actions.
 */
export const CLOSED_LOOP_UI_EVENT_BINDER_VERSION="10.1.0";
export default class ClosedLoopUIEventBinder{
 constructor({controller,renderer,outcomeProvider=null}={}){if(!controller?.runAnalysis)throw new TypeError("controller required");if(!renderer?.elements)throw new TypeError("renderer required");this.controller=controller;this.renderer=renderer;this.outcomeProvider=outcomeProvider??(()=>({}));this.bound=false;this.handlers={};}
 bind(){if(this.bound)return this;const e=this.renderer.elements;this.handlers={analyze:()=>this.controller.runAnalysis(),submit:()=>this.controller.submitRoundResult(this.outcomeProvider()),pause:()=>this.controller.pause(),resume:()=>this.controller.resume(),reset:()=>this.controller.reset()};e.analyzeButton?.addEventListener("click",this.handlers.analyze);e.submitResultButton?.addEventListener("click",this.handlers.submit);e.pauseButton?.addEventListener("click",this.handlers.pause);e.resumeButton?.addEventListener("click",this.handlers.resume);e.resetButton?.addEventListener("click",this.handlers.reset);this.bound=true;return this;}
 unbind(){if(!this.bound)return this;const e=this.renderer.elements;e.analyzeButton?.removeEventListener("click",this.handlers.analyze);e.submitResultButton?.removeEventListener("click",this.handlers.submit);e.pauseButton?.removeEventListener("click",this.handlers.pause);e.resumeButton?.removeEventListener("click",this.handlers.resume);e.resetButton?.removeEventListener("click",this.handlers.reset);this.handlers={};this.bound=false;return this;}
 destroy(){this.unbind();this.controller=null;this.renderer=null;return this;}
 get summary(){return {version:CLOSED_LOOP_UI_EVENT_BINDER_VERSION,bound:this.bound};}
}
