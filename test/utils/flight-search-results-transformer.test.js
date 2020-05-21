import {SearchResultsWrapper} from '../../src/utils/flight-search-results-transformer';
import extendResponse from "../../src/utils/flight-search-results-transformer";
import {config} from "../../src/config/default";
import {uiEvent} from "../../src/utils/events";
const fs = require('fs');

var _ = require('lodash')
var assert = require('assert');



const sample = require('../test_data/sample_response_unprocessed');
const resultsWrapper = new SearchResultsWrapper(sample);
const sampleOfferIdAF_0012="c74624e5-83a3-44f9-8624-e583a3b40012";


describe('#extendResponse()', function () {
    it('should return merge out/ret offers and save a file', function () {
        let filename="yul_yyz_rt_1pax";
        const unmergedJSON = require("../test_data/"+filename)
        let sizeBefore=JSON.stringify(unmergedJSON).length;
        let start=Date.now();
        let mergedJSON = extendResponse(unmergedJSON);
        let end=Date.now();
        let sizeAfter=JSON.stringify(mergedJSON).length;
        console.log(`JSON size before:${sizeBefore}, JSON size after:${sizeAfter}, Merging time ${end-start}ms`);
        fs.createWriteStream('./'+filename+".extended").write(JSON.stringify(mergedJSON));
    });
});

