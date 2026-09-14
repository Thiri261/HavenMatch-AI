:- use_module(library(http/json)).
:- initialization(main, main).

% Read one JSON request from Node.js and return one JSON response.
main :-
    json_read_dict(user_input, Input, []),
    get_dict(request, Input, Request),
    get_dict(properties, Input, Properties),
    findall(Result,
        ( member(Property, Properties),
          property_matches(Property, Request, Score, ScoreStatus, MatchedWeight, SelectedWeight, Reasons),
          Result = Property.put(_{score: Score, scoreStatus: ScoreStatus,
                                  matchedWeight: MatchedWeight, selectedWeight: SelectedWeight,
                                  reasons: Reasons})
        ),
        Matches),
    json_write_dict(current_output, _{matches: Matches}),
    nl.

property_matches(Property, Request, Score, ScoreStatus, MatchedWeight, SelectedWeight, Reasons) :-
    get_dict(listingType, Property, ListingType),
    get_dict(intent, Request, Intent),
    ListingType == Intent,
    optional_budget(Property, Request),
    optional_township(Property, Request),
    optional_type(Property, Request),
    strict_minimum(Property, Request, bedrooms, enough_bedrooms),
    known_minimum(Property, Request, bathrooms, enough_bathrooms),
    known_property_minimum(Property, Request, areaSqft, minimumAreaSqft, sufficient_area),
    optional_capacity(Property, Request),
    all_must_have_facilities_allowed(Property, Request),
    reasons(Property, Request, Reasons),
    matched_weight(Property, Request, MatchedWeight),
    selected_weight(Request, SelectedWeight),
    normalized_score(MatchedWeight, SelectedWeight, Score, ScoreStatus).

optional_budget(Property, Request) :-
    ( get_dict(maximumBudget, Request, Maximum), number(Maximum)
    -> get_dict(priceMmk, Property, Price), number(Price), Price =< Maximum
    ;  true
    ).

optional_township(Property, Request) :-
    ( get_dict(township, Request, Township), string(Township), Township \= ""
    -> get_dict(township, Property, Township)
    ;  true
    ).

optional_type(Property, Request) :-
    ( get_dict(propertyType, Request, Requested), string(Requested), Requested \= ""
    -> get_dict(propertyType, Property, Actual), type_matches(Actual, Requested)
    ;  true
    ).

% The apartment preference accepts both apartment and condominium listings.
% The cut keeps this relation deterministic so an apartment is not counted
% once by this alias rule and again by the exact-match rule.
type_matches(Actual, "apartment") :-
    !,
    ( Actual == "apartment"
    ; Actual == "condominium"
    ).
type_matches(Actual, Requested) :-
    Actual == Requested.

% Bedrooms are a strict housing requirement. Unknown bedroom counts do not qualify.
strict_minimum(Property, Request, Key, Predicate) :-
    ( get_dict(Key, Request, Required), number(Required)
    -> get_dict(Key, Property, Actual), number(Actual), call(Predicate, Actual, Required)
    ;  true
    ).

% Bathroom and area values are sparse in source listings. A known value must pass;
% an unknown value is retained and the Node explanation layer adds a warning.
known_minimum(Property, Request, Key, Predicate) :-
    ( get_dict(Key, Request, Required), number(Required)
    -> ( get_dict(Key, Property, Actual), number(Actual)
       -> call(Predicate, Actual, Required)
       ;  true
       )
    ;  true
    ).

% Request and property use different names for the area threshold and value.
known_property_minimum(Property, Request, PropertyKey, RequestKey, Predicate) :-
    ( get_dict(RequestKey, Request, Required), number(Required)
    -> ( get_dict(PropertyKey, Property, Actual), number(Actual)
       -> call(Predicate, Actual, Required)
       ;  true
       )
    ;  true
    ).

enough_bedrooms(Actual, Required) :- Actual >= Required.
enough_bathrooms(Actual, Required) :- Actual >= Required.
sufficient_area(Actual, Required) :- Actual >= Required.

property_capacity(Property, Capacity) :-
    ( get_dict(maxOccupants, Property, Stated), number(Stated)
    -> Capacity = Stated
    ; get_dict(bedrooms, Property, Bedrooms), number(Bedrooms), Bedrooms > 0,
      Capacity is Bedrooms * 2
    ).

optional_capacity(Property, Request) :-
    ( get_dict(people, Request, Required), number(Required)
    -> ( property_capacity(Property, Capacity) -> Capacity >= Required ; true )
    ; true
    ).

facility_spec(reliable_electricity, reliableElectricity, reliable_electricity_available).
facility_spec(generator, generator, backup_power_available).
facility_spec(reliable_water, reliableWater, reliable_water_available).
facility_spec(internet_ready, internetReady, internet_available).
facility_spec(air_conditioning, airConditioning, air_conditioning_available).
facility_spec(parking, parking, parking_available).
facility_spec(security, security, security_available).
facility_spec(pets_allowed, petFriendly, pets_allowed).
facility_spec(near_shops, nearShops, near_shops).
facility_spec(near_bus_stop, nearBusStop, near_bus_stop).
facility_spec(main_road_access, mainRoadAccess, main_road_access).

