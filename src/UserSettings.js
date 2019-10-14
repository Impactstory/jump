


const displayNames = {
    docDelCostPerUse: "DocDel transaction cost",
    illCostPerUse: "ILL transaction cost",
    hardTurnawayProp: "ILL/DocDel request percentage",
    bigDealCostAnnualIncrease: "Big Deal cost % annual increase",
    subrCostAnnualIncrease: "A-la-carte subscription cost % annual increase",
    bigDealCost: "Big Deal annual cost",

    downloadsPerCitation: "Downloads to add for each citation",
    downloadsPerAuthorship: "Downloads to add for each authorship",
}

export default class UserSettings {
    constructor(){
        // item-level acquisition
        this.docDelCostPerUse = 25
        this.illCostPerUse = 5
        this.hardTurnawayProp = 0.5

        // cost: annual increase
        this.bigDealCostAnnualIncrease = 0.05
        this.subrCostAnnualIncrease = 0.08

        // cost
        this.bigDealCost = 2000000

        // impact
        this.downloadsPerCitation = 0
        this.downloadsPerAuthorship = 0

        // subscriptions
        this.subrs = {}
        this.defaultSubr = "ill"

        this.cache = {}


    }

    setSubr(issnl, subrName){
        this.subrs[issnl] = subrName
        this.clearCacheIssnl(issnl)

    }
    getSubr(issnl){
        return this.subrs[issnl] || this.defaultSubr
    }


    getCache(issnl, subrName, fnName){
        if (this.cache[issnl]
            && this.cache[issnl][subrName]
            && this.cache[issnl][subrName][fnName]){
            return this.cache[issnl][subrName][fnName]
        }
    }

    setCache(issnl, subrName, fnName, value){
        if (!this.cache[issnl]) this.cache[issnl] = {}
        if (!this.cache[issnl][subrName]) this.cache[issnl][subrName] = {}
        this.cache[issnl][subrName][fnName] = value
    }
    clearCacheIssnl(issnl){
        this.cache[issnl] = {}
    }
    clearCache(){
        this.cache = {}
    }

    getList(){
        return Object.entries(displayNames).map(([k, v])=>{
            return {
                name: k,
                displayName: v,
                val: this[k]
            }
        })
    }
    setFromList(myList){
        this.clearCache()
        myList.forEach(setting=>{
            this[setting.name] = parseFloat(setting.val)
        })

    }

}