describe('SearchResultsWrapper', function () {

    describe('#getOffer()', function () {
        it('should return an offer if it exists or null if it does not exist', function () {
            let offer = resultsWrapper.getOffer(sampleOfferIdAF_0012);
            let expected = {
                "expiration": "2020-05-13T14:58:05.800Z",
                "offerItems": {"e52f5198-9f37-4809-af51-989f37b809ba": {"passengerReferences": "7C53D5D6"}},
                "pricePlansReferences": {"PC19": {"flights": ["FL5"]}, "PC8": {"flights": ["FL2"]}},
                "price": {"currency": "EUR", "public": "4916.99", "commission": "39.97", "taxes": "919.99"},
                "offerId": "c74624e5-83a3-44f9-8624-e583a3b40012"
            }
            assert.notEqual(offer,undefined)
            assert.deepEqual(offer,expected)
            offer = resultsWrapper.getOffer('dummy-offer-id');
            assert.equal(offer,null)
        });
    });
    describe('#getOfferItineraries()', function () {
        it('should return an offer if it exists or null if it does not exist', function () {
            let itineraries = resultsWrapper.getOfferItineraries(sampleOfferIdAF_0012);
            assert.equal(itineraries.length,2)
            assert.equal(itineraries[0].itinId,'FL5')
            assert.equal(itineraries[1].itinId,'FL2')
        });
    });

    describe('#getOfferPricePlans()', function () {
        it('should return array of price plans, with pricePlanId property enriched', function () {
            let offer = resultsWrapper.getOfferPricePlans(sampleOfferIdAF_0012);
            assert.equal(offer.length,2)

            //check new properties
            assert.equal(offer[0].pricePlanId,'PC19')
            assert.equal(offer[1].pricePlanId,'PC8')

            assert.notEqual(offer,undefined)
            assert.deepEqual(offer[0],{ name: 'Business',amenities: [],checkedBaggages: { quantity: 2 },pricePlanId: 'PC19' })
        });
    });

    describe('#getItinerary()', function () {
        it('should return itinerary object(itinID and list of segments that belong to itinerary) with ID provided as a parameter (itinId property is enriched)', function () {
            let itinerary = resultsWrapper.getItinerary('FL5');

            //check if itinId was added
            assert.equal(itinerary.itinId,'FL5')
            console.log("Itinerary",JSON.stringify(itinerary))

            assert.equal(itinerary.segments.length,2)
            assert.deepEqual(itinerary, {
                "itinId": "FL5",
                "segments": [{
                    "operator": {"operatorType": "airline", "iataCode": "WS", "flightNumber": "AF6565"},
                    "origin": {"locationType": "airport", "iataCode": "YVR"},
                    "destination": {"locationType": "airport", "iataCode": "YYZ"},
                    "departureTime": "2020-06-17T16:00:00.000Z",
                    "arrivalTime": "2020-06-17T20:30:00.000Z",
                    "segmentId": "SEG7"
                }, {
                    "operator": {"operatorType": "airline", "iataCode": "AF", "flightNumber": "AF0351"},
                    "origin": {"locationType": "airport", "iataCode": "YYZ"},
                    "destination": {"locationType": "airport", "iataCode": "CDG"},
                    "departureTime": "2020-06-17T22:20:00.000Z",
                    "arrivalTime": "2020-06-18T05:55:00.000Z",
                    "segmentId": "SEG8"
                }]
            })
        });
    });

    describe('#findAlternativeOffers()', function () {
        it('should return an array all offers available in search results for a given itinerary', function () {
            let matchingOffers = resultsWrapper.findAlternativeOffers(sampleOfferIdAF_0012);
            assert.equal(matchingOffers.length,5);

            //cross check - make sure each offer returned by #findAvailableItineraryOffers() indeed contains exactly same itineraries as requested
            matchingOffers.forEach(offer=>{
                let itinIds = resultsWrapper._getOfferItinerariesIds(offer.offerId);
                itinIds.sort();
                assert.deepEqual(itinIds,[ 'FL2','FL5'])
            })
        });
    });

    describe('#generateTripFareFamilyMap()', function () {
        it('should return a list with mapping between itinID, offerID, pricePlanID and its price for all available price plans for a given itinerary', function () {
            let mapping = resultsWrapper.generateTripRatesData(sampleOfferIdAF_0012);
            let expected = [{"itinId":"FL5","pricePlanId":"PC2","offerId":"c74624e5-83a3-44f9-8624-e583a3b4000e","price":{"currency":"EUR","public":"650.39","commission":"1.81","taxes":"469.39"},"pricePlan":{"name":"Light","amenities":[],"checkedBaggages":{"quantity":0},"pricePlanId":"PC2"}},{"itinId":"FL2","pricePlanId":"PC3","offerId":"c74624e5-83a3-44f9-8624-e583a3b4000e","price":{"currency":"EUR","public":"650.39","commission":"1.81","taxes":"469.39"},"pricePlan":{"name":"Light","amenities":[],"checkedBaggages":{"quantity":0},"pricePlanId":"PC3"}},{"itinId":"FL5","pricePlanId":"PC23","offerId":"c74624e5-83a3-44f9-8624-e583a3b4000f","price":{"currency":"EUR","public":"1832.23","commission":"12.97","taxes":"535.23"},"pricePlan":{"name":"Premium Economy","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC23"}},{"itinId":"FL2","pricePlanId":"PC24","offerId":"c74624e5-83a3-44f9-8624-e583a3b4000f","price":{"currency":"EUR","public":"1832.23","commission":"12.97","taxes":"535.23"},"pricePlan":{"name":"Premium Economy","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC24"}},{"itinId":"FL5","pricePlanId":"PC19","offerId":"c74624e5-83a3-44f9-8624-e583a3b40010","price":{"currency":"EUR","public":"3328.83","commission":"26.29","taxes":"699.83"},"pricePlan":{"name":"Business","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC19"}},{"itinId":"FL2","pricePlanId":"PC24","offerId":"c74624e5-83a3-44f9-8624-e583a3b40010","price":{"currency":"EUR","public":"3328.83","commission":"26.29","taxes":"699.83"},"pricePlan":{"name":"Premium Economy","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC24"}},{"itinId":"FL5","pricePlanId":"PC23","offerId":"c74624e5-83a3-44f9-8624-e583a3b40011","price":{"currency":"EUR","public":"3419.39","commission":"26.64","taxes":"755.39"},"pricePlan":{"name":"Premium Economy","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC23"}},{"itinId":"FL2","pricePlanId":"PC8","offerId":"c74624e5-83a3-44f9-8624-e583a3b40011","price":{"currency":"EUR","public":"3419.39","commission":"26.64","taxes":"755.39"},"pricePlan":{"name":"Business","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC8"}},{"itinId":"FL5","pricePlanId":"PC19","offerId":"c74624e5-83a3-44f9-8624-e583a3b40012","price":{"currency":"EUR","public":"4916.99","commission":"39.97","taxes":"919.99"},"pricePlan":{"name":"Business","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC19"}},{"itinId":"FL2","pricePlanId":"PC8","offerId":"c74624e5-83a3-44f9-8624-e583a3b40012","price":{"currency":"EUR","public":"4916.99","commission":"39.97","taxes":"919.99"},"pricePlan":{"name":"Business","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC8"}}];
            assert.deepEqual(mapping,expected)
        });
    });


    describe('#generateTripFareFamilyMapAC()', function () {
        it('should return a list with mapping between itinID, offerID, pricePlanID and its price for all available price plans for a given itinerary', function () {
            const sampleFile = require('../test_data/air_canada_roundtrip');
            const rw = new SearchResultsWrapper(sample);
            let mapping = rw.generateTripRatesData("a6c7c1a6-56ba-41d1-92fe-18c325abad8a,7f4d2a46-32a1-4865-ba47-516c56e31e11");
            console.log(JSON.stringify(mapping))
        });
    });


});

