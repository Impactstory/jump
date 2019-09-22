const docDelPricePerUse = 25
const hardTurnawayProp = 0.1



class BaseSnap {
    constructor() {
    }


    getUses() {
        throw "BaseSnap.getUses needs to be overridden"
    }

    getFulfilledCount() {
        return Object.values(this.getUses())
            .filter(x => x.isFulfillment)
            .map(x => x.count)
            .reduce((a, b) => a + b)
    }

    getTotalCost() {
        return Object.values(this.getUses())
            .map(x => x.count)
            .reduce((a, b) => a + b)
    }

    getPaidUsesCount() {
        return Object.values(this.getUses())
            .filter(x => x.price > 0)
            .map(x => x.count)
            .reduce((a, b) => a + b, 0)
    }

    getCostPerPaidUse() {
        if (!this.getPaidUsesCount()) {
            return 0
        }
        return this.getFulfilledCount() / this.getPaidUsesCount()
    }

    getEquippedUses() {
        const ret = {}
        Object.entries(this.getUses()).forEach(([k, v]) => {
            if (v.count > 0.1) ret[k] = v
        })
        return ret
    }

}



function blankMod() {
    return {
        name: name,
        price: 0,
        count: 0,
        color: "#000",
        isFulfillment: true,
        isPaid: false
    }
}

function makeBlankMods() {
    const blankJournalYear = {
        oaUseCount: 0,
        backCatalogUseCount: 0,
        useCount: 0,
    }
    return makeMods(blankJournalYear, "free", 0)
}


function makeMods(journalYear, subscriptionName, subscriptionPrice) {
    let base = blankMod()

    let freeCount = journalYear.oaUseCount + journalYear.backCatalogUseCount
    let unFreeCount = journalYear.useCount - freeCount
    let hardTurnawayCount = unFreeCount * hardTurnawayProp
    let softTurnawayCount = unFreeCount - hardTurnawayCount

    let makers = {
        oa: function () {
            return Object.assign({}, base, {
                name: "oa",
                count: journalYear.oaUseCount,
                color: "#43a047",
            })
        },
        backCatalog: function () {
            return Object.assign({}, base, {
                name: "backCatalog",
                count: journalYear.backCatalogUseCount,
                color: "#c0ca33",
            })
        },
        fullSubscription: function () {
            let ret = {
                name: "fullSubscription",
                color: "#ef5350",
                isPaid: true
            }
            if (subscriptionName === "fullSubscription") {
                ret = Object.assign({}, ret, {
                    price: subscriptionPrice,
                    count: unFreeCount,
                })
            }
            return Object.assign({}, base, ret)
        },
        docdel: function () {
            let ret = {
                name: "docdel",
                color: "#ff7043",
                isPaid: true
            }
            if (subscriptionName === "docdel") {
                ret = Object.assign({}, ret, {
                    price: hardTurnawayCount * docDelPricePerUse,
                    count: hardTurnawayCount,
                })
            }
            return Object.assign({}, base, ret)
        },
        hardTurnaway: function () {
            let ret = {
                name: "hardTurnaway",
                color: "#555",
                isFulfillment: false
            }

            // docdel wipes out all hard turnaways
            // fullsubscription does too
            if (subscriptionName === "free") {
                ret = Object.assign({}, ret, {
                    count: hardTurnawayCount,
                })
            }
            return Object.assign({}, blankMod(), ret)
        },
        softTurnaway: function () {
            let ret = {
                name: "softTurnaway",
                color: "#999",
                isFulfillment: false
            }

            // full subscription wipes out all soft turnaways
            if (subscriptionName !== "fullSubscription") {
                ret = Object.assign({}, ret, {
                    count: softTurnawayCount,
                })
            }
            return Object.assign({}, blankMod(), ret)
        },
    };
    const ret = {}
    Object.keys(makers).forEach(usageName => (
        ret[usageName] = makers[usageName]()
    ))
    return ret

}



export {
    makeBlankMods,
    makeMods,
    BaseSnap
}