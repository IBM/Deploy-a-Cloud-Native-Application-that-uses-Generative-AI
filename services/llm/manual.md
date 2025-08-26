**Auto Insurance Underwriting Manual - GenAI Application v1.1**

**1. Purpose:**
This document outlines the simplified underwriting rules for the GenAI Auto Insurance Eligibility Checker. The Large Language Model (LLM) should use these rules exclusively to determine eligibility, suggest a pricing tier, list applicable discounts, and provide justification based on applicant data extracted from the form, driver's license image, and reported supplemental information.

**2. Input Data Points (Expected from Extraction / Form):**
*   **Applicant ID:** (For reference)
*   **Date of Birth (DOB):** (To calculate age)
*   **Address:** (To determine State of Residence)
*   **Driver's License Number:** (For reference)
*   **License Issuing State:** (Crucial for state rules)
*   **License Type/Class:** (e.g., Full/Operator, Learner's Permit, Junior License)
*   **License Issue Date:** (To infer experience)
*   **License Expiry Date:** (To check validity)
*   **Traffic Violations:** (Type, Date)
*   **Credit Score Range:** (Excellent (750+), Good (680-749), Fair (600-679), Poor (<600))
*   **Existing Homeowner's Policy with Company:** (Yes/No)
*   **Existing Life Insurance Policy with Company:** (Yes/No)

**3. General Eligibility Rules (Apply First):**
*   **GE-01: Minimum Age:** Applicant must be at least 16 years old. (Decline if younger).
*   **GE-02: Valid License:** License must not be expired. (Decline if expired).
*   **GE-03: Operating States:** Applicant's **License Issuing State** must be one of the following: California (CA), New York (NY), Texas (TX), Florida (FL). (Decline if other state).
*   **GE-04: Prohibited License Types:** Commercial Driver's Licenses (CDL) are not eligible for *this specific personal auto policy* product. (Decline if License Type is CDL).
*   **GE-05: Minimum Credit Standing:** Applicants with a reported **Credit Score Range** of 'Poor' (<600) are generally ineligible. (Decline, unless overridden by specific state allowance - *none currently specified*).
*   **GE-06: Form Must Match License:**  
    The applicant’s form inputs (referred to as `userData`) must match the information extracted from the uploaded license (referred to as `licenseData`).  
    - **Crosscheck** the following fields: First Name, Last Name, Date of Birth, Address (Street, City, State, ZIP), and License Number.
    - If any of these fields do **not match** between `userData` and `licenseData`, the application must be **Declined**.
    - In your justification, clearly state which fields did not match and reference this rule (**GE-06**).

**4. State-Specific Rules:** *(No changes from v1.0 here, but state rules take precedence)*

*   **ST-CA (California):**
    *   **ST-CA-01:** Learner's Permits are eligible but automatically placed in the 'High-Risk' tier (subject to Credit Score adjustment - see CS rules).
    *   **ST-CA-02:** Lookback period for *Minor* traffic violations is 3 years.
    *   **ST-CA-03:** Lookback period for *Major* traffic violations is 7 years.
    *   **ST-CA-04:** Any Major violation within the lookback period results in a Decline.
    *   **ST-CA-05:** *Note:* California regulations limit the use of credit score for rating; however, for this *sample*, we will apply the general credit rules (CS-XX) cautiously, potentially with less impact than other states.

*   **ST-NY (New York):**
    *   **ST-NY-01:** Learner's Permits are **not eligible** for a standalone policy. (Decline).
    *   **ST-NY-02:** Lookback period for all traffic violations (Minor and Major) is 4 years.
    *   **ST-NY-03:** One Major violation within the lookback period places the applicant in the 'High-Risk' tier with a significant surcharge. Two or more Major violations result in a Decline.
    *   **ST-NY-04:** Specific focus on speeding: 3 or more minor speeding violations within the lookback period move the applicant to the 'High-Risk' tier.

*   **ST-TX (Texas):**
    *   **ST-TX-01:** Learner's Permits are eligible but require a specific 'Permit Holder Surcharge' and are initially placed in the 'Standard' or 'High-Risk' tier (subject to Credit Score adjustment - see CS rules).
    *   **ST-TX-02:** Lookback period for *Minor* traffic violations is 3 years.
    *   **ST-TX-03:** Lookback period for *Major* traffic violations is 5 years.
    *   **ST-TX-04:** One Major violation within the lookback period places the applicant in the 'High-Risk' tier. Two or more Major violations result in a Decline.

*   **ST-FL (Florida):**
    *   **ST-FL-01:** Learner's Permits are eligible but automatically placed in the 'High-Risk' tier (subject to Credit Score adjustment - see CS rules).
    *   **ST-FL-02:** Lookback period for all traffic violations (Minor and Major) is 5 years.
    *   **ST-FL-03:** Any Major violation within the lookback period results in a Decline.
    *   **ST-FL-04:** Accumulation of 4 or more Minor violations within the lookback period results in a Decline.

**5. License Type Rules (Apply after State Rules):** *(No changes from v1.0)*

*   **LT-LP (Learner's Permit/Junior License):**
    *   **LT-LP-01:** Eligibility is determined by State-Specific Rules (See ST-XX).
    *   **LT-LP-02:** If eligible, applicant is generally considered higher risk due to lack of experience. Initial pricing tier placement is typically 'Standard' (TX only, if clean record) or 'High-Risk'. Apply relevant state surcharges/tier rules. Final tier subject to Credit Score adjustment (CS-XX).
    *   **LT-LP-03:** Driving experience calculated from issue date is minimal; prioritize Permit status in risk assessment.

*   **LT-FL (Full License/Operator License):**
    *   **LT-FL-01:** Base eligibility, proceed with violation checks, experience, and credit assessment.
    *   **LT-FL-02:** Calculate driving experience: `Current Date - License Issue Date`. (Use years rounded down).
        *   0-2 years: Newer driver, slight risk increase (may prevent 'Preferred' tier unless other factors are excellent).
        *   3-5 years: Moderately experienced.
        *   6+ years: Experienced.

**6. Traffic Violation Rules (Use State Lookback Period):** *(No changes from v1.0 definitions, but impact may be moderated by Credit Score)*

*   **TV-DEF: Definitions:**
    *   **Major Violations:** DUI/DWI, Reckless Driving, Hit-and-Run, Driving with Suspended License, Speeding >30mph over limit, Racing.
    *   **Minor Violations:** Speeding (<30mph over limit), Failure to Stop (sign/light), Improper Turn, Seatbelt violation, Minor At-Fault Accident (property damage only).

*   **TV-MJR (Major Violations within Lookback):**
    *   **TV-MJR-01:** Refer to State-Specific rules for consequences (ST-XX). Consequences range from High-Risk placement to Decline. Credit score typically does not override a Major violation consequence.

*   **TV-MNR (Minor Violations within Lookback):**
    *   **TV-MNR-01:** **0 Minor Violations:** No negative impact. Contributes positively towards 'Preferred' tier if other factors align.
    *   **TV-MNR-02:** **1-2 Minor Violations:** Initial placement likely 'Standard' tier. May achieve 'Preferred' only with Excellent Credit AND significant experience (6+ yrs). May fall to 'High-Risk' if combined with Fair Credit or Learner's Permit.
    *   **TV-MNR-03:** **3 Minor Violations:** Initial placement likely 'High-Risk' tier (or 'Standard' in lenient scenarios). May remain 'Standard' only with Excellent Credit AND significant experience. Subject to state rules (e.g., ST-NY-04).
    *   **TV-MNR-04:** **4+ Minor Violations:** Likely places applicant in 'High-Risk' tier or results in Decline (See ST-FL-04). Credit score unlikely to prevent High-Risk placement if eligible.

**7. Credit Score Rules (Apply as a Modifier to Tiering):**

*   **CS-DEF: Definitions:**
    *   **Excellent:** 750+
    *   **Good:** 680-749
    *   **Fair:** 600-679
    *   **Poor:** <600 (Refer to GE-05 for eligibility)

*   **CS-EX (Excellent Credit):**
    *   **CS-EX-01:** Can improve the pricing tier by one level (e.g., from 'Standard' to 'Preferred', or from 'High-Risk' to 'Standard'), provided no Major violations exist and Minor violations are within acceptable limits (e.g., max 1-2 for Preferred, max 3 for Standard).
    *   **CS-EX-02:** May qualify for a small premium *reduction* within the assigned tier.
    *   **CS-EX-03:** Cannot override a Decline decision based on other fundamental rules (GE, ST, TV-MJR).

*   **CS-GD (Good Credit):**
    *   **CS-GD-01:** Generally neutral impact. The tier determined by license, experience, and violations is likely the final tier.
    *   **CS-GD-02:** Base premium for the assigned tier.

*   **CS-FR (Fair Credit):**
    *   **CS-FR-01:** Can worsen the pricing tier by one level (e.g., from 'Standard' to 'High-Risk', or prevent reaching 'Preferred').
    *   **CS-FR-02:** May result in a small premium *surcharge* within the assigned tier.
    *   **CS-FR-03:** If combined with other borderline factors (e.g., 2-3 minor violations, low experience), strongly suggests 'High-Risk' tier.

*   **CS-PR (Poor Credit):**
    *   **CS-PR-01:** Refer to rule **GE-05**. Typically results in Decline. (This rule primarily covers the decline aspect).

**8. Discount Rules (Apply AFTER Final Tier is Determined):**

*   **DI-HO (Homeowner's Bundle):**
    *   **DI-HO-01:** If `Existing Homeowner's Policy with Company` = Yes, applicant qualifies for the "Homeowner's Bundle Discount".

*   **DI-LI (Life Insurance Bundle):**
    *   **DI-LI-01:** If `Existing Life Insurance Policy with Company` = Yes, applicant qualifies for the "Life Insurance Bundle Discount".

*   **DI-MP (Multi-Policy):**
    *   **DI-MP-01:** If *both* DI-HO-01 and DI-LI-01 apply, applicant qualifies for the "Multi-Policy Discount" (this typically replaces the individual HO and LI discounts and is slightly larger).

**9. Pricing Tiers and Decision Logic:**

*   **Tier Definitions:**
    *   **Preferred:** Lowest rates. Typically requires Full License, 3+ years experience, 0 Major violations, 0-1 Minor violations, AND Good or Excellent Credit.
    *   **Standard:** Base rates. May include Full License drivers with moderate experience, 1-3 Minor violations, OR Excellent/Good credit offsetting minor negative factors. Eligible TX Permit holders might land here depending on credit.
    *   **High-Risk:** Higher rates + surcharges. Includes drivers with Learner's Permits (most states), multiple Minor violations (3+), a single Major violation (where permitted), Fair credit, or combinations thereof.
    *   **Decline:** Ineligible for coverage based on rules (e.g., GE rules, state-specific declines like ST-NY-01 or ST-CA-04, multiple Major violations).

*   **Decision Process for LLM:**
    1.  Verify Input Data completeness.
    2.  Check General Eligibility Rules (GE-01 to GE-05). If any fail, decision is **Decline** with justification referencing the specific GE rule(s).
    3.  Identify License Issuing State. Apply relevant State-Specific Rules (ST-XX). Check for state-based Declines or tier implications. Note any state nuances (e.g., ST-CA-05).
    4.  Identify License Type. Apply License Type Rules (LT-LP, LT-FL), considering state allowances. Note initial tier implications (e.g., LT-LP-02).
    5.  Analyze Traffic Violations within the state-specific lookback period (TV-MJR, TV-MNR). Note tier implications based on count/severity. Check for violation-based Declines.
    6.  Determine **Preliminary Tier** based on synthesis of steps 3-5 (License, Experience, Violations, State factors).
    7.  Apply Credit Score Rules (CS-EX, CS-GD, CS-FR) to potentially adjust the Preliminary Tier to the **Final Tier**. Check CS-PR / GE-05 again if score is Poor.
    8.  Synthesize all findings for Final Decision:
        *   If any rule resulted in a Decline, the final decision is **Decline**. Justify using all applicable decline rules (e.g., GE-05, ST-NY-01, TV-MJR state rule).
        *   If eligible, confirm the **Final Pricing Tier** ('Preferred', 'Standard', 'High-Risk').
    9.  Check Discount Rules (DI-HO, DI-LI, DI-MP) based on input flags. List all applicable discounts.
    10. Formulate the **Output:**
        *   **Eligibility:** Offer / Decline
        *   **Pricing Tier:** Preferred / Standard / High-Risk (If Offer)
        *   **Applicable Discounts:** [List Discounts, e.g., "Homeowner's Bundle Discount", "Multi-Policy Discount", or "None"] (If Offer)
        *   **Justification:** Clearly state the key factors and rules from this manual that led to the decision and tier placement. Mention license type, experience, violations, state, credit score impact, and the basis for any declines. (e.g., "Offer - Standard Tier. Discounts: Homeowner's Bundle Discount. Justification: Applicant has Full License [LT-FL-01] in TX [ST-TX] with 4 years experience [LT-FL-02], 1 Minor violation [TV-MNR-02]. Good Credit [CS-GD-01] maintains Standard tier. Qualifies for Home discount [DI-HO-01]."; or "Decline. Justification: Applicant reported Poor Credit Score (<600) [GE-05].")

**10. Important Disclaimers:**
*   This is a highly simplified model for a GenAI demonstration.
*   Actual underwriting involves many more factors (vehicle type, garaging location, coverage limits, detailed MVR reports, claims history, precise credit score impact models, specific discount percentages, etc.).
*   Input data (violations, credit range, policy ownership) is assumed accurate; real systems require verification.
*   Pricing tiers are indicative; actual premiums involve complex rating algorithms and specific surcharge/discount values.
*   The LLM must strictly adhere to *these rules* and not infer external knowledge or real-world insurance practices beyond what is documented here. State rules on credit usage may vary significantly in reality (e.g., CA).
