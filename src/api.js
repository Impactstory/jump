import axios from 'axios'
import _ from "lodash";
import {makeSubscriptions} from "./subscription";


export const api = {
    loadingState: "ready",
    baseUrl: "https://rickscafe-api.herokuapp.com/jump/temp",


    fetchJournals(){
        this.loadingState = "loading"

        const url = this.baseUrl
        let request = axios.get(url)
            .then(resp => {


                return resp.data.list.map(journal => {
                    const downloadsByYear = apiDownloadsByYear(journal.downloads_by_year)
                    const downloadsOverall = apiDownloads(journal.downloads_by_year)

                    return {
                        meta: {
                            title: journal.title,
                            subject: journal.subject,
                            issnl: journal.issn_l

                        },
                        citations: journal.citations_from_mit_in_2018,
                        yearlyDownloads:downloadsByYear,
                        fullSubrCost2018: journal.dollars_2018_subscription,

                        // goal is to get rid of this
                        subscriptions: makeSubscriptions(downloadsOverall, journal.dollars_2018_subscription*5),
                    }
                })
            })
            .catch(e => {
                console.log("journals API error", e)
            })
            .finally(() => {
                this.loadingState = "complete"
            })

        return request
    }
}



function apiDownloadsByYear(api_downloads) {
    return api_downloads.year.map((year, i) => {
        return {
            useCount: api_downloads.total[i],
            oaUseCount: api_downloads.oa[i],
            backCatalogUseCount: api_downloads.back_catalog[i],
            year: year
        }
    })
}

const apiDownloads = function(api_downloads){
    return {
        useCount: _.sum(api_downloads.total),
        oaUseCount: _.sum(api_downloads.oa),
        backCatalogUseCount: _.sum(api_downloads.back_catalog),
    }
}

let downloads_by_year = {
    back_catalog: [
        47889,
        38643,
        31629,
        25658,
        20543
    ],
    oa: [
        13073,
        20623,
        27121,
        33091,
        38206
    ],
    total: [
        86722,
        86722,
        86722,
        86722,
        86722
    ],
    turnaways: [
        25759,
        27454,
        27970,
        27972,
        27972
    ],
    year: [
        2020,
        2021,
        2022,
        2023,
        2024
    ]
}