"""
Automated unit and integration tests for Universal Voice Agent Phone Number Recognition
and Confirmation Workflow in Vaayil AI.
"""

import pytest
from app.conversation.parsers.phone_parser import (
    parse_phone,
    analyze_phone,
    format_phone_for_speech,
    apply_phone_correction,
    mask_phone,
    validate_indian_mobile,
)
from app.conversation.engine import ConversationEngine
from app.sectors.registry import get_sector_package


class TestSpokenPhoneParser:
    """Tests accuracy of phone parser across English, Tamil, Tanglish, and mixed inputs."""

    def test_english_spoken_numbers_with_multipliers(self):
        # Case 1: "double zero"
        assert parse_phone("Nine three four five double zero double zero two five") == "9345000025"
        # Case 2: "zero zero zero zero"
        assert parse_phone("Nine three four five zero zero zero zero two five") == "9345000025"
        # Case 3: "double oh double oh"
        assert parse_phone("Nine three four five double oh double oh two five") == "9345000025"
        # Case 4: "triple zero"
        assert parse_phone("nine eight four triple zero one two three four") == "9840001234"

    def test_spaced_digits(self):
        assert parse_phone("9 3 4 5 0 0 0 0 2 5") == "9345000025"
        assert parse_phone("98401 23456") == "9840123456"
        assert parse_phone("9 8 4 0 1 2 3 4 5 6") == "9840123456"

    def test_tamil_script_numbers(self):
        # Pure formal Tamil script digits
        spoken_tamil = "ஒன்பது மூன்று நான்கு ஐந்து பூஜ்ஜியம் பூஜ்ஜியம் பூஜ்ஜியம் பூஜ்ஜியம் இரண்டு ஐந்து"
        assert parse_phone(spoken_tamil) == "9345000025"

        # Colloquial Tamil with "டபுள் ஜீரோ"
        colloquial_tamil = "ஒன்பது மூணு நாலு அஞ்சு டபுள் ஜீரோ டபுள் ஜீரோ ரெண்டு அஞ்சு"
        assert parse_phone(colloquial_tamil) == "9345000025"

        # Tamil with சுழியம்
        tamil_suzhiyam = "ஒன்பது எட்டு நான்கு சுழியம் ஒன்று இரண்டு மூன்று நான்கு ஐந்து ஆறு"
        assert parse_phone(tamil_suzhiyam) == "9840123456"

    def test_tanglish_spoken_numbers(self):
        tanglish_num = "onbadhu moonu naalu anju double zero double zero rendu anju"
        assert parse_phone(tanglish_num) == "9345000025"

    def test_country_code_and_trunk_prefixes(self):
        assert parse_phone("+91 9345000025") == "9345000025"
        assert parse_phone("919345000025") == "9345000025"
        assert parse_phone("0091 9345000025") == "9345000025"
        assert parse_phone("00919345000025") == "9345000025"
        assert parse_phone("09345000025") == "9345000025"

    def test_grouped_and_compound_numbers(self):
        # English grouped numbers (forty-five, twenty-five)
        assert parse_phone("Nine three forty-five double zero double zero two five") == "9345000025"
        assert parse_phone("Nine three forty five double zero double zero twenty five") == "9345000025"
        assert parse_phone("93 45 double zero double zero 2 5") == "9345000025"

        # Tamil grouped numbers
        tamil_grouped = "ஒன்பது மூன்று நாற்பத்தைந்து டபுள் ஜீரோ டபுள் ஜீரோ இருபத்தைந்து"
        assert parse_phone(tamil_grouped) == "9345000025"

        # Tanglish grouped numbers
        tanglish_grouped = "Onbadhu moonu naappaththu anju double zero double zero iruvathi anju"
        assert parse_phone(tanglish_grouped) == "9345000025"

    def test_embedded_in_sentence(self):
        assert parse_phone("my mobile is 9345000025 please call me") == "9345000025"
        assert parse_phone("enga phone number ஒன்பது மூணு நாலு அஞ்சு டபுள் ஜீரோ டபுள் ஜீரோ ரெண்டு அஞ்சு") == "9345000025"

    def test_reject_invalid_numbers(self):
        # Non-phone utterances must NOT become phone numbers
        assert parse_phone("I want 2 rooms for 3 days") is None
        assert parse_phone("rendu per varom") is None
        assert parse_phone("tomorrow 10 AM") is None

        # Too short (< 10 digits)
        assert parse_phone("934500002") is None
        assert parse_phone("12345") is None

        # Invalid starting digit (< 6 for Indian mobiles)
        assert parse_phone("5345000025") is None
        assert parse_phone("1234567890") is None


