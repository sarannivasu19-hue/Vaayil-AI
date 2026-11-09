"""
Deterministic Slot-Filling Conversation Engine (State Machine).

Takes user transcripts, extracts slots using the dedicated Tamil/Tanglish/English parsers,
handles corrections ('illa, 6 manikku'), confirms unclear values, asks for missing slots
one at a time, and produces a final summary for user confirmation without auto-saving.
"""

import json
import re
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel

from app.sectors.base import SectorPackage, SlotDefinition
from app.conversation.parsers import (
    parse_number,
    parse_phone,
    analyze_phone,
    mask_phone,
    format_phone_for_speech,
    apply_phone_correction,
    validate_indian_mobile,
    parse_date,
    parse_time,
    parse_name,
    clean_free_text,
    match_option,
)


class EngineTurnResult(BaseModel):
    session_id: str
    state: str  # 'collecting', 'confirming', 'completed'
    slots: Dict[str, Any]
    next_slot: Optional[str] = None
    agent_message: str
    is_complete: bool
    summary: Optional[Dict[str, Any]] = None


# Correction trigger words in Tamil/Tanglish/English
CORRECTION_TRIGGERS = [
    "illa", "illai", "ille", "no", "not", "wrong", "change", "thappu", "மாற்றி", "இல்லை", "இல்ல"
]


