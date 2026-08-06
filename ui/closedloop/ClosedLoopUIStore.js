/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopUIStore.js
 * Purpose: Stores current Closed-Loop UI state.
 */
export const CLOSED_LOOP_UI_STORE_VERSION="10.1.0";
const initial=()=>({status:"idle",stage:"—",simulation:"—",prediction:"—",confidence:"—",decision:"—",strategy:"—",bet:"—",execution:"—",feedback:"—",learning:"—",adaptive:"—",error:"",busy:false,paused:false,connected:false});
export default class ClosedLoopUIStore{
 constructor(){this.state=initial();this.listeners=new Set();}
 getSnapshot(){return {...this.state};}
 setState(patch={}){this.state={...this.state,...patch};this.notify();return this.getSnapshot();}
 reset(){this.state=initial();this.notify();return this.getSnapshot();}
 subscribe(listener){if(typeof listener!=="function")throw new TypeError("listener must be a function");this.listeners.add(listener);return()=>this.listeners.delete(listener);}
 notify(){const snapshot=this.getSnapshot();for(const listener of this.listeners)listener(snapshot);}
 clearListeners(){this.listeners.clear();return this;}
 get summary(){return {version:CLOSED_LOOP_UI_STORE_VERSION,listenerCount:this.listeners.size,snapshot:this.getSnapshot()};}
}