class TestSingleDigitCorrection:
    """Tests single-digit corrections during confirmation."""

    def test_last_digit_correction_english(self):
        curr = "9345000025"
        assert apply_phone_correction(curr, "No, the last digit is six") == "9345000026"
        assert apply_phone_correction(curr, "last number 8") == "9345000028"
        assert apply_phone_correction(curr, "ending with 0") == "9345000020"

    def test_last_digit_correction_tamil(self):
        curr = "9345000025"
        assert apply_phone_correction(curr, "கடைசி எண் ஆறு") == "9345000026"
        assert apply_phone_correction(curr, "kadaisi number 8") == "9345000028"

    def test_first_digit_correction(self):
        curr = "9345000025"
        assert apply_phone_correction(curr, "first digit is 8") == "8345000025"
        assert apply_phone_correction(curr, "முதல் எண் எட்டு") == "8345000025"

    def test_ordinal_and_positional_corrections(self):
        curr = "9345000025"
        # Second digit correction
        assert apply_phone_correction(curr, "second digit is 4") == "9445000025"
        # Last two digits correction
        assert apply_phone_correction(curr, "ending with 26") == "9345000026"
        assert apply_phone_correction(curr, "ending with 45") == "9345000045"


class TestPhoneAnalysisDiagnostics:
    """Tests the structured diagnostic categorization and multilingual error messages."""

    def test_valid_analysis(self):
        a = analyze_phone("Nine three four five double zero double zero two five")
        assert a.is_valid is True
        assert a.phone == "9345000025"
        assert a.digit_count == 10
        assert a.status == "valid"

    def test_incomplete_numbers_gives_helpful_diagnostic(self):
        # 8 digits spoken
        a = analyze_phone("9 3 4 5 0 0 0 0")
        assert a.is_valid is False
        assert a.phone is None
        assert a.digit_count == 8
        assert a.status == "incomplete"
        assert "8 digits" in a.message_en
        assert "8 இலக்கங்கள்" in a.message_ta
        assert "8 digits" in a.message_tanglish

    def test_too_long_numbers_gives_helpful_diagnostic(self):
        # 12 digits without country prefix
        a = analyze_phone("934500002512")
        assert a.is_valid is False
        assert a.status == "too_long"
        assert a.digit_count == 12

    def test_invalid_prefix_gives_helpful_diagnostic(self):
        # Starts with 3
        a = analyze_phone("3345000025")
        assert a.is_valid is False
        assert a.status == "invalid_prefix"
        assert "6, 7, 8, or 9" in a.message_en
        assert "6, 7, 8 அல்லது 9" in a.message_ta

    def test_noise_or_unrelated_utterance(self):
        a = analyze_phone("hello good morning booking please")
        assert a.is_valid is False
        assert a.status == "no_digits"


class TestSpeechFormattingAndPrivacy:
    """Tests digit formatting for TTS and privacy masking for diagnostic logs."""

    def test_privacy_masking(self):
        assert mask_phone("9345000025") == "93******25"
        assert mask_phone("+91 9345000025") == "93******25"
        assert mask_phone("") == ""

    def test_speech_formatting_tamil(self):
        spoken = format_phone_for_speech("9345000025", "ta")
        assert "ஒன்பது" in spoken
        assert "பூஜ்ஜியம்" in spoken
        assert ", " in spoken

    def test_speech_formatting_english(self):
        spoken = format_phone_for_speech("9345000025", "en")
        assert "nine" in spoken
        assert "zero" in spoken
        assert ", " in spoken

    def test_speech_formatting_tanglish(self):
        spoken = format_phone_for_speech("9345000025", "tanglish")
        assert spoken == "9, 3, 4, 5, 0, 0, 0, 0, 2, 5"


