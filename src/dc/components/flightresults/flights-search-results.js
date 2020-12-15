import React, {useEffect, useState} from 'react'
import {config} from "../../../config/default";
import style from './flights-search-results.module.scss'
import {
    FlightSearchResultsFilterHelper
} from "../../../utils/flight-search-results-filter-helper"
import ResultsPaginator from "../../components/common/pagination/results-paginator";
import Offer from "./flights-offer";
import SearchButton from "../search-form/search-button";

import { connect } from 'react-redux';
import {
    searchForFlightsAction,
    flightSearchCriteriaSelector,
    flightFiltersSelector,
    isFlightSearchInProgressSelector,
    isFlightSearchFormValidSelector,
    flightSearchResultsSelector,
    flightsErrorSelector,
    requestSearchResultsRestoreFromCache, isStoreInitialized
} from '../../../redux/sagas/shopping-flow-store';
import Spinner from "../../../components/common/spinner";


const ITEMS_PER_PAGE = config.FLIGHTS_PER_PAGE;

//Component to display flight search results
export function FlightsSearchResults({searchResults,filters, isSearchFormValid, onOfferDisplay, onSearchClicked, searchInProgress, error, onRestoreFromCache, isStoreInitialized, onRestoreResultsFromCache}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortType, setSortType] = useState('PRICE');

    useEffect(()=>{
        if(!isStoreInitialized)
            onRestoreResultsFromCache();
    },[])



    //called when user clicked on a specific offer
    function handleOfferDisplay(offerId) {
        if(onOfferDisplay) {
            onOfferDisplay(offerId);
        }else{
            console.warn('onOfferDisplay handler is not defined')
        }
    }

    if (searchResults === undefined) {
        return (<>Nothing was found</>)
    }

    function onActivePageChange(page) {
        setCurrentPage(page);
    }

    //SEARCH button was hit - search for flights
    const onSearchButtonClicked = () => {
        if(onSearchClicked)
            onSearchClicked();
    }
    function limitSearchResultsToCurrentPage(records) {
        let totalCount = records.length;
        if (totalCount === 0)
            return [];

        let startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        let endIdx = currentPage * ITEMS_PER_PAGE;
        if (endIdx >= totalCount)
            endIdx = totalCount;
        return records.slice(startIdx, endIdx)
    }


    let trips = [];
    let totalResultsCount=0;
    //only use helpers when there are search results present (initially it may be null/empty)
    if(searchResults) {
        const filterHelper = new FlightSearchResultsFilterHelper(searchResults);
        trips = filterHelper.generateSearchResults(sortType, filters)
        totalResultsCount = trips.length;
        trips = limitSearchResultsToCurrentPage(trips);
    }
    return (<>
            <SearchButton disabled={!isSearchFormValid} onSearchButtonClicked={onSearchButtonClicked}/>
            <Spinner enabled={searchInProgress}/>
            {error && (<div>ERRRORS OCCURED</div>)}
            <div className='pt-5'/>
            {/*<FastCheapFilter defaultValue={sortType} onToggle={setSortType}/>*/}
                {
                    trips.map(tripInfo => {
                        let offer = tripInfo.bestoffer;
                        let itineraries = tripInfo.itineraries;
                        let offerId = offer.offerId;
                        let price = offer.price;
                        return (<Offer offer={offer} itineraries={itineraries}
                                       offerId={offerId}
                                       price={price}
                                       key={offerId}
                                       onOfferDisplay={handleOfferDisplay}/>)

                    })
                }
                <ResultsPaginator activePage={currentPage} recordsPerPage={ITEMS_PER_PAGE}
                                  onActivePageChange={onActivePageChange} totalRecords={totalResultsCount}/>
        </>
    )

}


const mapStateToProps = state => ({
    filters: flightFiltersSelector(state),
    searchCriteria: flightSearchCriteriaSelector(state),
    searchInProgress: isFlightSearchInProgressSelector(state),
    searchResults: flightSearchResultsSelector(state),
    isSearchFormValid: isFlightSearchFormValidSelector(state),
    isStoreInitialized: isStoreInitialized(state),
    error:flightsErrorSelector(state)
});

const mapDispatchToProps = (dispatch) => {
    return {
        onSearchClicked: () => {
            dispatch(searchForFlightsAction())
        },
        onOfferDisplay: () => {
            dispatch(searchForFlightsAction())
        },
        onRestoreResultsFromCache: () => {
            dispatch(requestSearchResultsRestoreFromCache())
        },
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(FlightsSearchResults);