class ConversationEngine:
    """
    Modular state machine engine operating strictly from a SectorPackage configuration.
    """

    def __init__(self, package: SectorPackage, language_mode: str = "tanglish"):
        self.package = package
        # Support language modes: 'ta' (or 'tamil'), 'tanglish', 'en' (or 'english')
        lang = language_mode.lower()
        if "tam" in lang or lang == "ta":
            self.language = "ta"
        elif "eng" in lang or lang == "en":
            self.language = "en"
        else:
            self.language = "tanglish"

    def get_prompt_for_slot(self, slot_def: SlotDefinition) -> str:
        """Returns the question text tailored to the selected language mode."""
        if self.language == "ta":
            return slot_def.prompts.ta
        elif self.language == "en":
            return slot_def.prompts.en
        return slot_def.prompts.tanglish

    def find_slot_def(self, slot_name: str) -> Optional[SlotDefinition]:
        for s in self.package.slots:
            if s.name == slot_name:
                return s
        return None

    def extract_slots_from_text(
        self,
        text: str,
        current_slots: Dict[str, Any],
        target_slot_name: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], List[str]]:
        """
        Parses text and extracts any slots present in the utterance.
        If a target_slot_name is being asked, prioritizes filling that slot.
        Returns (updated_slots, newly_filled_slot_names).
        """
        updated = dict(current_slots)
        newly_filled = []
        cleaned_text = text.strip()

        # Check for user correction keyword (e.g. "illa, 6 manikku" or "no, tomorrow")
        is_correction = any(
            re.search(rf"\b{re.escape(w)}\b" if w.isascii() else re.escape(w), cleaned_text.lower())
            for w in CORRECTION_TRIGGERS
        )

        # 1. First, try filling the active/target slot specifically
        if target_slot_name:
            target_def = self.find_slot_def(target_slot_name)
            if target_def:
                val = self._extract_value_for_slot(target_def, cleaned_text, is_targeted=True)
                if val is not None:
                    updated[target_slot_name] = val
                    newly_filled.append(target_slot_name)

        # 2. Opportunistic scan: Extract any other slots mentioned in the sentence
        for slot_def in self.package.slots:
            # If already filled and not in correction mode, skip
            if slot_def.name in updated and not is_correction:
                continue
            if slot_def.name in newly_filled:
                continue
            # Do NOT opportunistically extract phone numbers unless phone was the target slot
            # or the user explicitly mentioned phone/mobile keywords
            if slot_def.type == "phone":
                lower_text = cleaned_text.lower()
                has_phone_keyword = any(k in lower_text for k in ["phone", "mobile", "number", "நம்பர்", "எண்", "அலைபேசி"])
                if not has_phone_keyword and target_slot_name != "phone":
                    continue

            val = self._extract_value_for_slot(slot_def, cleaned_text, is_targeted=False)
            if val is not None:
                updated[slot_def.name] = val
                newly_filled.append(slot_def.name)

        return updated, newly_filled

    def _extract_value_for_slot(self, slot_def: SlotDefinition, text: str, is_targeted: bool = False) -> Optional[Any]:
        stype = slot_def.type

        if stype == "phone":
            return parse_phone(text)

        elif stype == "number":
            return parse_number(text)

        elif stype == "date":
            # Avoid parsing as date if the utterance is explicitly answering time or phone
            return parse_date(text)

        elif stype == "time":
            return parse_time(text)

        elif stype == "select":
            if slot_def.options:
                return match_option(text, slot_def.options)
            return None

        elif stype == "text":
            # For names (e.g. citizen_name, patient_name, guest_name)
            if "name" in slot_def.name:
                return parse_name(text)
            # Other generic text fields (ward, notes, reason) should ONLY be filled
            # when explicitly targeted (asked) or if clearly containing ward/locality keywords
            if "ward" in slot_def.name or "village" in slot_def.name:
                lower = text.lower()
                if any(k in lower for k in ["ward", "வார்டு", "gramam", "கிராமம்", "street", "தெரு", "nagar", "நகர்"]):
                    return clean_free_text(text)
            return None

        return None

    def get_missing_required_slots(self, current_slots: Dict[str, Any]) -> List[SlotDefinition]:
        """Returns list of required slot definitions that have not been filled yet."""
        missing = []
        for s in self.package.slots:
            if s.required and (s.name not in current_slots or current_slots[s.name] is None):
                missing.append(s)
        return missing

    def build_confirmation_summary_message(self, slots: Dict[str, Any]) -> str:
        """Constructs confirmation summary in the chosen language."""
        lines = []
        for s in self.package.slots:
            val = slots.get(s.name)
            if val and not str(s.name).startswith("_"):
                label = s.label_ta if self.language == "ta" else s.label_en
                lines.append(f"{label}: {val}")

        details_str = ", ".join(lines)

        if self.language == "ta":
            return f"உங்கள் விவரங்கள் அனைத்தும் பெறப்பட்டன: [{details_str}]. இந்த முன்பதிவை உறுதி செய்யலாமா?"
        elif self.language == "en":
            return f"All required details received: [{details_str}]. Would you like to confirm this booking?"
        else:
            return f"Unga details ellam note panniyachu: [{details_str}]. Indha booking confirm pannalama?"

    def process_turn(
        self,
        session_id: str,
        user_transcript: str,
        current_slots: Dict[str, Any],
        current_state: str,
        current_slot: Optional[str] = None,
    ) -> EngineTurnResult:
        """
        Processes a single conversational turn deterministically.
        Supports dedicated phone confirmation state with digit-by-digit spoken readout.
        """
        lower_turn = user_transcript.strip().lower()

        # -------------------------------------------------------------
        # 1. STATE: CONFIRMING PHONE NUMBER
        # -------------------------------------------------------------
        if current_state == "confirming_phone":
            pending_phone = current_slots.get("_pending_phone")
            affirmatives = [
                "yes", "confirm", "seri", "aama", "aamam", "sure", "ok", "okay",
                "correct", "right", "சரி", "ஆம்", "உறுதி", "கரெக்ட்", "ஆமாம்", "ஆமா"
            ]
            negatives = [
                "no", "illa", "thappu", "wrong", "change", "மாற்று", "இல்லை", "தவறு", "இல்ல"
            ]

            # 1a. Did customer speak a complete new 10-digit number?
            new_phone = parse_phone(user_transcript)
            if new_phone and new_phone != pending_phone:
                updated_slots = dict(current_slots)
                updated_slots["_pending_phone"] = new_phone
                spoken = format_phone_for_speech(new_phone, self.language)
                msg = (
                    f"உங்கள் புதிய மொபைல் எண் {spoken}. சரிதானா?"
                    if self.language == "ta"
                    else f"I understood your updated number as {spoken}. Is that correct?"
                    if self.language == "en"
                    else f"Unga updated mobile number {spoken}. Idhu sariya?"
                )
                return EngineTurnResult(
                    session_id=session_id,
                    state="confirming_phone",
                    slots=updated_slots,
                    next_slot="phone",
                    agent_message=msg,
                    is_complete=False,
                )

            # 1b. Did customer correct specific digits? (e.g. "last digit is 6")
            if pending_phone:
                corrected_phone = apply_phone_correction(pending_phone, user_transcript)
                if corrected_phone and corrected_phone != pending_phone:
                    updated_slots = dict(current_slots)
                    updated_slots["_pending_phone"] = corrected_phone
                    spoken = format_phone_for_speech(corrected_phone, self.language)
                    msg = (
                        f"உங்கள் திருத்தப்பட்ட மொபைல் எண் {spoken}. சரிதானா?"
                        if self.language == "ta"
                        else f"I understood your corrected number as {spoken}. Is that correct?"
                        if self.language == "en"
                        else f"Unga corrected mobile number {spoken}. Idhu sariya?"
                    )
                    return EngineTurnResult(
                        session_id=session_id,
                        state="confirming_phone",
                        slots=updated_slots,
                        next_slot="phone",
                        agent_message=msg,
                        is_complete=False,
                    )

            # 1c. Explicit Customer Confirmation (Yes)
            if any(w in lower_turn for w in affirmatives):
                updated_slots = dict(current_slots)
                confirmed_num = updated_slots.pop("_pending_phone", None) or pending_phone
                if confirmed_num:
                    updated_slots["phone"] = confirmed_num

                ack = (
                    "மிக்க நன்றி! உங்கள் மொபைல் எண் உறுதி செய்யப்பட்டது. "
                    if self.language == "ta"
                    else "Thank you. Your mobile number has been confirmed. "
                    if self.language == "en"
                    else "Romba nandri! Unga mobile number confirm aagiduchu. "
                )

                # Check if other required slots remain
                missing = self.get_missing_required_slots(updated_slots)
                if not missing:
                    confirm_msg = self.build_confirmation_summary_message(updated_slots)
                    return EngineTurnResult(
                        session_id=session_id,
                        state="confirming",
                        slots=updated_slots,
                        next_slot=None,
                        agent_message=f"{ack}{confirm_msg}",
                        is_complete=False,
                        summary=updated_slots,
                    )

                next_slot_def = missing[0]
                question = self.get_prompt_for_slot(next_slot_def)
                return EngineTurnResult(
                    session_id=session_id,
                    state="collecting",
                    slots=updated_slots,
                    next_slot=next_slot_def.name,
                    agent_message=f"{ack}{question}",
                    is_complete=False,
                )

            # 1d. Explicit Customer Rejection (No)
            elif any(w in lower_turn for w in negatives):
                updated_slots = dict(current_slots)
                updated_slots.pop("_pending_phone", None)
                msg = (
                    "மன்னிக்கவும். உங்கள் மொபைல் எண்ணை ஒவ்வொரு எண்ணாக சொல்லுங்கள்."
                    if self.language == "ta"
                    else "Sorry. Please tell me your mobile number one digit at a time."
                    if self.language == "en"
                    else "Mannikkavum. Unga mobile number-a ovvoru number-a sollunga."
                )
                return EngineTurnResult(
                    session_id=session_id,
                    state="collecting",
                    slots=updated_slots,
                    next_slot="phone",
                    agent_message=msg,
                    is_complete=False,
                )

            # 1e. Ambiguous response in confirming_phone
            msg = (
                "உங்கள் மொபைல் எண் சரியானதா என்று 'ஆம்' அல்லது 'இல்லை' என்று கூறுங்கள்."
                if self.language == "ta"
                else "Please confirm if your mobile number is correct by saying 'Yes' or 'No'."
                if self.language == "en"
                else "Unga mobile number correct-a nu 'Yes' or 'No' sollunga."
            )
            return EngineTurnResult(
                session_id=session_id,
                state="confirming_phone",
                slots=current_slots,
                next_slot="phone",
                agent_message=msg,
                is_complete=False,
            )

        # -------------------------------------------------------------
        # 2. STATE: FINAL BOOKING CONFIRMATION
        # -------------------------------------------------------------
        if current_state == "confirming":
            affirmatives = ["yes", "confirm", "seri", "aama", "aamam", "sure", "ok", "சரி", "ஆம்", "உறுதி"]
            negatives = ["no", "illa", "vendaam", "cancel", "இல்லை", "வேண்டாம்", "தவறு"]

            if any(w in lower_turn for w in affirmatives):
                msg = (
                    "மிக்க நன்றி! உங்கள் முன்பதிவு விவரங்கள் தயாராக உள்ளன. கீழ் உள்ள 'Confirm & Save' பட்டனை அழுத்தவும்."
                    if self.language == "ta"
                    else "Thanks! All details are ready. Please click the 'Confirm & Save' button below to save."
                    if self.language == "en"
                    else "Romba nandri! Unga details ready. Keela irukura 'Confirm & Save' button click panni save pannikkalam."
                )
                return EngineTurnResult(
                    session_id=session_id,
                    state="completed",
                    slots=current_slots,
                    next_slot=None,
                    agent_message=msg,
                    is_complete=True,
                    summary=current_slots,
                )
            elif any(w in lower_turn for w in negatives):
                msg = (
                    "சரி, எந்த விவரத்தை மாற்ற வேண்டும் என்று சொல்லுங்கள்?"
                    if self.language == "ta"
                    else "Sure, which detail would you like to update or change?"
                    if self.language == "en"
                    else "Seri, endha detail-a mathanum nu sollunga?"
                )
                return EngineTurnResult(
                    session_id=session_id,
                    state="collecting",
                    slots=current_slots,
                    next_slot=None,
                    agent_message=msg,
                    is_complete=False,
                )

        # -------------------------------------------------------------
        # 3. STATE: COLLECTING SLOTS
        # -------------------------------------------------------------

        # Check if the active target slot being asked is phone
        if current_slot == "phone":
            analysis = analyze_phone(user_transcript)
            if analysis.is_valid and analysis.phone:
                updated_slots = dict(current_slots)
                updated_slots["_pending_phone"] = analysis.phone
                spoken = format_phone_for_speech(analysis.phone, self.language)
                msg = (
                    f"உங்கள் மொபைல் எண் {spoken}. சரிதானா?"
                    if self.language == "ta"
                    else f"I understood your number as {spoken}. Is that correct?"
                    if self.language == "en"
                    else f"Unga mobile number {spoken}. Idhu sariya?"
                )
                return EngineTurnResult(
                    session_id=session_id,
                    state="confirming_phone",
                    slots=updated_slots,
                    next_slot="phone",
                    agent_message=msg,
                    is_complete=False,
                )
            else:
                feedback = (
                    analysis.message_ta
                    if self.language == "ta"
                    else analysis.message_en
                    if self.language == "en"
                    else analysis.message_tanglish
                )
                return EngineTurnResult(
                    session_id=session_id,
                    state="collecting",
                    slots=current_slots,
                    next_slot="phone",
                    agent_message=feedback,
                    is_complete=False,
                )

        # Update slots from user transcript
        updated_slots, newly_filled = self.extract_slots_from_text(
            text=user_transcript,
            current_slots=current_slots,
            target_slot_name=current_slot,
        )

        # Check for missing required slots
        missing = self.get_missing_required_slots(updated_slots)

        if not missing:
            # All required slots filled! Move to confirmation
            confirm_msg = self.build_confirmation_summary_message(updated_slots)
            return EngineTurnResult(
                session_id=session_id,
                state="confirming",
                slots=updated_slots,
                next_slot=None,
                agent_message=confirm_msg,
                is_complete=False,
                summary=updated_slots,
            )

        # Next missing slot to ask
        next_target_slot = missing[0]
        question = self.get_prompt_for_slot(next_target_slot)

        # If user gave unclear input for target slot
        unclear_prefix = ""
        if current_slot and current_slot not in newly_filled and current_slot not in updated_slots:
            if self.language == "ta":
                unclear_prefix = "மன்னிக்கவும், அது சரியாக விளங்கவில்லை. "
            elif self.language == "en":
                unclear_prefix = "Sorry, I could not understand that clearly. "
            else:
                unclear_prefix = "Mannikkavum, puriyala. "

        return EngineTurnResult(
            session_id=session_id,
            state="collecting",
            slots=updated_slots,
            next_slot=next_target_slot.name,
            agent_message=f"{unclear_prefix}{question}",
            is_complete=False,
        )
