/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopUIViewModel.js
 * Purpose: Coordinates UI store updates and result mapping.
 */
import ClosedLoopResultMapper from "./ClosedLoopResultMapper.js";
export const CLOSED_LOOP_UI_VIEW_MODEL_VERSION="10.1.0";
export default class ClosedLoopUIViewModel{
 constructor({store,mapper=null}={}){if(!store?.setState)throw new TypeError("store required");this.store=store;this.mapper=mapper??new ClosedLoopResultMapper();}
 setConnecting(){return this.store.setState({status:"connecting",stage:"connect",busy:true,error:""});}
 setReady(){return this.store.setState({status:"ready",stage:"ready",busy:false,connected:true,error:""});}
 setAnalyzing(){return this.store.setState({status:"analyzing",stage:"analysis",busy:true,error:""});}
 setAwaitingResult(){return this.store.setState({status:"awaiting-result",stage:"awaiting-result",busy:false});}
 setSubmittingResult(){return this.store.setState({status:"submitting-result",stage:"settlement",busy:true,error:""});}
 setPaused(paused){return this.store.setState({status:paused?"paused":"ready",paused,busy:false});}
 applyResult(result){return this.store.setState({...this.mapper.map(result),busy:false,connected:true});}
 applyError(error){return this.store.setState({...this.mapper.mapError(error),busy:false});}
 reset(){return this.store.reset();}
 get snapshot(){return this.store.getSnapshot();}
 get summary(){return {version:CLOSED_LOOP_UI_VIEW_MODEL_VERSION,mapper:this.mapper.summary,store:this.store.summary};}
}
