:- module(matching_rules, [core_weight/2, facility_weight/2, hard_requirement/1]).

% Human-readable policy facts for reports and rule inspection.
% The executable JSON bridge and matching predicates are in engine.pl.

core_weight(within_budget, 40).
core_weight(preferred_township, 25).
core_weight(preferred_property_type, 10).
core_weight(enough_bedrooms, 20).
core_weight(enough_bathrooms, 5).
core_weight(sufficient_area, 5).

facility_weight(must_have, 3).
facility_weight(prefer, 2).

hard_requirement(listing_type).
hard_requirement(maximum_budget).
hard_requirement(preferred_township).
hard_requirement(property_type).
hard_requirement(bedrooms).
hard_requirement(known_minimum_area).
hard_requirement(known_false_must_have_facility).