facility_priority(Request, RequestKey, Priority) :-
    get_dict(facilities, Request, Facilities),
    is_dict(Facilities),
    get_dict(RequestKey, Facilities, Priority).

requested_priority("must_have").
requested_priority("prefer").

all_must_have_facilities_allowed(Property, Request) :-
    \+ ( facility_spec(RequestKey, PropertyKey, _),
         facility_priority(Request, RequestKey, "must_have"),
         get_dict(PropertyKey, Property, false)
       ).

reasons(Property, Request, Reasons) :-
    findall(Reason, reason(Property, Request, Reason), Reasons).

reason(Property, Request, within_budget) :-
    get_dict(maximumBudget, Request, Maximum), number(Maximum),
    get_dict(priceMmk, Property, Price), Price =< Maximum.
reason(Property, Request, preferred_township) :-
    get_dict(township, Request, Township), string(Township), Township \= "",
    get_dict(township, Property, Township).
reason(Property, Request, preferred_property_type) :-
    get_dict(intent, Request, Intent), Intent \== "land",
    get_dict(propertyType, Request, Requested), string(Requested), Requested \= "",
    get_dict(propertyType, Property, Actual), type_matches(Actual, Requested).
reason(Property, Request, enough_bedrooms) :-
    get_dict(bedrooms, Request, Required), number(Required),
    get_dict(bedrooms, Property, Actual), number(Actual), Actual >= Required.
reason(Property, Request, enough_bathrooms) :-
    get_dict(bathrooms, Request, Required), number(Required),
    get_dict(bathrooms, Property, Actual), number(Actual), Actual >= Required.
reason(Property, Request, sufficient_area) :-
    get_dict(minimumAreaSqft, Request, Required), number(Required),
    get_dict(areaSqft, Property, Actual), number(Actual), Actual >= Required.
reason(Property, Request, enough_capacity) :-
    get_dict(people, Request, Required), number(Required),
    property_capacity(Property, Capacity), Capacity >= Required.
reason(Property, Request, Reason) :-
    facility_spec(RequestKey, PropertyKey, Reason),
    facility_priority(Request, RequestKey, Priority),
    requested_priority(Priority),
    get_dict(PropertyKey, Property, true).

matched_weight(Property, Request, Score) :-
    findall(Points, points(Property, Request, Points), Values),
    sum_list(Values, Score).

selected_weight(Request, Weight) :-
    findall(Points, selected_points(Request, Points), Values),
    sum_list(Values, Weight).

selected_points(Request, 40) :-
    get_dict(maximumBudget, Request, Value), number(Value).
selected_points(Request, 25) :-
    get_dict(township, Request, Value), string(Value), Value \= "".
selected_points(Request, 10) :-
    get_dict(intent, Request, Intent), Intent \== "land",
    get_dict(propertyType, Request, Value), string(Value), Value \= "".
selected_points(Request, 20) :-
    get_dict(bedrooms, Request, Value), number(Value).
selected_points(Request, 5) :-
    get_dict(bathrooms, Request, Value), number(Value).
selected_points(Request, 5) :-
    get_dict(minimumAreaSqft, Request, Value), number(Value).
selected_points(Request, 5) :-
    get_dict(people, Request, Value), number(Value).
selected_points(Request, 3) :-
    facility_spec(RequestKey, _, _),
    facility_priority(Request, RequestKey, "must_have").
selected_points(Request, 2) :-
    facility_spec(RequestKey, _, _),
    facility_priority(Request, RequestKey, "prefer").

points(Property, Request, 40) :- reason(Property, Request, within_budget).
points(Property, Request, 25) :- reason(Property, Request, preferred_township).
points(Property, Request, 10) :- reason(Property, Request, preferred_property_type).
points(Property, Request, 20) :- reason(Property, Request, enough_bedrooms).
points(Property, Request, 5) :- reason(Property, Request, enough_bathrooms).
points(Property, Request, 5) :- reason(Property, Request, sufficient_area).
points(Property, Request, 5) :- reason(Property, Request, enough_capacity).
points(Property, Request, 3) :-
    facility_spec(RequestKey, PropertyKey, _),
    facility_priority(Request, RequestKey, "must_have"),
    get_dict(PropertyKey, Property, true).
points(Property, Request, 2) :-
    facility_spec(RequestKey, PropertyKey, _),
    facility_priority(Request, RequestKey, "prefer"),
    get_dict(PropertyKey, Property, true).

normalized_score(_, 0, 0, "not_scored") :- !.
normalized_score(MatchedWeight, SelectedWeight, Score, "scored") :-
    Percentage is round((MatchedWeight * 100) / SelectedWeight),
    cap_score(Percentage, Score).

cap_score(Value, 100) :- Value > 100, !.
cap_score(Value, Value).
