/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/AdaptiveParameterStore.js
 * Purpose: Stores current and previous adaptive parameter snapshots.
 */
export const ADAPTIVE_PARAMETER_STORE_VERSION = "9.6.0";
export default class AdaptiveParameterStore {
    constructor(initial={}) {
        this.current={...initial};
        this.previous=null;
        this.revision=0;
    }
    apply(candidate={}) {
        this.previous={...this.current};
        this.current={...candidate};
        this.revision++;
        return this.snapshot();
    }
    rollback() {
        if(this.previous){
            const restored={...this.previous};
            this.previous={...this.current};
            this.current=restored;
            this.revision++;
        }
        return this.snapshot();
    }
    reset(){this.current={};this.previous=null;this.revision=0;return this;}
    snapshot(){return {version:ADAPTIVE_PARAMETER_STORE_VERSION,revision:this.revision,
        current:{...this.current},previous:this.previous?{...this.previous}:null};}
}
