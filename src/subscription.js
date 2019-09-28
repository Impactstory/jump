import _ from "lodash";


import {sumObjects} from "./util";

const docDelCostPerUse = 25
const hardTurnawayProp = 0.1



class BaseSubscription {
    constructor() {
        this.usage = {
            softTurnaway: 0,
            hardTurnaway: 0,
            fullSubscription: 0,
            docdel: 0,
            backCatalog: 0,
            oa: 0
        }
        this.cost = 0
        this.name = null
        this.year = null
        this.usageSortOrder = {
            hardTurnaway: 0,
            softTurnaway: 1,
            docdel: 2,
            fullSubscription: 3,
            backCatalog: 4,
            oa: 5,
        }

        // from http://colorbrewer2.org/#type=qualitative&scheme=Set2&n=3
        this.usageColors = {
            hardTurnaway: "#af4448",
            softTurnaway: "#ffa4a2",
            docdel: "#0069c0",
            fullSubscription: "#64b5f6",
            backCatalog: "#76d275",
            oa: "#43a047",
        }
    }

    costPerPaidUse() {
        return (this.cost / this.paidUseCount()) || 0
    }

    paidUseCount() {
        return this.usage.fullSubscription + this.usage.docdel
    }

    freeUseCount() {
        return this.usage.oa + this.usage.backCatalog
    }

    useCount() {
        return _.sum(Object.values(this.usage))
    }

    getCostForUsageType(useType) {
        return (this.name === useType) ? this.cost : 0
    }

    getTurnawaysCount() {
        return this.usage.hardTurnaway + this.usage.softTurnaway
    }

    getFulfilledUsesCount() {
        return this.useCount() - this.getTurnawaysCount()
    }

    usageStats() {
        const useCount = this.useCount()
        const ret = Object.entries(this.usage).map(([k, v]) => {
            const costForThisUseType = this.getCostForUsageType(k)
            return {
                name: k,
                count: v,
                color: this.usageColors[k],
                percentage: 100 * v / useCount,
                cost: costForThisUseType,
                costPerCount: (costForThisUseType / v) || 0 // fix division by 0
            }
        })

        ret.sort((a, b) => {
            return this.usageSortOrder[a.name] - this.usageSortOrder[b.name]
        })

        return ret

    }

    addSubscriptionObj(subscription) {
        if (subscription.name !== this.name) {
        }
        Object.entries(subscription.usage).forEach(([k, v]) => {
            this.usage[k] += v
        })
        this.cost += subscription.cost
    }

    selfStat() {
        throw "selfStat() needs to be overridden"
    }
}


class SubscriptionPackage extends BaseSubscription {
    constructor(subsToAdd, year) {
        super()
        this.name = "accumulator"
        this.year = year
        this.subscriptions = makeBlankSubscriptions(year)

        subsToAdd.forEach(sub => {
            this.addSubscriptionObj(sub)
        })
    }


    addSubscriptionObj(newSub) {
        if (newSub.name === "accumulator") {
            this.addAccumulator(newSub)
        } else {
            this.subscriptions.find(x => x.name === newSub.name).addSubscriptionObj(newSub)
            Object.entries(newSub.usage).forEach(([k, v]) => {
                this.usage[k] += v
            })
            this.cost += newSub.cost
        }
    }

    addAccumulator(accumulator) {
        accumulator.subscriptions.forEach((sub) => {
            this.addSubscriptionObj(sub)
        })
    }

    selfStat() {
        throw "SubscriptionPackage doesn't have a selfStat()"
    }

    getSubscription(name) {
        return this.subscriptions.find(x => x.name === name)
    }

    getCostForUsageType(usageType) {
        if (["fullSubscription", "docdel"].includes(usageType)) {
            return this.getSubscription(usageType).cost
        } else {
            return 0
        }
    }


}

class FullSubscription extends BaseSubscription {
    constructor() {
        super()
        this.name = "fullSubscription"
    }

    set(apiUsageStats, cost) {
        const total = apiUsageStats.useCount
        const free = apiUsageStats.oaUseCount + apiUsageStats.backCatalogUseCount
        const nonFree = total - free


        this.usage = {
            softTurnaway: 0,
            hardTurnaway: 0,
            fullSubscription: nonFree,
            docdel: 0,
            oa: apiUsageStats.oaUseCount || 0,
            backCatalog: apiUsageStats.backCatalogUseCount || 0
        }

        this.cost = cost || 0
    }

    selfStat() {
        const usageStats = this.usageStats()
        return usageStats.find(x => x.name === this.name)
    }
}

class DocdelSubscription extends BaseSubscription {
    constructor(myFullSubscription) {
        super()
        this.name = "docdel"
        if (myFullSubscription) this.set(myFullSubscription)
    }

    set(myFullSubscription) {
        const turnaway = myFullSubscription.usage.fullSubscription
        const hardTurnawayCount = turnaway * hardTurnawayProp


        this.usage = {
            softTurnaway: Math.round(turnaway - hardTurnawayCount),
            hardTurnaway: 0,
            fullSubscription: 0,
            docdel: turnaway * hardTurnawayProp,
            backCatalog: myFullSubscription.usage.backCatalog || 0,
            oa: myFullSubscription.usage.oa || 0
        }

        this.cost = (docDelCostPerUse * hardTurnawayCount) || 0
        this.year = myFullSubscription.year
    }

    selfStat() {
        const usageStats = this.usageStats()
        return usageStats.find(x => x.name === this.name)
    }

    costPerPaidUse() {
        return docDelCostPerUse
    }
}

class FreeSubscription extends BaseSubscription {
    constructor(myFullSubscription) {
        super()
        this.name = "free"
        if (myFullSubscription) this.set(myFullSubscription)
    }

    set(myFullSubscription) {
        const turnaway = myFullSubscription.usage.fullSubscription
        let hardTurnawayCount = turnaway * hardTurnawayProp

        this.usage = {
            softTurnaway: turnaway - hardTurnawayCount,
            hardTurnaway: hardTurnawayCount,
            fullSubscription: 0,
            docdel: 0,
            backCatalog: myFullSubscription.usage.backCatalog || 0,
            oa: myFullSubscription.usage.oa || 0
        }
        this.cost = 0
        this.year = myFullSubscription.year
    }

    selfStat() {
        return {
            name: "free",
            count: this.freeUseCount(),
            percentage: 100 * this.freeUseCount() / this.useCount(),
            cost: 0,
            costPerCount: 0
        }
    }
}

const makeBlankSubscriptions = function (year) {
    const ret = [
        new FullSubscription(),
        new DocdelSubscription(),
        new FreeSubscription()
    ]
    ret.forEach(x => {
        x.year = year
    })

    return ret
}

const makeSubscriptions = function (apiUsageStats, cost, year) {
    const full = new FullSubscription()
    full.set(apiUsageStats, cost)
    full.year = year

    return [
        full,
        new DocdelSubscription(full),
        new FreeSubscription(full)
    ]
}



export {
    makeSubscriptions,
    SubscriptionPackage
}