class TestConversationEnginePhoneWorkflow:
    """Tests the interactive confirmation state machine in ConversationEngine."""

    @pytest.fixture
    def clinic_engine(self):
        pkg = get_sector_package("clinic")
        return ConversationEngine(package=pkg, language_mode="en")

    def test_phone_readback_and_confirmation_flow(self, clinic_engine):
        session_id = "test_phone_sess_1"
        slots = {"patient_name": "Saran"}

        # Step 1: Agent asks for phone
        # Caller speaks phone with 'double zero'
        r1 = clinic_engine.process_turn(
            session_id=session_id,
            user_transcript="Nine three four five double zero double zero two five",
            current_slots=slots,
            current_state="collecting",
            current_slot="phone",
        )

        assert r1.state == "confirming_phone"
        assert r1.slots["_pending_phone"] == "9345000025"
        assert "phone" not in r1.slots  # Must NOT be saved to confirmed slots yet
        assert "nine, three, four, five, zero, zero, zero, zero, two, five" in r1.agent_message.lower()
        assert "correct" in r1.agent_message.lower()

        # Step 2: Caller confirms with 'Yes'
        r2 = clinic_engine.process_turn(
            session_id=session_id,
            user_transcript="Yes that is correct",
            current_slots=r1.slots,
            current_state=r1.state,
            current_slot=r1.next_slot,
        )

        # Phone is now explicitly confirmed and saved!
        assert r2.slots["phone"] == "9345000025"
        assert "_pending_phone" not in r2.slots
        assert "confirmed" in r2.agent_message.lower()
        assert r2.state == "collecting"
        assert r2.next_slot != "phone"

    def test_phone_rejection_flow(self, clinic_engine):
        session_id = "test_phone_sess_2"
        slots = {"patient_name": "Saran"}

        # Step 1: Spoken number triggers readback
        r1 = clinic_engine.process_turn(
            session_id=session_id,
            user_transcript="9345000025",
            current_slots=slots,
            current_state="collecting",
            current_slot="phone",
        )
        assert r1.state == "confirming_phone"

        # Step 2: Caller rejects with 'No'
        r2 = clinic_engine.process_turn(
            session_id=session_id,
            user_transcript="No wrong number",
            current_slots=r1.slots,
            current_state=r1.state,
            current_slot=r1.next_slot,
        )

        assert r2.state == "collecting"
        assert r2.next_slot == "phone"
        assert "_pending_phone" not in r2.slots
        assert "phone" not in r2.slots
        assert "digit at a time" in r2.agent_message.lower()

    def test_phone_digit_correction_flow(self, clinic_engine):
        session_id = "test_phone_sess_3"
        slots = {"patient_name": "Saran"}

        # Step 1: Spoken number triggers readback
        r1 = clinic_engine.process_turn(
            session_id=session_id,
            user_transcript="9345000025",
            current_slots=slots,
            current_state="collecting",
            current_slot="phone",
        )
        assert r1.slots["_pending_phone"] == "9345000025"

        # Step 2: Caller says "last digit is 6"
        r2 = clinic_engine.process_turn(
            session_id=session_id,
            user_transcript="No, the last digit is six",
            current_slots=r1.slots,
            current_state=r1.state,
            current_slot=r1.next_slot,
        )

        assert r2.state == "confirming_phone"
        assert r2.slots["_pending_phone"] == "9345000026"
        assert "9345000026" in r2.agent_message or "six" in r2.agent_message.lower()

        # Step 3: Caller confirms the corrected number
        r3 = clinic_engine.process_turn(
            session_id=session_id,
            user_transcript="Yes, now it is correct",
            current_slots=r2.slots,
            current_state=r2.state,
            current_slot=r2.next_slot,
        )

        assert r3.slots["phone"] == "9345000026"
        assert "_pending_phone" not in r3.slots