// let map={"pricePlans":{"PC2":{"name":"Light","amenities":[],"checkedBaggages":{"quantity":0},"pricePlanId":"PC2"},"PC3":{"name":"Light","amenities":[],"checkedBaggages":{"quantity":0},"pricePlanId":"PC3"},"PC17":{"name":"Premium Economy","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC17"},"PC24":{"name":"Premium Economy","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC24"},"PC8":{"name":"Business","amenities":[],"checkedBaggages":{"quantity":2},"pricePlanId":"PC8"}},"itineraries":[{"itinId":"FL1","segments":[{"operator":{"operatorType":"airline","iataCode":"AF","flightNumber":"AF0379"},"origin":{"locationType":"airport","iataCode":"YVR"},"destination":{"locationType":"airport","iataCode":"CDG"},"departureTime":"2020-06-17T20:25:00.000Z","arrivalTime":"2020-06-18T06:15:00.000Z","segmentId":"SEG1"}]},{"itinId":"FL2","segments":[{"operator":{"operatorType":"airline","iataCode":"AF","flightNumber":"AF0374"},"origin":{"locationType":"airport","iataCode":"CDG"},"destination":{"locationType":"airport","iataCode":"YVR"},"departureTime":"2020-06-24T08:15:00.000Z","arrivalTime":"2020-06-24T18:25:00.000Z","segmentId":"SEG2"}]}],"offers":{"c74624e5-83a3-44f9-8624-e583a3b40001":{"price":{"currency":"EUR","public":"575.40","commission":"1.09","taxes":"466.40"},"offerId":"c74624e5-83a3-44f9-8624-e583a3b40001","itinToPlanMap":{"FL1":"PC2","FL2":"PC3"},"planToItinMap":{"PC2":"FL1","PC3":"FL2"}},"c74624e5-83a3-44f9-8624-e583a3b40002":{"price":{"currency":"EUR","public":"1551.24","commission":"10.19","taxes":"532.24"},"offerId":"c74624e5-83a3-44f9-8624-e583a3b40002","itinToPlanMap":{"FL1":"PC17","FL2":"PC24"},"planToItinMap":{"PC17":"FL1","PC24":"FL2"}},"c74624e5-83a3-44f9-8624-e583a3b40003":{"price":{"currency":"EUR","public":"3121.84","commission":"24.25","taxes":"696.84"},"offerId":"c74624e5-83a3-44f9-8624-e583a3b40003","itinToPlanMap":{"FL1":"PC8","FL2":"PC24"},"planToItinMap":{"PC8":"FL1","PC24":"FL2"}},"c74624e5-83a3-44f9-8624-e583a3b40004":{"price":{"currency":"EUR","public":"3139.40","commission":"23.87","taxes":"752.40"},"offerId":"c74624e5-83a3-44f9-8624-e583a3b40004","itinToPlanMap":{"FL1":"PC17","FL2":"PC8"},"planToItinMap":{"PC17":"FL1","PC8":"FL2"}},"c74624e5-83a3-44f9-8624-e583a3b40005":{"price":{"currency":"EUR","public":"4710.00","commission":"37.93","taxes":"917.00"},"offerId":"c74624e5-83a3-44f9-8624-e583a3b40005","itinToPlanMap":{"FL1":"PC8","FL2":"PC8"},"planToItinMap":{"PC8":"FL2"}}}}
