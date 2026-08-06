/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/ExecutionPlanValidator.js
 * Purpose: Validates bet plan, bankroll and risk limits before execution.
 */
export const EXECUTION_PLAN_VALIDATOR_VERSION = "9.8.0";
export default class ExecutionPlanValidator {
    validate({input={}}={}){
        const errors=[];
        const plan=input.betPlan;
        const balance=input.bankroll?.balance??0;
        if(!plan)errors.push("missing-plan");
        if(plan&&plan.action!=="bet")errors.push("invalid-action");
        if(plan&&!plan.betType)errors.push("missing-bet-type");
        if(plan&&(!Number.isFinite(plan.amount)||plan.amount<=0))errors.push("invalid-amount");
        if(plan&&Number.isFinite(balance)&&plan.amount>balance)errors.push("insufficient-bankroll");
        const maxBet=input.limits?.maxBet;
        if(plan&&Number.isFinite(maxBet)&&plan.amount>maxBet)errors.push("max-bet-exceeded");
        const minBet=input.limits?.minBet;
        if(plan&&Number.isFinite(minBet)&&plan.amount<minBet)errors.push("min-bet-not-met");
        return {valid:errors.length===0,errors};
    }
    get summary(){return {version:EXECUTION_PLAN_VALIDATOR_VERSION};}
}
