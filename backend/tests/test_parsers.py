"""
Unit tests for number, phone, date, time, and name parsers.
"""

from datetime import date, timedelta
from app.conversation.parsers import (
    parse_number,
    parse_phone,
    parse_date,
    parse_time,
    parse_name,
    match_option,
)


def test_number_parser_tamil_script():
    assert parse_number("எனக்கு இரண்டு அறைகள் வேண்டும்") == 2
    assert parse_number("மூன்று பேர் வருகிறோம்") == 3
    assert parse_number("ஐந்து டிக்கெட்") == 5
    assert parse_number("நான்கு நபர்கள்") == 4
    assert parse_number("பத்து") == 10


def test_number_parser_tanglish():
    assert parse_number("rendu per varom") == 2
    assert parse_number("naalu guests") == 4
    assert parse_number("moonu room venum") == 3
    assert parse_number("anju per") == 5
    assert parse_number("onnu pothum") == 1
    assert parse_number("4 members") == 4


def test_phone_parser():
    # Continuous digits
    assert parse_phone("My number is 9840123456") == "9840123456"
    assert parse_phone("+91 9444012345") == "9444012345"
    assert parse_phone("09840123456") == "9840123456"

    # Spaced digits
    assert parse_phone("98401 23456") == "9840123456"

    # Spoken Tamil digits
    spoken_tamil = "ஒன்பது எட்டு நான்கு பூஜ்ஜியம் ஒன்று இரண்டு மூன்று நான்கு ஐந்து ஆறு"
    assert parse_phone(spoken_tamil) == "9840123456"

    # Spoken Tanglish digits
    spoken_tanglish = "nine eight four zero one two three four five six"
    assert parse_phone(spoken_tanglish) == "9840123456"


def test_date_parser():
    today = date(2026, 11, 4)

    # Relative Tamil script
    assert parse_date("நாளைக்கு வர முடியுமா", base_date=today) == "2026-11-05"
    assert parse_date("இன்றைக்கு உதவி தேவை", base_date=today) == "2026-11-04"
    assert parse_date("நாளை மறுநாள் வருகிறேன்", base_date=today) == "2026-11-06"

    # Relative Tanglish
    assert parse_date("naalaikku appointment venum", base_date=today) == "2026-11-05"
    assert parse_date("tomorrow morning", base_date=today) == "2026-11-05"
    assert parse_date("naala marunaal checkin", base_date=today) == "2026-11-06"

    # Explicit dates
    assert parse_date("2026-11-08") == "2026-11-08"
    assert parse_date("15/11/2026") == "2026-11-15"
    assert parse_date("10th November", base_date=today) == "2026-11-10"


def test_time_parser():
    # Spoken mani/manikku
    assert parse_time("5 manikku") == "05:00 PM"
    assert parse_time("10 manikku") == "10:00 AM"
    assert parse_time("காலை 10 மணிக்கு") == "10:00 AM"
    assert parse_time("மாலை 6:30 மணிக்கு") == "06:30 PM"

    # Standard explicit
    assert parse_time("10:30 AM") == "10:30 AM"
    assert parse_time("5 pm") == "05:00 PM"

    # Broad windows
    assert parse_time("kaalai neram") == "Morning (09:00 AM - 01:00 PM)"
    assert parse_time("மதியம் வாங்க") == "Afternoon (02:00 PM - 05:00 PM)"


def test_name_parser():
    assert parse_name("En peyar Saravanan") == "Saravanan"
    assert parse_name("என் பெயர் க. மீனாட்சி") == "க. மீனாட்சி"
    assert parse_name("My name is John Doe") == "John Doe"
    assert parse_name("Rajesh Kumar") == "Rajesh Kumar"


def test_option_matcher():
    # Hotel rooms
    options = [
        "Standard AC Room (ஏசி அறை)",
        "Deluxe Double AC (டீலக்ஸ் ஏசி)",
        "Family Suite 4-Bed (குடும்ப அறை)",
        "Standard Non-AC (ஏசி இல்லாத அறை)"
    ]
    assert match_option("deluxe ac venum", options) == "Deluxe Double AC (டீலக்ஸ் ஏசி)"
    assert match_option("குடும்ப அறை வேண்டும்", options) == "Family Suite 4-Bed (குடும்ப அறை)"
    assert match_option("non-ac", options) == "Standard Non-AC (ஏசி இல்லாத அறை)"

