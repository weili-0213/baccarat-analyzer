/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopUIRenderer.js
 * Purpose: Renders Closed-Loop UI state into dashboard DOM targets.
 */
export const CLOSED_LOOP_UI_RENDERER_VERSION="10.1.0";
const selectors={status:"[data-ai-status]",stage:"[data-ai-stage]",simulation:"[data-ai-simulation]",prediction:"[data-ai-prediction]",confidence:"[data-ai-confidence]",decision:"[data-ai-decision]",strategy:"[data-ai-strategy]",bet:"[data-ai-bet]",execution:"[data-ai-execution]",feedback:"[data-ai-feedback]",learning:"[data-ai-learning]",adaptive:"[data-ai-adaptive]",error:"[data-ai-error]",analyzeButton:"[data-ai-analyze]",submitResultButton:"[data-ai-submit-result]",pauseButton:"[data-ai-pause]",resumeButton:"[data-ai-resume]",resetButton:"[data-ai-reset]"};
export default class ClosedLoopUIRenderer{
 constructor({root,selectors:custom={}}={}){if(!root?.querySelector)throw new TypeError("DOM-like root required");this.root=root;this.selectors={...selectors,...custom};this.elements={};for(const[k,v]of Object.entries(this.selectors))this.elements[k]=root.querySelector(v);}
 render(view={}){for(const key of ["status","stage","simulation","prediction","confidence","decision","strategy","bet","execution","feedback","learning","adaptive","error"]){if(this.elements[key])this.elements[key].textContent=view[key]??(key==="error"?"":"—");}
  const busy=!!view.busy,paused=!!view.paused;if(this.elements.analyzeButton)this.elements.analyzeButton.disabled=busy||paused;if(this.elements.submitResultButton)this.elements.submitResultButton.disabled=busy||paused;if(this.elements.pauseButton)this.elements.pauseButton.disabled=busy||paused;if(this.elements.resumeButton)this.elements.resumeButton.disabled=busy||!paused;if(this.elements.resetButton)this.elements.resetButton.disabled=busy;return view;}
 destroy(){this.elements={};this.root=null;return this;}
 get summary(){return {version:CLOSED_LOOP_UI_RENDERER_VERSION,selectorCount:Object.keys(this.selectors).length};}
}
