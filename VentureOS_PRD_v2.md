**VENTURE OS**

Product Requirements Document v2.0

*Corporate Venture Studio Intelligence Platform --- Updated
Specification*

  ------------------ ----------------------------------------------------
  **Version**        2.0 --- Updated with stakeholder feedback

  **Date**           March 2026

  **Status**         Final --- Ready to Build

  **Primary Users**  Founder · Venture Lead

  **Key Changes v2** User permissions revised · Stage outputs updated ·
                     Idea Intake renamed + redesigned · Scoring UI
                     restructured · Naming conventions clarified · New
                     stage-specific outputs added · Pricing Lab
                     introduced · Feedback loop formalised
  ------------------ ----------------------------------------------------

**1. Product Overview**

  -----------------------------------------------------------------------
  *Venture OS is an AI-powered venture building platform serving two
  primary users --- Founders and Venture Leads --- through a shared
  system that captures, evaluates, and advances venture concepts through
  a structured 7-stage studio methodology. The AI layer (Claude Sonnet
  via Anthropic API) acts as an intelligent collaborator throughout:
  challenging assumptions, synthesising evidence, and learning from human
  feedback to improve over time.*

  -----------------------------------------------------------------------

**1.1 Core Design Principles**

-   One venture record accumulates structured, source-tagged data over
    time --- all features read from and write to it

-   Every claim is traceable: source tags identify whether information
    came from a founder, VL, AI synthesis, external research, or a
    client interview

-   Both Founder and Venture Lead can provide feedback on any AI output,
    creating a compounding improvement loop

-   When Claude performs external research, the specific source
    (article, report, URL, date) is stored and surfaced to both users as
    a clickable citation

-   Outputs (Business Brief, Investment Memo, Pitch Deck) are generated
    from the accumulated venture record --- not created in isolation

**1.2 Document Naming --- Definitive Reference**

  -----------------------------------------------------------------------
  v2 Update: Naming clarified based on stakeholder feedback. Use these
  names consistently in all UI labels, buttons, and generated documents.

  -----------------------------------------------------------------------

  --------------------------------------------------------------------------------------
  **Document    **Stage      **Format**   **Audience**    **Length**   **Description**
  Name**        Unlocked**                                             
  ------------- ------------ ------------ --------------- ------------ -----------------
  Business      Stage 02 --- Word (.docx) Early           Max 5 pages  First output from
  Brief         Define                    stakeholders,                Idea Intake.
                                          founder                      Early-stage
                                                                       articulation of
                                                                       the opportunity.
                                                                       Can be generated
                                                                       during or after
                                                                       the intake
                                                                       session.

  Investment    Stage 03 --- Word (.docx) Senior leaders, 10--20 pages Full incubation
  Memo          Incubate                  Investment                   document.
                                          Committee                    Everything a
                                                                       senior leader
                                                                       needs to know
                                                                       about the venture
                                                                       before a capital
                                                                       decision.

  Pitch Deck    Stage 03 --- PowerPoint   Investment      12 slides    Visual narrative
                Incubate     (.pptx)      Committee /                  for the
                (end)                     Partners                     investment ask.
                                                                       Generated at the
                                                                       end of the
                                                                       Incubate phase.
  --------------------------------------------------------------------------------------

**2. Primary Users & Permissions**

**2.1 The Founder**

The Founder is the primary input provider and idea owner. They
participate in every conversational feature, can view all evaluations
generated about their venture, download all output documents, and
actively contribute feedback that improves the AI\'s outputs over time.

  ------------------------------------------------------------------------
  **Feature**         **Founder       **Notes**
                      Access**        
  ------------------- --------------- ------------------------------------
  Portfolio Dashboard No access       Founders have no dashboard view ---
                                      they access only their own venture

  Idea Intake         Full access --- Voice + text input; real-time
  (Founder Interview) primary         progress dashboard; all chat history
                      participant     saved

  Business Brief      View + Download Can see all sources cited; triggered
                      (.docx)         by VL or after intake completion

  Investment Memo     View + Download Can see all sources cited throughout
                      (.docx)         the document

  Pitch Deck          View + Download Can see source citations per slide
                      (.pptx)         

  Scoring Models      View only       Sees scores, weightings, dimension
                                      explanations, and source citations
                                      --- cannot trigger or edit

  Competitor Analysis Full access +   View, add comments on any
                      Feedback loop   competitor, flag inaccuracies,
                                      suggest missed competitors --- all
                                      contributions tagged FOUNDER and fed
                                      into future AI prompts

  Pressure Test       Full access --- Participates in all persona
                      primary         sessions; VL may also join
                      participant     

  Financial Models    Full access +   View all models and assumptions;
  --- all 3           Feedback loop   annotate with corrections; flag
                                      unrealistic inputs --- all tagged
                                      FOUNDER and used in future model
                                      runs

  Interview Insights  Full access --- Can upload their own interview
                      Upload + View   transcripts (.docx supported); sees
                                      all extracted insights and
                                      cross-interview synthesis

  Strategy & Moat     Full access --- Can add insights, contribute to moat
                      No Delete       development, use personas for
                                      strategy challenges --- cannot
                                      delete existing entries

  Design Partners     Full access --- Can suggest design partner
                      Add Candidates  candidates from their network; adds
                                      company, contact, LinkedIn URL for
                                      evaluation

  Source Citations    View throughout All AI_RESEARCH citations (article,
                      all features    URL, date) visible and clickable
                                      across every feature and document

  AI Feedback Loop    Full access     Can rate any AI output and add
                                      corrective comments on any feature
                                      --- stored tagged FOUNDER, surfaced
                                      in future prompts
  ------------------------------------------------------------------------

**2.2 The Venture Lead**

The Venture Lead manages the full venture lifecycle, triggers all AI
analyses, generates documents, annotates the record, and presents to the
Investment Committee. Only the VL can access the Portfolio Dashboard and
advance ventures through stages.

  ------------------------------------------------------------------------
  **Feature**         **VL         **Notes**
                      Access**     
  ------------------- ------------ ---------------------------------------
  Portfolio Dashboard Full access  All ventures, all stages, pipeline
                                   view, weekly report generation

  All founder-facing  Full access  VL can conduct the Idea Intake if
  features            --- can run  needed
                      on behalf of 
                      founder      

  Scoring Models      Full access  Trigger, review, annotate, re-run; can
                                   add VL-tagged override notes

  Source Verification Full access  Can click through any source tag to
                      throughout   verify; can flag incorrect or outdated
                                   citations

  AI Feedback         Full access  Can rate and comment on any AI output
                      throughout   across all features --- tagged VL, used
                                   in future prompts

  Stage Advancement   Exclusive    Only VL can advance ventures through
                      access       stages; requires confirmation dialogue

  Output Generation   Full access  Generates Business Brief, Investment
                                   Memo, Pitch Deck, and all
                                   stage-specific outputs

  Investment          Full access  In weekly report: can Accept / Defer /
  Committee Actions                Discuss IC action items --- logged in
                                   Source Audit

  Venture Creation    Full access  Can create new ventures manually for
                                   Stage 01 opportunity exploration

  Design Partner      Full access  Full pipeline management: score
  pipeline                         candidates, advance stages, draft and
                                   log outreach
  ------------------------------------------------------------------------

**2.3 AI Feedback Loop --- Formalised**

  -----------------------------------------------------------------------
  *Both the Founder and Venture Lead can provide feedback on any
  AI-generated output anywhere in the system. This is not cosmetic --- it
  is structural. Feedback is stored in the venture record and included as
  context in every future Claude API call that touches the relevant
  feature. The system improves as the venture matures.*

  -----------------------------------------------------------------------

-   Mechanism: thumbs up / thumbs down + optional text comment on every
    AI-generated block

-   Corrections: either user can mark a specific claim \'Incorrect\' and
    provide the right information --- stored as FOUNDER or VL correction
    tagged FEEDBACK

-   Citation flags: either user can flag an external citation as \'Not
    credible\' or \'Outdated\' --- flagged sources are excluded from
    future prompts for this venture

-   Prompt injection: every Claude API call includes any feedback
    collected on that feature as context: \'Human feedback on previous
    version: \[feedback\]. Take this into account.\'

-   Feedback history is fully visible in the Source Audit Panel for
    transparency

**3. Studio Methodology --- 7-Stage Framework**

Each stage has defined activities, feature unlocks, and outputs. The
table below summarises the full framework --- detailed stage
specifications follow.

  ----------------------------------------------------------------------------------------
  **Stage**   **Name**     **Activities      **Features       **Venture OS Outputs**
                           Focus**           Unlocked**       
  ----------- ------------ ----------------- ---------------- ----------------------------
  01          Discover     Opportunity       VC Thesis        VC thesis summaries · Market
                           exploration ---   Intelligence ·   signal brief · Opportunity
                           no idea or        Market Signal    notes
                           founder required  Research         

  02          Define       Idea intake from  Idea Intake ·    Scoring reports (all 3
                           founder +         Scoring Models · lenses) · ICP document ·
                           opportunity       ICP Builder ·    Business Brief (Word, max 5
                           articulation      Competitor       pages)
                                             Analysis ·       
                                             Business Brief   

  03          Incubate     De-risk through   Investment Memo  Investment Memo (Word,
                           structured        · Financial      10--20 pages) · Financial
                           experimentation   Models · Pitch   Models (3) · Pitch Deck
                                             Deck · Client    (12-slide PPTX) · 0--20
                                             List Builder ·   client target list
                                             Pressure Test ·  
                                             Interview        
                                             Insights ·       
                                             Strategy & Moat  

  04          Design &     Co-create with 3  Design Partner   Design Partner scores ·
              Validate     signed design     Scorecard ·      Design partner feedback
                           partners          Feedback         summary · MVP feature list
                                             Synthesiser ·    
                                             MVP Feature      
                                             Generator        

  05          MVP          Architecture,     Architecture     Draft technical architecture
              Readiness    team, environment Generator ·      · Product roadmap · Feature
                           prep              Product Roadmap  PRDs · Sprint plan
                                             Builder ·        
                                             Feature PRD      
                                             Generator ·      
                                             Sprint Planner   

  06          MVP Build &  Track build, run  Client Feedback  Client feedback summary ·
              Pilot        pilot clients,    Synthesiser ·    Updated product roadmap ·
                           test pricing      Roadmap Updater  Pricing recommendations
                                             · Pricing Lab    

  07          Commercial   Market entry ---  Pricing          GTM plan · Pricing
              Validation   tracking and      Implementation   implementation plan
                           pricing           Tracker · GTM    
                           implementation    Tracker          
                           only                               
  ----------------------------------------------------------------------------------------

**Stage 01 --- Discover**

  -----------------------------------------------------------------------
  v2 Update: Stage 01 is now a placeholder stage powered by Claude deep
  research. No founder or idea is required. Provides VC thesis
  intelligence and market signals to ground the studio\'s exploration.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Field**       **Detail**
  --------------- -------------------------------------------------------
  Purpose         Open the aperture --- build conviction about an
                  opportunity space before committing to a specific idea
                  or founder

  Activities      Identify opportunity areas · Define strategic thesis ·
                  Trend and signal analysis · Startup landscape scouting
                  · VC thesis review calls

  VC Thesis       Claude performs deep research on recent investment
  Intelligence    theses from major VCs including a16z, Sequoia,
  (Key Feature)   Benchmark, Bessemer, First Round, Lightspeed, and GV.
                  Surfaces: what they are actively funding, what themes
                  they are writing about, what sectors they are avoiding.
                  All findings tagged AI_RESEARCH with article title,
                  URL, and publication date as clickable citations.

  First Round     A dedicated card in Stage 01 links directly to
  Review Link     firstround.com/review --- an editorially curated
                  library of founder and operator insights. Displayed as
                  a featured resource panel. This may evolve into a full
                  content ingestion feature in a future version.

  Market Signal   Claude searches for recent news, regulatory changes,
  Research        and technology announcements relevant to the
                  opportunity area being explored. All sources tagged
                  AI_RESEARCH with full citations. VL can provide search
                  direction (e.g. \'Focus on AI in financial services
                  compliance\').

  Outputs         Opportunity brief (narrative summary of the space,
                  AI_SYNTHESIS) · VC thesis summary (what major VCs are
                  saying about this space, AI_RESEARCH with citations) ·
                  Market signal brief (recent developments, AI_RESEARCH
                  with citations)

  Notes           No venture idea, no founder, and no scoring is required
                  at this stage. The VL is building strategic conviction
                  before committing to a concept.
  -----------------------------------------------------------------------

**Stage 02 --- Define**

  -----------------------------------------------------------------------
  v2 Update: Activities now include idea intake from founder as a primary
  activity. Outputs updated: Scoring, ICP document, and Business Brief
  (not Investment Memo or Pitch Deck --- those are Stage 03).

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Field**       **Detail**
  --------------- -------------------------------------------------------
  Purpose         Articulate a specific, high-value opportunity with a
                  founder and establish foundational conviction

  Activities      Idea intake from founder (Idea Intake session) ·
                  Ideation workshop · Use case development · Ideal
                  Customer Profile development · Roadshow planning ·
                  Initial competitive landscape · Stakeholder mapping ·
                  Emerging partner POV

  Features        Idea Intake · Scoring Models (all 3 lenses) · ICP
  Unlocked        Builder · Competitor Analysis · Business Brief
                  Generator

  Outputs from    Scoring reports across all 3 lenses · ICP document
  Venture OS      (structured profile of the ideal customer) · Business
                  Brief (Word .docx, max 5 pages --- first major output,
                  can be run during or after the intake session)

  Notes           The Business Brief is the first formal deliverable. It
                  is generated from the Idea Intake responses and can be
                  triggered as soon as the core intake dimensions are
                  sufficiently covered. It is an early-stage articulation
                  --- not a capital ask document.
  -----------------------------------------------------------------------

**Stage 03 --- Incubate**

  -----------------------------------------------------------------------
  v2 Update: Investment Memo (full 10--20 page Word doc) replaces
  \'Investment Business Case\'. Pitch Deck generated at end of this
  stage. Financial Models unlocked here. 0--20 client list added.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Field**       **Detail**
  --------------- -------------------------------------------------------
  Purpose         De-risk the venture through structured experimentation
                  before committing to the design partner phase

  Activities      External validation (client conversations, VC calls) ·
                  Market sizing · Unit economics and pricing research ·
                  Moat strategy development · Risk analysis · Define
                  funding ask · Shortlist design partners · Competitive
                  deep-dive · Interview Insights synthesis

  Features        Investment Memo Generator · Financial Models (MVP Cost,
  Unlocked        Unit Economics, Market Sizing) · Pitch Deck Generator ·
                  0--20 Client List Builder · Pressure Test (full persona
                  suite) · Interview Insights · Strategy & Moat workspace

  Outputs from    Investment Memo (Word .docx, 10--20 pages --- full
  Venture OS      incubation document for the Investment Committee) ·
                  Financial Models (all 3, with assumptions) · Pitch Deck
                  (12-slide .pptx --- generated at end of incubation) ·
                  0--20 client target list

  Capital Gate    Investment Memo must be generated and reviewed by the
                  VL before advancing to Stage 04
  -----------------------------------------------------------------------

**Stage 04 --- Design & Validate**

  -----------------------------------------------------------------------
  **Field**       **Detail**
  --------------- -------------------------------------------------------
  Purpose         Co-create with design partners to validate the concept
                  and define the MVP

  Activities      Secure 3 signed design partners · 5-day POC sprint ·
                  Create synthetic data · Emerging partner evaluation ·
                  Define MVP and roadmap · Define MVP KPIs

  Features        Design Partner Scorecard (full pipeline management) ·
  Unlocked        Design Partner Feedback Synthesiser · MVP Feature
                  Generator

  Outputs from    Design Partner qualification scores · Summary of design
  Venture OS      partner feedback (synthesised from interviews and
                  conversation notes, informs MVP scope) · MVP feature
                  list (AI-generated from feedback, ranked by frequency
                  and strategic importance)

  Capital         \$500K--\$1M committed at this stage

  Gate            3 design partners signed before advancing to Stage 05
  -----------------------------------------------------------------------

**Stage 05 --- MVP Readiness**

  -----------------------------------------------------------------------
  v2 Update: New Venture OS outputs for this stage: Draft Architecture,
  Product Roadmap, Feature PRDs, Sprint Plan --- all AI-generated from
  the accumulated venture record.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Field**       **Detail**
  --------------- -------------------------------------------------------
  Purpose         Prepare for full build --- architecture, team,
                  environment, and execution plan

  Activities      Prototype code review · Sprint 0 plan · Define
                  technical architecture · Select development partner ·
                  Assign product owner · Finalise MVP sprint plan ·
                  Environment setup

  Features        Architecture Generator · Product Roadmap Builder ·
  Unlocked        Feature PRD Generator · Sprint Planner

  Outputs from    Draft technical architecture (AI-generated, editable) ·
  Venture OS      Product roadmap (phased from MVP to commercial scale,
                  with milestones) · Feature PRDs (one-page requirement
                  docs per MVP feature) · Sprint plan (sprint-by-sprint
                  execution plan for the build phase)

  Notes           All outputs are AI-generated starting points --- the
                  technical and product team owns final specifications.
                  All documents are editable and source-tagged.
  -----------------------------------------------------------------------

**Stage 06 --- MVP Build & Pilot**

  -----------------------------------------------------------------------
  v2 Update: New outputs: Client Feedback Summary, Updated Roadmap.
  Pricing Lab introduced here for testing during pilot --- output feeds
  into Stage 07.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Field**       **Detail**
  --------------- -------------------------------------------------------
  Purpose         Track the build and run pilot clients --- Venture OS
                  tracks and synthesises, it does not build

  Activities      Build and launch MVP · UAT testing · Validate data and
                  workflows · Design partner pilots · Pricing experiments
                  with pilot clients

  Features        Client Feedback Synthesiser · Roadmap Updater · Pricing
  Unlocked        Lab

  Outputs from    Summary of client pilot feedback (synthesised from
  Venture OS      uploaded interviews, session notes, and VL observations
                  --- tagged by client company) · Updated product roadmap
                  (incorporating pilot learnings) · Pricing
                  recommendation from Pricing Lab (tested pricing
                  structure for commercial launch)

  Pricing Lab     A dedicated feature for testing and validating pricing
                  during the pilot. VL inputs proposed pricing tiers,
                  pilot client reactions, and willingness-to-pay signals.
                  Claude synthesises and recommends the optimal pricing
                  structure for Stage 07 commercial launch. All
                  assumptions listed with sources and editable. Output
                  exported as Word .docx.
  -----------------------------------------------------------------------

**Stage 07 --- Commercial Validation**

  -----------------------------------------------------------------------
  **Field**       **Detail**
  --------------- -------------------------------------------------------
  Purpose         Transition from pilot to commercial --- early adopter
                  market entry

  Activities      Finalise pipeline and revenue expectations · Establish
                  engagement tracking · Establish service codes ·
                  Determine tech integration path · Implement pricing
                  from Pricing Lab

  Features        Pricing Implementation Tracker (takes Pricing Lab
                  output and tracks its rollout) · GTM Tracker

  Outputs from    GTM plan (10/50/100 client trajectory) · Pricing
  Venture OS      implementation plan (from Pricing Lab, formatted for
                  commercial launch) · 10 signed client SOW tracker

  Capital         \$1M--\$1.5M
  -----------------------------------------------------------------------

**4. Source Attribution System**

  -----------------------------------------------------------------------
  *Every data field in Venture OS carries a source tag. This is
  load-bearing infrastructure --- every claim is traceable to its origin.
  When Claude performs external research, it must cite the specific
  article, report, or publication with title, URL, and date accessed.
  These citations are displayed as clickable chips to both users
  throughout the system.*

  -----------------------------------------------------------------------

  --------------------------------------------------------------------------------
  **Tag**            **Label**    **Colour**     **Description + Citation
                                                 Requirement**
  ------------------ ------------ -------------- ---------------------------------
  FOUNDER            Founder      Blue #4F9CF9   Directly stated by the founder.
                     Input                       Log the intake session dimension
                                                 and timestamp. No external
                                                 citation required.

  VL                 Venture Lead Amber #F59E0B  Added, edited, or annotated by
                                                 the Venture Lead. Log VL name and
                                                 timestamp.

  AI_SYNTHESIS       AI Synthesis Violet #7C6AF7 Claude reasoning derived from
                                                 data already in the venture
                                                 record. Cite the specific venture
                                                 record fields used.

  AI_RESEARCH        AI Research  Teal #0EA5E9   Claude claims grounded in
                                                 external knowledge. MUST include:
                                                 source title · URL (if public) ·
                                                 publication date · date accessed.
                                                 Rendered as a clickable chip for
                                                 both users.

  CLIENT_INTERVIEW   Client       Green #10B981  Validated by a client or
                     Interview                   prospect. Sub-tag: company name
                                                 and role. Propagates validation
                                                 tags across all documents
                                                 referencing this claim.

  VC_INTERVIEW       VC Interview Indigo #6366F1 Raised or validated by a VC
                                                 conversation. Sub-tag: firm name.
                                                 Used to tag market size and
                                                 timing claims.

  EXPERT_INTERVIEW   Expert       Purple #9333EA Validated by a domain expert.
                     Interview                   Sub-tag: name and role.

  PRESSURE_TEST      Pressure     Orange #F97316 Output from a Shark Tank persona
                     Test                        session. Sub-tag: persona name.

  SCORING            Scoring      Emerald        Output from a scoring framework.
                     Model        #059669        Sub-tag: model name (Corporate /
                                                 VC / Studio).

  COMPETITOR         Competitor   Pink #EC4899   Data about a specific competitor.
                     Analysis                    Sub-tag: competitor name.

  FINANCIAL          Financial    Lime #84CC16   Output from a financial model.
                     Model                       Sub-tag: model type.

  DESIGN_PARTNER     Design       Cyan #06B6D4   Input from or about a design
                     Partner                     partner candidate. Sub-tag:
                                                 company name.

  FEEDBACK           Human        Slate #94A3B8  Corrective feedback from Founder
                     Feedback                    or VL on a prior AI output.
                                                 Sub-tag: role of the person
                                                 providing feedback.
  --------------------------------------------------------------------------------

**4.1 External Research Citation Standard (AI_RESEARCH)**

When Claude returns any claim tagged AI_RESEARCH, the following must be
stored and surfaced in the UI:

-   Source title --- name of the article, report, paper, or publication

-   Source URL --- direct link to the source (stored even if not
    displayed inline)

-   Publication date --- when the source was published or last updated

-   Date accessed --- when Claude retrieved this information

-   Relevance note --- one sentence on why this source supports the
    claim

These render as small clickable chips labelled with the source title.
Clicking opens the source URL in a new tab. Both Founder and VL can flag
any citation as \'Not credible\' or \'Outdated\' --- flagged sources are
excluded from future AI prompts for this venture and noted in the Source
Audit Panel.

**4.2 Interview Validation Tags --- Propagation**

  -----------------------------------------------------------------------
  *When an insight from an uploaded client, VC, or expert interview
  validates or contradicts a claim in the venture record, a validation
  tag is applied to that claim. This tag then appears on that claim
  wherever it surfaces --- in the Business Brief, Investment Memo, Pitch
  Deck, Scoring outputs, and the Idea Intake transcript.*

  -----------------------------------------------------------------------

-   Validated by Client Interview \[Company\] --- tagged
    CLIENT_INTERVIEW

-   Validated by VC Interview \[Firm\] --- tagged VC_INTERVIEW

-   Validated by Expert Interview \[Role\] --- tagged EXPERT_INTERVIEW

-   Contradicted by Client Interview \[Company\] --- shown in amber with
    a warning icon; flags the claim for review

-   Unvalidated --- no external interview has addressed this claim yet
    --- shown in muted grey

**5. Feature: Idea Intake**

  -----------------------------------------------------------------------
  v2 Update: Renamed from \'Founder Interview\'. Real-time 10-dimension
  progress dashboard added (right pane). Voice input supported. No
  section transitions --- fluid conversation only. No structured summary
  generated. All chat messages saved continuously and scrollable. Chat is
  the primary interface.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Idea Intake is the primary input mechanism for Venture OS. It is a
  live, adaptive conversation between the Founder and an AI Venture Lead
  (Claude). Both text and voice input are supported. The goal is to
  extract a complete, evidence-backed picture of the venture across 10
  dimensions and surface weaknesses before they become expensive
  problems. The AI challenges vague claims, asks for specifics, and flags
  gaps in real time --- shown on a live progress dashboard the founder
  can see at all times.*

  -----------------------------------------------------------------------

**5.1 Screen Layout**

  ------------------------------------------------------------------------------
  **Pane**     **Width**   **Contents**                 **Behaviour**
  ------------ ----------- ---------------------------- ------------------------
  Chat Window  60%         Scrollable full conversation Continuous save --- no
  (left)                   history. AI messages         messages are lost. Enter
                           left-aligned with violet     submits. Shift+Enter for
                           tint. Founder messages       new line. Voice
                           right-aligned. Timestamps on transcription appears in
                           all messages. Microphone     input field before
                           button always visible in     submission. No session
                           input bar.                   time limits.

  Progress     40%         All 10 intake dimensions     Updates after every AI
  Dashboard                listed with live status      response turn. Founder
  (right)                  indicators, dimension name,  can click any dimension
                           and a one-line summary of    to ask a follow-up
                           what has been captured so    question in that area.
                           far.                         Summary text updates as
                                                        coverage deepens.
  ------------------------------------------------------------------------------

**5.2 Progress Dashboard --- Status Indicators**

  -----------------------------------------------------------------------
  *The right-pane progress dashboard is always visible during the Idea
  Intake session. It gives the founder a live, honest view of where their
  idea is strong, where there are issues, and what is still missing.
  There are no section transitions --- the AI moves fluidly between
  dimensions and the dashboard reflects coverage as it emerges
  organically.*

  -----------------------------------------------------------------------

  -------------------------------------------------------------------------
  **Status**    **Colour**   **Meaning**
  ------------- ------------ ----------------------------------------------
  Complete      Green ●      Sufficient, specific, evidence-backed
                             information captured for this dimension

  In Progress   Blue ●       Dimension has been touched but needs more
                             depth --- AI will return to it

  Issue Flagged Red ●        Claude has identified a weakness,
                             contradiction, or unsupported claim ---
                             requires attention

  Missing       Yellow ●     Dimension has not been addressed yet --- will
                             appear as a gap in the Business Brief

  Not Started   Grey ○       Not yet touched in the conversation
  -------------------------------------------------------------------------

Per dimension, the dashboard shows: status indicator · dimension name ·
one-line capture summary (e.g. \'Annual contract value: \$150K, buyer is
Controller, budget line confirmed\') · any flags raised.

**5.3 Voice Input**

-   Microphone button present in the chat input bar at all times

-   Founder speaks --- transcription appears in real time in the input
    field before submission

-   Founder can review and edit the transcription before sending

-   All voice responses stored with FOUNDER source tag and a \'voice\'
    sub-tag

-   AI responses are text-only by default --- audio playback can be
    toggled on in settings

**5.4 No Section Transitions**

The AI does not announce topic changes, display section headers, or
pause between sections. The conversation flows naturally. Claude
assesses dimension coverage continuously and navigates to wherever the
conversation most needs to go. The progress dashboard reflects this
coverage --- the founder sees progress without artificial structure
imposed on the dialogue.

**5.5 The 10 Intake Dimensions**

  ----------------------------------------------------------------------------------
  **\#**   **Dimension**   **What Claude Extracts** **Issue Flag Triggered When**
  -------- --------------- ------------------------ --------------------------------
  01       Core Concept    What is the idea? What   Idea unclear after 3 exchanges ·
                           problem does it solve?   Problem described without a
                           Where did the insight    buyer · Origin purely
                           come from?               theoretical

  02       Problem & Pain  How acute is the pain?   No specific evidence cited ·
           Points          Who feels it most? What  Pain is \'nice to have\' ·
                           are current workarounds  Current workaround is cheap and
                           and what do they cost?   adequate

  03       Ideal Customer  Buyer identity ·         ICP too broad · No named company
           Profile         Industry/segment ·       types · No evidence of
                           Decision-making unit ·   conversations with actual buyers
                           Company size/revenue     
                           profile · Buying trigger 

  04       The Solution    How it works · What      Solution is a feature not a
                           makes it effective ·     product · Scope unclear · No
                           What it explicitly does  articulation of the 10x
                           NOT do · Minimum viable  improvement over status quo
                           version                  

  05       Revenue Model   Monetisation approach ·  No clear monetisation · Pricing
                           Pricing model · Unit     undefined · No budget line for
                           economics intuition ·    this in the target company
                           Who actually writes the  
                           cheque                   

  06       Market Size     TAM/SAM/SOM · Sizing     No sizing attempted · Market too
                           methodology · Market     small for the ambition ·
                           growth rate              Methodology is anecdotal

  07       Why Now         Market/tech/regulatory   No timing argument · Timing is
                           shift enabling this ·    generic (\'AI is hot\') · Window
                           What prevented it 3      is not specific to this venture
                           years ago                

  08       Team & Founder  Who is involved ·        No relevant domain experience ·
           Fit             Relevant experience ·    Key gaps unacknowledged ·
                           Known gaps · Founder\'s  Founder is a generalist with no
                           unfair advantage in this domain edge
                           space                    

  09       Strategy & Moat Long-term defensibility  No moat articulated · \'First
                           · Network effects,       mover advantage\' is the only
                           switching costs, data    answer · Moat is not specific to
                           advantages, brand ·      this business model
                           Strategic threats        

  10       Traction &      Client conversations ·   No conversations with real
           Evidence        LOIs · Pilots · Revenue  buyers · No willingness-to-pay
                           · Design partner         signal · Has not heard \'no\'
                           interest · What \'no\'   from anyone
                           responses have been      
                           received                 
  ----------------------------------------------------------------------------------

**5.6 Claude System Prompt --- Idea Intake**

  -------------------------------------------------------------------------
  *You are a sharp, intellectually rigorous Venture Lead conducting an idea
  intake session with a founder. Your job is to extract a complete,
  evidence-backed picture of this venture idea across 10 dimensions and
  surface weaknesses before they become expensive problems. Ask one
  question at a time. Push back on vague claims immediately --- do not
  accept \'we will figure that out later.\' Ask for specific names,
  numbers, and evidence. When a founder gives a strong, specific answer,
  acknowledge it briefly and move on. When they are vague, probe harder and
  flag the gap. Move across all 10 dimensions naturally --- do not announce
  topic transitions or section changes. After each response, return a JSON
  coverage assessment alongside your conversational reply: { dimensions:
  \[{ id, status:
  \'complete\'\|\'in_progress\'\|\'issue\'\|\'missing\'\|\'not_started\',
  summary: string, flags: string\[\] }\] }. This JSON is used to update the
  live progress dashboard --- it must be returned on every turn.*

  -------------------------------------------------------------------------

**5.7 Data Storage**

-   Every message stored: { role, content, source, timestamp,
    voiceInput: boolean }

-   After each AI response, the coverage assessment JSON is stored and
    used to update the right-pane progress dashboard

-   No structured end-of-session summary is generated --- the chat
    history is the record

-   Full transcript accessible in the venture detail panel ---
    scrollable, filterable by dimension

-   VL can read the transcript in real time and add VL-tagged
    annotations to any individual message

**6. Output: Business Brief**

  -----------------------------------------------------------------------
  v2 Update: Renamed from short \'Investment Memo\'. Generated from Idea
  Intake. Max 5 pages. Word .docx only. Market Opportunity section is
  high-level sector CAGR and size --- not venture-specific TAM/SAM/SOM.
  No team section. Why Now folds into Opportunity Overview. Ask section
  replaced by Recommendations. Investment Thesis removed entirely.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *The Business Brief is the first formal output from Venture OS. It can
  be generated during the Idea Intake session (once the core dimensions
  are Green) or immediately after. It is an early-stage articulation of
  the opportunity --- its purpose is to inform initial stakeholder
  conversations, not to make a capital ask. Maximum 5 pages.*

  -----------------------------------------------------------------------

**6.1 When to Generate**

-   During the Idea Intake session: VL or Founder can trigger it once
    dimensions 01--04 (Core Concept, Problem, ICP, Solution) are at
    Green status

-   After the session: can be generated at any point from the Outputs
    tab in the venture detail panel

-   Re-generation: can be re-run as the venture record grows --- each
    version stored with timestamp

-   Trigger access: VL triggers generation; Founder can request and VL
    approves

**6.2 Section Structure (5-page max)**

  -----------------------------------------------------------------------------
  **Section**       **Content**                    **Max**   **Source Tags**
  ----------------- ------------------------------ --------- ------------------
  Opportunity       What is the opportunity? Why   1 page    FOUNDER ·
  Overview + Why    is this the right moment? The            AI_SYNTHESIS ·
  Now               market, technology, or                   AI_RESEARCH
                    regulatory shift that creates            
                    the window is integrated here            
                    --- not a separate section.              
                    Draws directly from intake               
                    dimensions 01 and 07.                    

  Problem & Pain    Who has the pain, how acute it 3/4 page  FOUNDER ·
  Points            is, what they do today, and              CLIENT_INTERVIEW
                    what it costs them. Verbatim             (if available)
                    quotes from the Idea Intake              
                    cited where the founder                  
                    provided specific evidence.              

  Ideal Customer    The specific company type,     1/2 page  FOUNDER ·
  Profile           buyer role, decision-making              AI_SYNTHESIS
                    unit, and buying trigger in              
                    narrative form. Drawn from               
                    intake dimension 03.                     

  Solution Overview What the product does, what    3/4 page  FOUNDER ·
                    makes it different from                  AI_SYNTHESIS
                    current alternatives, and what           
                    it explicitly does not do. No            
                    technical depth --- a clear              
                    articulation of the value                
                    proposition.                             

  Market            High-level sector context only 1/2 page  AI_RESEARCH (full
  Opportunity       --- NOT a venture-specific               citations
                    TAM/SAM/SOM. Includes: the               required)
                    CAGR of the sector this idea             
                    operates in, the total market            
                    size of that sector, and 2--3            
                    sentences on growth drivers.             
                    All figures sourced from cited           
                    AI_RESEARCH with full                    
                    citations.                               

  Recommendations   Early-stage guidance on the    1/2 page  AI_SYNTHESIS · VL
                    idea\'s strengths and what the           
                    founder should prioritise next           
                    to build conviction. Replaces            
                    the \'Ask\' section --- this             
                    document is too early for a              
                    capital request. AI-generated            
                    with VL annotation                       
                    opportunity.                             
  -----------------------------------------------------------------------------

**6.3 Format and Export**

-   Format: Word (.docx) --- not PDF

-   Source tags rendered as superscript footnotes throughout ---
    clickable for AI_RESEARCH citations

-   VL can edit any section inline before export --- edits tagged VL

-   Both Founder and VL can download

-   Version history: each generated version stored with timestamp

**7. Feature: Scoring Models**

  -----------------------------------------------------------------------
  v2 Update: UI redesigned: three tiles on the same page --- not three
  tabs. User sees score weighting before running. After scoring: each
  dimension shows score, explanation (2--3 sentences), and \'why it
  matters\' context. Both Founder and VL see the full output.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Three scoring frameworks evaluate the venture from three capital
  allocator perspectives --- Corporate Innovation, Venture Capital, and
  Venture Studio. Each tile shows the score weighting upfront so users
  understand what matters before the score runs. After scoring, every
  dimension receives an explanation and a \'why this matters\' note
  grounded in the research basis of each model.*

  -----------------------------------------------------------------------

**7.1 Scoring UI --- Three Tiles on One Page**

  ---------------------------------------------------------------------------
  **Tile**      **Before Scoring    **After \'Run      **After Scoring
                (tile state)**      Scoring\'          Completes**
                                    clicked**          
  ------------- ------------------- ------------------ ----------------------
  Corporate     Model name ·        Loading: \'Running Radar chart · Each
  Innovation    Research basis      Corporate          dimension: score bar
                cited · 7           Innovation         (1--5) + written
                dimensions each     analysis\...\'     explanation (2--3
                showing name +                         sentences) + \'Why it
                weighting % · \'Run                    matters for corporate
                Scoring\' button                       ventures\' callout +
                                                       source citations

  Venture       Model name ·        Loading:           Same format as
  Capital       Research basis      \'Applying the VC  Corporate tile
                cited · 8           Lens\...\'         
                dimensions +                           
                weightings · \'Run                     
                Scoring\'                              

  Venture       Model name ·        Loading: \'Running Same format as
  Studio        Research basis      Studio             Corporate tile
                cited · 8           evaluation\...\'   
                dimensions +                           
                weightings · \'Run                     
                Scoring\'                              
  ---------------------------------------------------------------------------

Below the three tiles: Combined Score Summary --- all three lens scores
side by side with a composite signal: Advance / Caution / Revisit /
Kill. Appears once at least one model has been scored.

VL can add a VL-tagged annotation to any dimension score. Founder can
view all scores and rationale but cannot edit. Score history: every run
stored with timestamp --- VL can toggle between historical runs.

**7.2 Corporate Innovation Lens --- Dimensions and Weightings**

*Research basis: Nagji & Tuff HBR (2012); McKinsey Three Horizons Model;
Doblin\'s Ten Types of Innovation; Chesbrough Open Innovation (2003);
O\'Reilly & Tushman Ambidextrous Organization (2004)*

  ------------------------------------------------------------------------------
  **Dimension**       **Weight**   **Why It Matters**
  ------------------- ------------ ---------------------------------------------
  Strategic Alignment 20%          A venture that does not serve the parent\'s
                                   strategy will be defunded at the first budget
                                   cycle --- regardless of its market potential.

  Horizon             15%          H1/H2/H3 clarity determines the right
  Classification                   management model, success metrics, and
                                   capital patience. Misclassification leads to
                                   premature termination.

  Internal            15%          The leading cause of corporate venture death
  Sponsorship                      is loss of internal champion. This is a
                                   survival factor, not a nice-to-have.

  Organizational      15%          The best product fails if the parent
  Readiness                        organisation cannot support it at scale ---
                                   in talent, infrastructure, and culture.

  Innovation Type     10%          Different innovation types (Doblin framework)
                                   require different investment profiles,
                                   timelines, and success measures.

  Cannibalization     10%          Unacknowledged cannibalization risk surfaces
  Risk                             as internal sabotage at the worst possible
                                   moment. Name it early.

  Build / Buy /       15%          Building what should be acquired, or
  Partner Fit                      acquiring what should be built in a
                                   partnership, destroys capital and time.
  ------------------------------------------------------------------------------

**7.3 Venture Capital Lens --- Dimensions and Weightings**

*Research basis: Sequoia Capital framework; Bessemer Venture Partners
\'10 Laws of Cloud\'; a16z market-first thesis; Benchmark founder-market
fit model; First Round \'7 Questions\' (Thiel-derived); Elad Gil \'High
Growth Handbook\'*

  ------------------------------------------------------------------------------
  **Dimension**       **Weight**   **Why It Matters**
  ------------------- ------------ ---------------------------------------------
  Market Size         20%          VCs need \$1B+ TAM to justify the fund math.
                                   Below that, even a great business is a
                                   structurally poor VC investment.

  Problem Severity    15%          Painkillers get funded. Vitamins get
                                   interesting case studies. The difference is
                                   urgency --- and budget.

  Solution            15%          10x better or go home. Incremental
  Differentiation                  improvement gets copied before you can scale.

  Founder-Market Fit  15%          The team is the only truly defensible moat in
                                   the early stage. Domain insight compounds.

  Business Model      10%          Revenue model design determines whether this
  Quality                          is a VC-scale opportunity or a lifestyle
                                   business. Gross margin is everything.

  Timing / Why Now    10%          Being right too early is the same as being
                                   wrong. The specific unlock matters as much as
                                   the idea.

  Competitive Moat    10%          What compounds over time is what gets
                                   acquired at a premium or builds durable,
                                   defensible revenue.

  Traction Signal     5%           Any signal that someone will pay for this ---
                                   however early --- changes the risk profile
                                   fundamentally.
  ------------------------------------------------------------------------------

**7.4 Venture Studio Lens --- Dimensions and Weightings**

*Research basis: Mach49 corporate venture building methodology; BCG
Digital Ventures stage-gate model; High Alpha Studio-as-a-Service
framework; Atomic co-founding model; Bain research on corporate
incubators (2019); Ries \'The Lean Startup\' (2011); Blank \'Four Steps
to the Epiphany\'*

  ------------------------------------------------------------------------------
  **Dimension**       **Weight**   **Why It Matters**
  ------------------- ------------ ---------------------------------------------
  Design Partner      20%          The studio model only works if real clients
  Readiness                        will co-build. No design partner interest
                                   means no studio play --- regardless of the
                                   product\'s quality.

  Prototype-ability   15%          If something meaningful cannot be built in a
                                   5-day sprint, the scope is wrong or the
                                   concept is not ready for the studio.

  Studio Unfair       15%          If this venture does not need the studio\'s
  Advantage                        specific assets to succeed, it should be
                                   funded as a standalone --- not incubated.

  Stage-Gate          15%          Clear, measurable outputs at each gate are
  Progressibility                  how the studio manages capital risk before it
                                   becomes expensive.

  Founder             10%          A studio venture without a committed founder
  Accountability                   is a consulting project --- not a company.

  Capital Efficiency  10%          The studio model depends on de-risking before
                                   full commitment. Capital must follow
                                   conviction, not precede it.

  Exit Path Clarity   5%           The studio needs a return path. A great
                                   product with no credible exit is a cost
                                   centre.

  Client Validation   10%          No venture advances without a client who will
  Signal                           pay. This measures how close the venture is
                                   to that threshold.
  ------------------------------------------------------------------------------

**8. Feature: Competitor Analysis**

  -----------------------------------------------------------------------
  *Claude identifies, profiles, and evaluates competitors using its
  knowledge base and external research. All research is cited with full
  source details. Both Founder and Venture Lead have full access. Founder
  feedback on competitor data feeds back into the AI\'s analysis ---
  creating an improvement loop as the founder\'s market knowledge is
  incorporated.*

  -----------------------------------------------------------------------

**8.1 Founder Access and Feedback Loop**

-   Founder can view all competitor profiles and add comments on any
    competitor --- e.g. \'This company shut down in 2024\' or \'Their
    pricing is actually \$X\'

-   Founder can flag any AI-generated claim about a competitor as
    inaccurate and provide the correct information

-   Founder can suggest competitors Claude missed --- submitted as
    FOUNDER-tagged additions for VL review

-   All founder contributions tagged FOUNDER (feedback) and included in
    future competitor analysis API calls as additional context

-   VL can edit, delete, annotate, re-run analysis, and export --- full
    access

**8.2 Competitor Identification**

Claude identifies four categories --- all findings tagged AI_RESEARCH
with full citations:

-   Direct competitors --- companies solving the exact same problem for
    the same ICP

-   Adjacent alternatives --- solutions the ICP might use instead
    (including spreadsheets, consultants, manual processes)

-   Emerging threats --- early-stage companies or platform features that
    could compete

-   The \'do nothing\' alternative --- what the ICP does today if they
    buy nothing

**8.3 Competitor Profile Fields**

  ------------------------------------------------------------------------
  **Field**           **Source Tag**  **Notes**
  ------------------- --------------- ------------------------------------
  Company Name        VL / FOUNDER /  Legal name
                      AI_RESEARCH     

  Category            AI_SYNTHESIS    Direct / Adjacent / Emerging / Do
                                      Nothing

  Description         AI_RESEARCH     2--3 sentences --- what they do
                      (cited)         

  Target ICP          AI_RESEARCH     Who they serve and how close to our
                      (cited)         ICP

  Pricing Model       AI_RESEARCH     How they charge --- subscription,
                      (cited)         usage, services

  Funding / Scale     AI_RESEARCH     Known funding, revenue, headcount
                      (cited)         

  Key Strengths       AI_SYNTHESIS    What they do well --- acknowledged
                                      honestly

  Key Weaknesses      AI_SYNTHESIS    Where they fall short or leave gaps

  Threat Level        AI_SYNTHESIS    High / Medium / Low with written
                                      rationale

  Our Differentiation AI_SYNTHESIS    Specific differentiation claim for
  vs. This Competitor                 this comparison

  Founder Comments    FOUNDER         Founder\'s knowledge, corrections,
                      (feedback)      or additional context

  VL Notes            VL              VL annotations
  ------------------------------------------------------------------------

**8.4 Views**

-   Competitor Table --- sortable by threat level, category, ICP match;
    click to expand full profile

-   Positioning Map --- 2x2 matrix with VL-configurable axes; our
    venture plotted in a distinct colour

-   Differentiation Matrix --- our venture vs. top 3--5 competitors
    across capability dimensions; green (we win) / yellow (parity) / red
    (we lose)

-   Competitive Landscape Summary --- Claude-generated synthesis: white
    space, strongest differentiation claims, any claims in the venture
    record not supported by the competitive analysis --- tagged
    AI_SYNTHESIS

**9. Feature: Pressure Test (Shark Tank Mode)**

  -----------------------------------------------------------------------
  v2 Update: Now explicitly linked to Idea Intake --- all 10 dimension
  summaries and issue flags feed directly into persona prompts.
  End-of-session prompt offers to push new insights into the venture
  record. VL can also participate in all sessions. Venture Lead can
  direct the persona via a VL-only input field.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *The Pressure Test is an adversarial interactive session where the
  Founder (and optionally the Venture Lead) defends the venture against
  AI-generated investor and operator personas. Every persona has full
  context from the Idea Intake --- including the dimension issue flags
  --- so challenges are targeted at real weaknesses, not generic startup
  questions. At session end, new insights can be pushed back into the
  venture record.*

  -----------------------------------------------------------------------

**9.1 Link to Idea Intake**

-   Every Pressure Test session receives the full Idea Intake transcript
    and all 10 dimension coverage summaries as context

-   Red ● (Issue Flagged) dimensions from the progress dashboard are
    surfaced to the persona as priority attack vectors

-   Claude\'s persona prompt references specific claims from the intake:
    e.g. \'The founder stated TAM is \$4B based on their own estimate
    --- challenge the methodology specifically\'

-   VL can launch a session pre-targeting a specific dimension: \'Focus
    this session on the unit economics dimension\'

**9.2 Both Users Can Participate**

-   Founder is the primary participant --- all persona challenges are
    directed at the founder

-   VL can join any session as a second participant --- their messages
    are distinguished by role label in the chat

-   VL can respond to persona challenges alongside or on behalf of the
    founder

-   VL-only direction field: a separate input visible only to the VL
    allows them to redirect the persona mid-session (e.g. \'Push harder
    on the pricing model\') --- this instruction is sent to Claude
    without appearing in the main chat

**9.3 The 6 Personas**

  --------------------------------------------------------------------------------
  **Persona**   **Archetype**   **Research       **Primary       **Signature
                                Basis**          Attack          Move**
                                                 Vectors**       
  ------------- --------------- ---------------- --------------- -----------------
  The Skeptical Marc Andreessen a16z investment  Market size     Challenges the
  VC            / top-tier      thesis; Thiel    methodology ·   TAM calculation
                Silicon Valley  \'Zero to One\'; Vitamin vs.     with a
                VC              founder-market   painkiller ·    counter-model
                                fit primacy;     Incumbent       using the
                                Sequoia pitch    threat (why     founder\'s own
                                framework        won\'t          numbers
                                                 Salesforce      
                                                 build this?) ·  
                                                 Why this team   

  The Corporate Fortune 500     McKinsey/BCG     Procurement     Asks what happens
  Innovation    Chief Strategy  corporate        survival ·      when the CEO who
  Skeptic       Officer, 20     venture failure  Leadership      championed this
                years watching  rates; Nagji &   transition      is replaced ---
                corporate       Tuff;            resilience ·    and wants a
                ventures fail   Chesbrough;      Legacy system   specific answer,
                                internal         integration ·   not a platitude
                                politics         Internal        
                                research         political       
                                                 opposition      

  The Demanding Senior operator JTBD theory;     Vendor          Demands a very
  Design        who has been    Christensen      displacement    specific
  Partner       burned by       demand-side      rationale ·     definition of
                vendor pilots   innovation;      90-day success  what \'success\'
                before --- the  Blank customer   definition ·    looks like in 90
                potential first development;     Data access     days --- then
                paying customer enterprise pilot requirements ·  challenges
                                failure research Operational     whether the team
                                                 risk · What     can deliver it
                                                 happens when it 
                                                 fails           

  The Technical CTO / VP        Gartner Hype     Technical moat  Asks \'What
  Devil\'s      Engineering at  Cycle;           (is this just   happens when
  Advocate      a mid-market    build-vs-buy     an OpenAI       OpenAI ships a
                enterprise      analysis;        wrapper?) ·     feature covering
                company         technical debt   Commodity AI    80% of this for
                                research; AI/ML  risk · Data     free?\' --- then
                                reliability      privacy and     wants the
                                literature       security ·      technical answer,
                                                 Integration     not the market
                                                 complexity ·    answer
                                                 Hallucination   
                                                 risk            

  The Unit      Growth-stage    Bessemer SaaS    Unit economics  Builds a
  Economics     CFO who has     benchmarks; Rule in detail · CAC counter-model
  Enforcer      lived through a of 40; LTV/CAC   payback period  using the
                CAC crisis and  ratio analysis;  · P&L at 50 vs. founder\'s own
                a margin        contribution     500 clients ·   numbers to show
                implosion       margin analysis; Gross margin    precisely where
                                payback period   assumptions ·   the economics
                                benchmarks by    Where the model fall apart
                                vertical         breaks ·        
                                                 Capital         
                                                 efficiency at   
                                                 scale           

  The Venture   Experienced     BCG Digital      Studio vs.      Asks whether
  Studio        studio operator Ventures;        acquisition     \'should we
  Insider       who has seen    Mach49; High     decision ·      acquire this
                50+ ventures    Alpha; Atomic;   Parent company  space\' was ever
                built --- most  academic         dependency risk properly
                of them fail    research on      · Exit path and considered as an
                                corporate        acquirer        alternative to
                                venture success  identity ·      \'should we
                                rates; studio    Whether this is build\' --- and
                                vs. incubator    really a Stage  wants to see the
                                failure modes    01 idea being   analysis
                                                 pitched with    
                                                 Stage 03        
                                                 confidence      
  --------------------------------------------------------------------------------

**9.4 End-of-Session: Insight Integration**

  -----------------------------------------------------------------------
  *At the end of every Pressure Test session, Claude generates a session
  summary and presents an insight integration prompt. This is the
  feedback loop that closes the circle between adversarial challenge and
  the venture record. New answers, clarifications, and pivots from the
  session can be added to the venture record with the founder\'s
  approval.*

  -----------------------------------------------------------------------

-   Session summary: 3 strongest challenges raised (specific to this
    venture) · Founder response quality per challenge: Strong / Adequate
    / Weak · List of unresolved vulnerabilities

-   Insight integration prompt: \'During this session, the following new
    insights or clarifications emerged about your venture. Would you
    like to add any of them to your venture record?\' --- each proposed
    addition listed separately

-   Each proposed addition shows: the insight, which dimension it
    affects, and the source tag it will carry (PRESSURE_TEST + persona
    sub-tag)

-   Founder and VL can accept, edit, or reject each addition
    individually

-   Accepted additions update the venture record, re-trigger the Idea
    Intake progress dashboard assessment, and appear in the Source Audit
    Panel

**10. Feature: Financial Models**

  -----------------------------------------------------------------------
  v2 Update: Founder has full access with feedback capability on all 3
  models. Unit Economics model can use Claude\'s market average research
  as a source (tagged AI_RESEARCH with citations). Both Unit Economics
  and Market Sizing models now include a transparent Assumptions section
  --- all assumptions listed with sources, editable by both users.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Three interconnected financial models are available at Stage 03: MVP
  Cost Model, Unit Economics Model, and Market Sizing Model. Claude
  generates initial inputs based on the venture record and external
  market research. Both Founder and Venture Lead can view, annotate,
  challenge, and correct all models. All assumptions are listed
  explicitly with sources cited --- the model is fully transparent.*

  -----------------------------------------------------------------------

**10.1 Model 1 --- MVP Cost Model**

Purpose: Estimate the cost of building and launching the MVP. Informs
the Investment Memo capital ask.

  -----------------------------------------------------------------------
  **Field**       **Detail**
  --------------- -------------------------------------------------------
  Input Sources   Claude reads solution description, technical complexity
                  signals, team data from Idea Intake, and VL inputs.
                  External salary and rate benchmarks sourced from
                  AI_RESEARCH with citations (e.g. specific survey or
                  report for developer rates in this geography).

  Cost Categories Product & Engineering (Frontend, Backend, AI/ML,
                  DevOps, QA --- estimated in person-months with blended
                  rate) · Design (UX/UI, user research, prototyping) ·
                  Data (acquisition, labelling, synthetic data creation)
                  · Infrastructure (cloud, APIs, security --- monthly
                  recurring annualised) · GTM for MVP Phase (cost to
                  secure first 3 design partners) · Operations (legal,
                  compliance, admin, studio overhead allocation) ·
                  Contingency (10--20% buffer on engineering ---
                  adjustable)

  Scenarios       Conservative · Base · Aggressive --- VL toggles between
                  them; all three visible simultaneously as a range

  Founder Access  Full access --- can view all line items, annotate any
                  estimate with FOUNDER-tagged correction, flag
                  unrealistic assumptions

  VL Access       Can edit any line item --- changes tagged VL with a
                  note field

  Output          Total cost range by scenario · Monthly burn rate across
                  the MVP build period · Capital efficiency metric (cost
                  per design partner secured) · Comparison to Stage 04
                  capital commitment range (\$500K--\$1M) with a clear
                  signal on whether the ask is in range
  -----------------------------------------------------------------------

**10.2 Model 2 --- Unit Economics Model**

  -----------------------------------------------------------------------
  v2 Update: Claude can now use market average research as a source for
  benchmarks --- tagged AI_RESEARCH with citations (e.g. Bessemer SaaS
  benchmarks, SaaS Capital churn data). Assumptions section added ---
  fully transparent, editable by both users, with sources cited for every
  assumption.

  -----------------------------------------------------------------------

Purpose: Model the fundamental unit economics of the business to assess
long-term viability.

  -----------------------------------------------------------------------
  **Input**           **Default Source**          **Can Be Overridden
                                                  By**
  ------------------- --------------------------- -----------------------
  Average Contract    FOUNDER (from intake) or    VL or Founder
  Value (ACV)         AI_RESEARCH (market         
                      benchmarks for this SaaS    
                      category with citation)     

  Gross Margin %      AI_RESEARCH (industry       VL or Founder
                      benchmarks for this type of 
                      SaaS/service, cited by      
                      source) + AI_SYNTHESIS      

  Sales Cycle         FOUNDER (from intake) or    VL or Founder
  (months)            AI_RESEARCH (benchmark by   
                      deal size and segment,      
                      cited)                      

  Customer            VL input + AI_RESEARCH (CAC VL
  Acquisition Cost    benchmarks by segment and   
                      deal size, cited)           

  Customer Success    VL input + AI_RESEARCH (CS  VL
  Cost                cost benchmarks, cited)     

  Annual Churn Rate   AI_RESEARCH (churn          VL or Founder
                      benchmarks by category and  
                      ACV tier, cited --- e.g.    
                      SaaS Capital Annual Report) 

  Expansion Revenue   AI_RESEARCH (NRR benchmarks VL or Founder
  Rate                by SaaS category, cited)    

  Payback Period      AI_RESEARCH (benchmarks:    VL
  Target              good = under 18 months for  
                      enterprise SaaS, cited)     
  -----------------------------------------------------------------------

**Assumptions Section --- Transparent and Editable**

  -----------------------------------------------------------------------
  *Every financial model includes a dedicated Assumptions section visible
  to both users immediately below the model inputs. This makes the model
  fully transparent and defensible --- every number can be traced to its
  source and challenged.*

  -----------------------------------------------------------------------

-   Every assumption listed explicitly --- no hidden defaults

-   Source of each assumption shown: FOUNDER / VL / AI_RESEARCH (with
    full citation) / AI_SYNTHESIS

-   Confidence rating per assumption: High (direct evidence) / Medium
    (market benchmark) / Low (estimated)

-   Edit field next to every assumption --- any user can update it with
    their own figure plus a note explaining why

-   All updates tagged with the user\'s role (FOUNDER or VL) and
    timestamp

-   When any assumption is updated, the model recalculates automatically
    and the change is logged

**Calculated Outputs**

-   LTV (Lifetime Value) --- formula shown

-   LTV:CAC ratio --- with benchmark comparison: good \>3x, great \>5x
    (benchmark source cited)

-   CAC Payback Period --- in months with benchmark (source cited)

-   Unit contribution at scale --- at 50, 100, and 500 customers

-   Rule of 40 score

-   Break-even customer count --- number of customers needed to cover
    fixed costs

-   Sensitivity analysis --- top 3 inputs with largest impact on
    LTV:CAC, shown as a ranked list

**10.3 Model 3 --- Market Sizing Model**

  -----------------------------------------------------------------------
  v2 Update: Assumptions section added in the same format as Unit
  Economics. All top-down market data from AI_RESEARCH with full source
  citations including specific report names, publishers, and dates.

  -----------------------------------------------------------------------

Purpose: Build a defensible TAM/SAM/SOM from first principles using both
top-down and bottom-up methodologies.

  -----------------------------------------------------------------------------
  **Methodology**   **Inputs**                   **Sources**
  ----------------- ---------------------------- ------------------------------
  Top-Down          Industry market size from    AI_RESEARCH --- Claude cites
                    published reports · Sector   specific reports with title,
                    CAGR · Penetration rate      publisher, year, and URL (e.g.
                    assumptions                  \'Gartner Market Guide for
                                                 Integration Technology,
                                                 2024\')

  Bottom-Up         ICP definition from Idea     AI_SYNTHESIS + FOUNDER
                    Intake · Estimated total     
                    addressable customer count · 
                    ACV from Unit Economics      
                    model                        
  -----------------------------------------------------------------------------

**Assumptions Section (same format as Unit Economics)**

-   Every assumption listed: market size source, CAGR source,
    penetration rate rationale, ICP count methodology

-   All AI_RESEARCH assumptions carry full citations: report title,
    publisher, year, URL

-   Editable by both VL and Founder with role-tagged updates

-   Confidence rating per assumption

**Outputs**

-   TAM → SAM → SOM funnel visual with dollar values

-   Methodology footnote --- visible in the Investment Memo when this
    section is pulled in; makes the sizing defensible in a committee
    meeting

-   Confidence rating on each figure based on evidence quality

-   Consistency check: flags if top-down and bottom-up SOM are more than
    3x apart --- prompts VL to reconcile

**11. Feature: Interview Insights**

  -----------------------------------------------------------------------
  v2 Update: Word document (.docx) upload now explicitly supported.
  Validation tags from interviews propagate into all other documents and
  features --- claims show \'Validated by Client Interview\', \'Validated
  by VC Interview\', etc. wherever they appear. Both Founder and VL can
  upload.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Interview Insights synthesises qualitative signals from external
  conversations --- client discovery calls, VC meetings, expert
  interviews. It extracts structured insights, identifies patterns across
  multiple interviews, and applies validation tags that propagate across
  all features and documents in the venture record. Every claim in every
  document can show whether it has been externally validated.*

  -----------------------------------------------------------------------

**11.1 Supported Upload Methods**

-   Word document (.docx) --- most common; Claude extracts and processes
    the full text

-   Plain text (.txt) or Markdown (.md) transcript files

-   Paste raw transcript directly into the input field

-   Structured manual entry --- VL or Founder fills in key quotes and
    observations via a guided form

-   Both Founder and VL can upload --- each upload tagged with the
    uploader\'s role

**11.2 Interview Metadata (Required Per Upload)**

  ------------------------------------------------------------------------
  **Field**          **Description**          **Options**
  ------------------ ------------------------ ----------------------------
  Interviewee Role   Type of person           Prospect · Client · VC ·
                     interviewed              Expert · Partner ·
                                              Competitor · Other

  Interviewee        Company name --- used in Free text
  Company            validation tag sub-label 

  Interview Date     When the conversation    Date picker
                     happened                 

  Conducted By       Who ran the interview    Founder · Venture Lead

  Interview Type     Nature of the            Discovery call · Validation
                     conversation             interview · Expert interview
                                              · Investor call · Design
                                              partner session
  ------------------------------------------------------------------------

**11.3 Extraction Output Per Interview**

Claude processes each upload and returns structured data:

-   Pain points mentioned --- verbatim quote + paraphrase + which of the
    10 Idea Intake dimensions this validates or contradicts

-   Current workarounds described

-   Willingness-to-pay signals --- direct or indirect

-   ICP match assessment --- does this interviewee match the venture\'s
    defined ICP?

-   Feature requests or expectations raised

-   Objections or hesitations

-   Key quotes suitable for use in pitch materials

-   Overall signal quality: Strong / Moderate / Weak

**11.4 Validation Tag Propagation --- Across All Documents and
Features**

  -----------------------------------------------------------------------
  *This is the integration layer that makes Interview Insights
  system-wide. When an interview validates or contradicts a claim already
  in the venture record, a validation tag is applied to that claim ---
  and it appears on that claim everywhere it surfaces in the system.*

  -----------------------------------------------------------------------

-   In the Idea Intake progress dashboard: dimensions with client
    interview backing show a CLIENT_INTERVIEW badge

-   In the Business Brief: each substantive claim shows its validation
    status inline

-   In the Pitch Deck: slide content shows validation badges on key
    claims

-   In the Investment Memo: every major assertion shows validation
    evidence in a footnote or inline badge

-   In Scoring outputs: scoring justifications reference interview
    validation where it exists

-   In Competitor Analysis: competitor claims that have been validated
    or contradicted by a client interview show the tag

Validation tag types:

-   Validated by Client Interview \[Company\] --- shown in green, tagged
    CLIENT_INTERVIEW

-   Validated by VC Interview \[Firm\] --- shown in indigo, tagged
    VC_INTERVIEW

-   Validated by Expert Interview \[Role\] --- shown in purple, tagged
    EXPERT_INTERVIEW

-   Contradicted by Client Interview \[Company\] --- shown in amber with
    warning icon; flags the claim for review

-   Unvalidated --- no external interview has addressed this claim yet;
    shown in muted grey

**11.5 Cross-Interview Synthesis (3+ interviews)**

-   Themes by frequency --- points mentioned by 2 or more interviewees,
    ranked by count

-   Contradictions --- where different interviewees said materially
    different things

-   Comparison against Idea Intake --- flags where interview evidence
    agrees or diverges from founder\'s original claims

-   Signal Quality Assessment --- how strong is the collective body of
    evidence?

-   Top 5 verbatim quotes --- selected for use in pitch materials

**12. Feature: Strategy & Moat**

  -----------------------------------------------------------------------
  v2 Update: Shark Tank personas can now be used within this feature to
  pressure test strategy and moat choices. Claude acts as a strategic
  collaborator --- advising on which moats are most viable for this
  specific idea, not just evaluating what is already proposed. Founder
  has full access but cannot delete existing entries.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *The Strategy & Moat workspace is where the Founder and Venture Lead
  develop the venture\'s long-term competitive position together. Claude
  is a strategic collaborator here --- it recommends which moat types are
  most achievable for this specific idea, explains why with cited
  examples, and can be used with Pressure Test personas to challenge
  strategy choices before they are tested in the market.*

  -----------------------------------------------------------------------

**12.1 User Access**

-   Founder: can add insights, tag moats, contribute to strategy
    narrative, use personas for strategy challenges --- cannot delete
    existing entries

-   Venture Lead: full access --- can edit, delete, annotate, and
    generate the final strategy summary

-   Both users\' contributions are role-tagged with timestamps

**12.2 Claude as Strategic Collaborator**

  -----------------------------------------------------------------------
  *\'Which moats work best for this idea?\' is a first-class interaction
  in this feature. Claude reviews the venture\'s business model, ICP,
  solution, and revenue model --- then recommends 2--3 moat types that
  are genuinely achievable given this specific venture\'s
  characteristics. It cites comparable businesses that have successfully
  built each moat type, tagged AI_RESEARCH. Both users can discuss the
  recommendations in a chat thread directly on the strategy page.*

  -----------------------------------------------------------------------

-   \'Recommend moats for this idea\' button triggers a Claude analysis
    returning: recommended moat types (2--3), rationale specific to this
    business model, comparable business examples (with citations), and
    what must be true for each moat to actually build

-   Claude flags any moat claims already in the venture record that are
    not supported by the business model --- e.g. \'You have claimed
    network effects, but your ICP profile suggests single-player use ---
    this needs to be addressed\'

-   Chat thread: both users can discuss, push back, and explore the
    recommendations with Claude in a live conversation

**12.3 Persona Strategy Pressure Test**

Any of the 6 Shark Tank personas can be activated within Strategy & Moat
to challenge the strategy specifically:

-   \'Challenge my moat strategy\' --- persona reviews the current moat
    assessment and asks the hardest questions about defensibility in
    18--36 months

-   \'Challenge my competitive position\' --- persona reviews competitor
    analysis and strategy narrative and identifies contradictions

-   \'Give me moat advice\' --- persona shifts from adversarial to
    advisory, recommending which moats they would prioritise building
    first and why

-   Strategy session insights can be added to the venture record using
    the same end-of-session integration flow as the main Pressure Test

-   Strategy pressure test sessions stored separately: tagged
    PRESSURE_TEST (Strategy) to distinguish from main product pressure
    tests

**12.4 The 8 Moat Types**

*Research basis: Hamilton Helmer \'7 Powers\' (2016); Porter\'s Five
Forces; Sequoia moat analysis framework; a16z network effects taxonomy;
Buffett economic moat concept*

  ------------------------------------------------------------------------------------
  **Moat Type**         **Definition**     **Best For**           **Typical Build
                                                                  Timeline**
  --------------------- ------------------ ---------------------- --------------------
  Data Network Effects  Product improves   AI/ML products with    Strong after 18--36
                        as more customers  proprietary training   months
                        use it ---         data from usage        
                        creating a data                           
                        advantage                                 
                        incumbents cannot                         
                        replicate                                 

  Network Effects       Product is more    Marketplaces,          Strong after
  (Direct)              valuable when more collaboration tools,   critical mass
                        users are on the   communication          threshold
                        same platform      platforms              

  Switching Costs       Moving to a        Workflow tools, data   Builds with each
                        competitor         platforms, systems of  contract renewal
                        requires           record                 cycle
                        significant time,                         
                        money, or                                 
                        operational                               
                        disruption                                

  Scale Economics       Unit costs         Infrastructure-heavy   Strong at
                        decrease           products, services     approximately 10x
                        meaningfully as    with labour leverage   current scale
                        volume increases                          
                        --- creating a                            
                        durable cost                              
                        advantage                                 

  Regulatory /          Regulatory         Healthcare, finance,   Immediate if already
  Compliance Moat       requirements or    legal,                 present --- long to
                        certification      government-adjacent    build if not
                        processes create   products               
                        barriers that                             
                        competitors must                          
                        spend significant                         
                        time and money to                         
                        clear                                     

  Brand / Trust         Customers pay a    B2B in high-stakes     Long-term build ---
                        premium or default decisions,             3+ years minimum
                        to this vendor     professional services  
                        based on trust in  adjacency, regulated   
                        a high-stakes      industries             
                        decision category                         

  Counter-Positioning   The incumbent      Businesses whose model Fragile but powerful
                        cannot copy        directly threatens the --- requires careful
                        without materially incumbent\'s existing  positioning
                        disrupting their   revenue                
                        own business model                        
                        or revenue streams                        

  Proprietary Process / A method,          Deep tech, unique      Immediate if valid
  IP                    workflow, or piece methodology,           --- requires IP
                        of IP that is      defensible algorithms  counsel validation
                        genuinely novel,                          
                        protectable, and                          
                        difficult to                              
                        reverse-engineer                          
  ------------------------------------------------------------------------------------

**13. Feature: Design Partner Scorecard**

  -----------------------------------------------------------------------
  v2 Update: Founder can now add design partner candidates. LinkedIn
  profile URL input enables AI-assisted candidate scoring before any
  conversation. Both users can add candidates and see the full pipeline.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *The Design Partner Scorecard manages the complete design partner
  pipeline from identification to signed agreement. The studio
  methodology requires 3 signed design partners before advancing from
  Stage 04. Both Founder and Venture Lead can identify and add
  candidates. LinkedIn URL input enables AI-assisted pre-scoring before a
  single conversation has occurred.*

  -----------------------------------------------------------------------

**13.1 Candidate Input --- LinkedIn URL**

-   When adding any candidate, either user can paste a LinkedIn profile
    URL for the primary contact

-   Claude extracts from the public profile: contact name, current
    title, company, industry, company size, career background, and any
    relevant signals

-   Contact\'s decision authority assessed based on title and
    organisational context

-   Company\'s likely pain acuteness assessed based on industry, company
    size, and any signals in their public profile

-   This pre-populates several scoring dimensions before any
    conversation has occurred

-   All LinkedIn-derived data tagged AI_RESEARCH and labelled \'From
    LinkedIn profile --- verify in conversation\'

**13.2 Founder Candidate Submission**

-   Founder can add design partner candidates from their own network
    directly in the feature

-   Founder inputs: company name, contact name and title, LinkedIn URL
    (optional), and why they believe this is a strong fit

-   All founder-submitted candidates tagged FOUNDER --- VL receives a
    notification to review

-   VL can approve (add to active pipeline), request more information,
    or decline with a note

**13.3 Qualification Scoring Rubric**

*Research basis: Blank Customer Development methodology; a16z design
partner best practices; Christensen JTBD; Mach49 co-creation
methodology*

  ------------------------------------------------------------------------
  **Dimension**       **What is Scored**                      **Weight**
  ------------------- --------------------------------------- ------------
  ICP Match           How precisely does this company match   20%
                      the venture\'s ICP across all           
                      dimensions --- industry, size, buyer    
                      role, pain acuteness?                   

  Pain Acuteness      Is the problem genuinely acute for this 15%
                      organisation right now? Is there budget 
                      and urgency in the current quarter?     

  Willingness to Pay  Has willingness to pay been signalled   15%
                      --- even informally? Is there an        
                      existing budget line this could draw    
                      from?                                   

  Decision Authority  Does the contact have or can they       15%
                      access the authority to sign a design   
                      partner agreement and commit company    
                      resources?                              

  Data & Access       Can this partner provide the data,      15%
                      workflows, or user access that a 5-day  
                      POC sprint would require?               

  Referencability     Would this partner publicly reference a 5%
                      successful pilot? Do they have brand    
                      value that validates the category?      

  Strategic Fit       Does this partner\'s success story      5%
                      support the venture\'s broader GTM      
                      narrative and ICP proof for future      
                      customers?                              

  Engagement          How proactive and responsive has the    10%
  Enthusiasm          contact been so far --- even before a   
                      formal meeting?                         
  ------------------------------------------------------------------------

Output: 8 dimension scores (1--5 each) + weighted total (100 points
max) + qualification verdict (Strong Candidate / Conditional / Low
Priority / Disqualify) + 3-sentence engagement recommendation specifying
the next concrete action. Tagged SCORING (Design Partner).

**13.4 Pipeline Stages and Views**

  -----------------------------------------------------------------------
  **Stage**          **Definition**
  ------------------ ----------------------------------------------------
  Identified         Candidate added --- not yet contacted

  Outreach Sent      First outreach email sent (VL marks after using
                     outreach draft tool)

  Response Received  Candidate responded

  Conversation       Substantive conversation occurred --- notes logged

  LOI                Letter of intent signed or verbal commitment
                     received

  Signed             Design partner agreement signed --- counts toward
                     the 3/3 goal
  -----------------------------------------------------------------------

-   Candidate list: all candidates ranked by weighted qualification
    score

-   Pipeline funnel: candidate counts at each stage; \'X/3 Signed\' goal
    tracker prominent in green (3 signed) or amber (less than 3)

-   Comparison view: radar charts for up to 3 candidates side by side

-   Outreach draft generator: one-click per candidate --- generates
    personalised outreach email via Claude using the venture value
    proposition and the candidate\'s specific profile

**14. Output: Investment Memo**

  -----------------------------------------------------------------------
  v2 Update: Renamed from \'Investment Business Case\'. This is the full
  incubation document for the Investment Committee. Word .docx only (no
  PDF). 10--20 pages. Synthesises everything accumulated across the full
  incubation phase.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *The Investment Memo is the definitive document that captures
  everything a senior leader needs to know about this venture after full
  incubation. It synthesises all accumulated venture data --- Idea
  Intake, scoring, competitor analysis, financial models, interview
  insights, strategy and moat, pressure test outcomes --- into a single,
  rigorous narrative. It is the primary document for the Investment
  Committee capital decision at the end of Stage 03.*

  -----------------------------------------------------------------------

**14.1 When to Generate**

-   Generated at the end of Stage 03 --- Incubate, when the full
    incubation body of work has been completed

-   VL triggers generation from the Outputs tab --- Founder is notified
    when it is available

-   Can be re-generated as the record is updated --- each version stored
    with timestamp

-   Capital Gate: Investment Memo must be generated and reviewed before
    Stage 04 advancement is permitted

**14.2 Section Structure (10--20 pages)**

  ---------------------------------------------------------------------------------
  **Section   **Section Name**  **Content**                           **Max
  \#**                                                                Length**
  ----------- ----------------- ------------------------------------- -------------
  01          Executive Summary 3 paragraphs: the opportunity and why 1 page
                                it matters now, the key evidence      
                                accumulated during incubation, and    
                                the investment recommendation. No     
                                jargon --- readable by a senior       
                                leader in 2 minutes.                  

  02          Opportunity       What is the venture, why it exists,   1--2 pages
              Overview + Why    and what specific market, technology, 
              Now               or regulatory shift creates the       
                                timing window now. Why Now is         
                                integrated here --- not a separate    
                                section.                              

  03          Problem & Market  Quantified pain with interview        1--2 pages
              Opportunity       validation tags · TAM/SAM/SOM from    
                                the Financial Models with full        
                                methodology citation · Market CAGR    
                                and growth drivers from AI_RESEARCH   
                                sources · Sector context and timing   
                                rationale.                            

  04          Solution &        What the product does · What makes it 1 page
              Differentiation   defensible against current            
                                alternatives · What it explicitly     
                                does not do · The 10x improvement     
                                claim with evidence cited.            

  05          Ideal Customer    Precise ICP in detail ·               1/2--1 page
              Profile           Decision-making unit · Buying trigger 
                                · Willingness-to-pay evidence from    
                                interviews tagged CLIENT_INTERVIEW.   

  06          Revenue Model &   Pricing · Gross margin structure ·    1 page
              Unit Economics    LTV/CAC and payback period from the   
                                Unit Economics model · Path to        
                                profitability · Capital efficiency    
                                curve.                                

  07          Competitive       Current alternatives and their        1 page
              Landscape         limitations · Competitive white space 
                                · Moat strategy from Strategy & Moat  
                                workspace · Differentiation claims    
                                with evidence.                        

  08          Validation        All traction signals to date ---      1 page
              Evidence          ranked by strength (paid \> LOI \>    
                                verbal commitment \> discovery call   
                                \> inbound interest) · Interview      
                                validation tags propagated on every   
                                claim · Design partner pipeline       
                                status.                               

  09          Risk Register     Top 5 risks across: market /          1 page
                                technical / organisational /          
                                financial / execution. Each risk      
                                rated: likelihood (H/M/L) · impact    
                                (H/M/L) · mitigation strategy ·       
                                residual risk.                        

  10          Stage 04 Plan &   Capital ask with use of funds         1 page
              Investment        breakdown · Design partner pipeline   
              Recommendation    current status and path to 3 signed · 
                                Stage 04 milestones that unlock Stage 
                                05 capital · Overall verdict: Approve 
                                / Approve with Conditions / Defer /   
                                Kill.                                 
  ---------------------------------------------------------------------------------

**14.3 Format and Features**

-   Format: Word (.docx) --- not PDF

-   Source tags rendered inline throughout --- AI_RESEARCH citations as
    clickable footnote superscripts

-   Interview validation tags propagated throughout --- every major
    claim shows its external validation status

-   Gap Alerts: amber callout boxes on sections with thin evidence ---
    link to the relevant Idea Intake dimension

-   Conditions Tracker: if verdict is \'Approve with Conditions,\'
    extracted conditions render as a checklist in the venture record
    overview tab --- VL tracks completion

-   VL can edit any section inline before export --- all edits tagged VL

-   Version history maintained --- all generated versions accessible
    from the Outputs tab

-   Both Founder and VL can download

**15. Output: Pitch Deck**

  -----------------------------------------------------------------------
  v2 Update: Pitch Deck generated at end of Stage 03 --- Incubate. Not
  available at Stage 02. Generated from the full incubation data, not
  just the Idea Intake.

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *The Pitch Deck is a 12-slide visual narrative generated from the full
  accumulated venture record at the end of the Incubate phase. It is
  designed for the Investment Committee or potential partners. The VL
  selects audience and purpose before generation. Every slide cites its
  source data.*

  -----------------------------------------------------------------------

**15.1 Audience and Purpose Options**

  -----------------------------------------------------------------------
  **Audience**                        **Purpose**
  ----------------------------------- -----------------------------------
  Studio Investment Committee         Stage Gate Advancement

  Design Partner / Potential Client   Design Partner Recruitment

  External VC / Co-investor           Investment Ask

  Executive Sponsor                   Internal Alignment
  -----------------------------------------------------------------------

**15.2 12-Slide Structure**

  ------------------------------------------------------------------------------
  **Slide   **Title**     **Content Sources**
  \#**                    
  --------- ------------- ------------------------------------------------------
  01        The Hook      One-sentence problem statement --- no context needed
                          to understand the pain. From Idea Intake dimension 02.

  02        The Problem   Quantified pain: who, how often, what it costs ---
                          with interview validation tags where available. From
                          dimensions 02 + Interview Insights.

  03        Why Now       The specific market/tech/regulatory unlock that
                          creates the window today. AI_RESEARCH citations shown.
                          From dimension 07.

  04        The Solution  What it does, what makes it different, what it does
                          not do. From dimension 04.

  05        Product       3-year roadmap headline --- where this goes and what
            Vision        it becomes. From Strategy & Moat + dimension 04.

  06        Ideal         Precise ICP --- firmographic and behavioural. From the
            Customer      ICP document generated in Stage 02.
            Profile       

  07        Business      Revenue model, pricing, unit economics snapshot. From
            Model         Financial Models --- Unit Economics.

  08        Market        TAM/SAM/SOM with sizing methodology and source
            Opportunity   citations. From Financial Models --- Market Sizing.

  09        Competitive   Current alternatives, their limitations, white space,
            Landscape     and differentiation. From Competitor Analysis.

  10        Traction &    All evidence ranked by signal strength. Interview
            Validation    validation tags shown on every validated claim.

  11        The Team      Founder and key team members --- relevant background
                          and domain expertise. Known gaps named directly. From
                          dimension 08.

  12        The Ask       Capital requested · Use of funds breakdown · Stage 04
                          milestones that must be hit.
  ------------------------------------------------------------------------------

**15.3 Deck UI and Features**

-   Slide-preview layout --- each slide as a card with title, body
    content, and expandable speaker notes

-   Source panel per slide: which source tags and citations informed
    this slide --- expandable

-   Deck Completeness Score: X/12 slides fully sourced --- gaps link to
    the relevant Idea Intake dimension

-   VL can edit any slide inline --- edits tagged VL

-   Regenerate single slide with a specific instruction: \'Make the
    market sizing slide simpler\'

-   Generate variant for a different audience without rebuilding from
    scratch

-   Export as PowerPoint (.pptx) --- both Founder and VL can download

-   Version history maintained --- all generated versions accessible
    from the Outputs tab

**16. Stage 04 Feature Outputs**

**16.1 Design Partner Feedback Summary**

  -----------------------------------------------------------------------
  *Synthesised from: design partner conversation notes, uploaded
  interview transcripts (.docx supported), VL session notes. Identifies
  what design partners collectively said about the problem, the proposed
  solution, what\'s missing, and what they most want in the MVP.*

  -----------------------------------------------------------------------

-   Claude identifies: common themes across all design partners ·
    divergent feedback between partners · strongest use case signals ·
    product gaps raised most frequently

-   Each finding tagged DESIGN_PARTNER with the specific partner company
    as sub-tag

-   Validation tags propagated: claims validated by design partner
    interviews show CLIENT_INTERVIEW tags in the venture record

-   Formatted as a structured report --- exportable as Word .docx

**16.2 MVP Feature Generator**

-   Reads: Design Partner Feedback Summary + solution description from
    Idea Intake

-   Generates a ranked MVP feature list: features ranked by design
    partner request frequency and strategic importance to the core
    solution

-   Per feature: name · description · which design partner(s) requested
    it · MoSCoW priority (Must Have / Should Have / Nice to Have) ·
    estimated complexity (Low / Medium / High)

-   Output feeds directly into Stage 05 Feature PRD Generator

-   Both Founder and VL can add features manually --- tagged FOUNDER or
    VL respectively

**17. Stage 05 Feature Outputs**

  -----------------------------------------------------------------------
  *All Stage 05 outputs are AI-generated starting points from the
  accumulated venture record. They are designed for the technical and
  product team to refine --- not final specifications. All outputs are
  editable and source-tagged.*

  -----------------------------------------------------------------------

**17.1 Draft Technical Architecture**

-   Claude reads: solution description, technology requirements from
    Idea Intake, MVP feature list from Stage 04

-   Generates: recommended technology stack · component diagram
    description · integration points with external systems · key
    technical decisions with rationale · risks and open questions

-   Tagged AI_SYNTHESIS --- clearly labelled as a starting point for the
    technical team

-   Editable by VL --- all edits tagged VL

-   Exported as Word .docx

**17.2 Product Roadmap**

-   Three phases: MVP (Stage 06) · V1 Commercial (Stage 07) · V2 Scale
    (Post-Stage 07)

-   Per phase: milestone definition · key features in scope · success
    criteria · capital requirement aligned to the stage framework

-   Auto-populated from Stage 04 MVP features and Stage 05 architecture
    outputs

-   VL can edit phases, milestones, and feature assignments

-   Exported as Word .docx

**17.3 Feature PRDs**

-   One-page Feature Requirement Document per MVP feature from the
    ranked feature list

-   Per PRD: feature name · user story · acceptance criteria · in-scope
    and out-of-scope definition · dependencies · design partner origin
    (which partner\'s feedback drove this feature)

-   AI-generated from the feature list and design partner feedback
    summary

-   Editable by VL and product team --- all edits tagged VL

-   Exported as individual Word .docx files or as a single compiled
    document

**17.4 Sprint Plan**

-   Structured sprint-by-sprint execution plan for the MVP build phase

-   Based on: feature PRDs, estimated complexity ratings, and typical
    build team velocity assumptions

-   Per sprint: sprint number · duration (default 2 weeks) · features in
    scope · definition of done · acceptance criteria

-   Assumptions section included --- lists velocity assumptions and
    their sources, editable

-   Designed as a starting point --- the actual build team owns and
    refines the final sprint plan

-   Exported as Word .docx

**18. Stage 06 Feature: Pricing Lab**

  -----------------------------------------------------------------------
  *Pricing Lab is introduced in Stage 06 to test and validate pricing
  during the live pilot phase. The goal is to arrive at a commercially
  defensible pricing structure before Stage 07 market entry. Outputs from
  Pricing Lab feed directly into the Stage 07 Pricing Implementation
  Tracker.*

  -----------------------------------------------------------------------

**18.1 Inputs**

-   VL inputs: proposed pricing tiers · pilot client reactions to
    pricing · willingness-to-pay signals from client interviews ·
    competitor pricing data from Competitor Analysis

-   Claude inputs: market pricing benchmarks for comparable SaaS
    products tagged AI_RESEARCH with citations

-   Founder inputs: their instinct on pricing with rationale --- tagged
    FOUNDER

**18.2 Assumptions Section**

Same format as the Financial Models assumptions section:

-   Every pricing assumption listed explicitly with source (FOUNDER / VL
    / AI_RESEARCH / CLIENT_INTERVIEW)

-   Confidence rating per assumption

-   Editable by both users with role-tagged updates

-   Model recalculates when assumptions change

**18.3 Claude Synthesis and Recommendation**

-   Claude reviews all inputs and synthesises: what the market can bear
    based on external benchmarks, what pilot clients have indicated, and
    what the unit economics require for the business to work

-   Returns a pricing recommendation: recommended tier structure ·
    specific price points · discounting policy · rationale for each
    decision

-   Recommendation tagged AI_SYNTHESIS --- VL and Founder can provide
    feedback and Claude revises

-   All cited benchmarks and comparables tagged AI_RESEARCH with full
    citations

**18.4 Output**

-   Pricing recommendation document exported as Word .docx

-   Feeds into Stage 07 Pricing Implementation Tracker as the
    authoritative pricing reference

-   Version history maintained --- each pricing recommendation run
    stored with timestamp

**19. Venture Lead Dashboard**

  -----------------------------------------------------------------------
  *The Portfolio Dashboard is accessible to the Venture Lead only.
  Founders do not have a dashboard --- they access only their own
  venture\'s detail view. The dashboard provides a full portfolio
  pipeline view and the weekly portfolio report for the Investment
  Committee.*

  -----------------------------------------------------------------------

**19.1 Portfolio Pipeline --- Kanban View**

Stage-based kanban showing all active ventures across all 7 stages.

**Venture Card Fields**

-   Venture name · Stage badge (S01--S07, colour-coded) · Founder name ·
    Status: On Track / At Risk / Blocked

-   Composite scoring signal: Advance / Caution / Revisit / Kill (shown
    if scoring has been run)

-   Last updated timestamp

-   Quick indicators: Idea Intake complete? · Scoring run? · Business
    Brief? · Investment Memo? · Pitch Deck? · Design Partners: X/3
    signed (Stage 04+)

-   Click any card to open the full Venture Detail Panel

**19.2 Venture Detail Panel --- Tab Structure**

  -------------------------------------------------------------------------
  **Tab**       **Contents**                         **Founder Access**
  ------------- ------------------------------------ ----------------------
  Overview      Summary · Stage · Founder details ·  No --- VL only
                Capital commitment · Key activities  
                checklist · VL Notes field           

  Idea Intake   Full chat transcript · 10-dimension  Read + view dimensions
                progress dashboard · Dimension       
                summaries · VL annotations on any    
                message                              

  Scoring       Three scoring tiles · Combined Score View all scores and
                Summary · Score history by run       rationale

  Pressure Test All persona sessions · Post-session  View + participate
                summaries · Unresolved               
                vulnerabilities · Insight            
                integration log                      

  Competitors   Competitor table · Positioning map · Full access + comments
                Differentiation matrix · Founder     
                comments visible                     

  Financials    MVP Cost · Unit Economics · Market   Full access + feedback
                Sizing --- all 3 with assumptions    
                sections                             

  Interview     All uploaded interviews · Extraction Upload + view
  Insights      outputs · Cross-interview synthesis  

  Strategy &    Moat assessment · Development        Full access --- no
  Moat          roadmap · Persona strategy sessions  delete
                · AI recommendations                 

  Design        Candidate pipeline · Qualification   Add candidates + view
  Partners      scores · Funnel tracker · Outreach   
                log                                  

  Outputs       Business Brief · Investment Memo ·   View + download all
                Pitch Deck · Stage-specific outputs  
                --- all with version history and     
                download buttons                     

  Source Audit  Full provenance log · Feedback       View citations
                history · Citation verification ·    throughout
                Validation tag log                   
  -------------------------------------------------------------------------

**19.3 Stage Advancement**

-   \'Advance to Stage X\' button on the Overview tab --- VL only

-   Confirmation dialogue: shows expected outputs for the current stage
    and asks VL to confirm which have been completed --- soft validation
    (warns but does not hard-block)

-   Stage-specific gates:

    -   Stage 02 → 03: prompts confirmation that Business Brief has been
        generated and shared with founder

    -   Stage 03 → 04: requires Investment Memo to have been generated;
        prompts review confirmation

    -   Stage 04 → 05: prompts confirmation that 3 design partners are
        signed --- shows current status

-   Advancement logged with date and VL name in stage history ---
    visible in Source Audit

**19.4 Weekly Portfolio Report**

Generated via Claude API --- accessible from the top navigation bar at
all times.

  -----------------------------------------------------------------------
  **Section**         **Content**
  ------------------- ---------------------------------------------------
  Portfolio Snapshot  Total active ventures · Stage distribution ·
                      Advances this week · At Risk / Blocked count

  Venture Summaries   One summary per venture: stage, status, this
                      week\'s activity, key blockers, scoring signal,
                      recommended next action

  IC Actions Required Explicit decisions the committee must make ---
                      stage approvals, capital authorisation, kill
                      decisions. Rendered with Accept / Defer / Discuss
                      buttons --- selections logged in Source Audit.

  Portfolio Health    Momentum: Accelerating / Steady / Decelerating ·
  Signal              Concentration risk across stages · Capital
                      deployment pace

  Key Risks This Week Top 3 cross-portfolio risks with recommended
                      mitigations

  Upcoming Milestones Stage gates, deliverables, design partner
                      commitments due in next 2 weeks

  VL Observations     Freeform VL commentary added before generation ---
                      tagged VL
  -----------------------------------------------------------------------

-   Pre-flight check: flags any ventures not updated in 7 or more days
    before report generation

-   Export as PDF --- formatted for email and print distribution to the
    Investment Committee

-   Report archive: all generated reports stored with date ---
    accessible from dashboard sidebar

**20. Technical Specification**

**20.1 Architecture Decisions**

  -------------------------------------------------------------------------------
  **Concern**     **Decision**               **Notes**
  --------------- -------------------------- ------------------------------------
  Frontend        React + TypeScript +       Initialise via web-artifacts-builder
                  Tailwind CSS + shadcn/ui   skill

  State           React useState +           No localStorage, no sessionStorage,
                  useContext                 no backend --- all in memory

  AI              Anthropic API ---          All features via live API --- zero
                  claude-sonnet-4-20250514   mocking

  Charts          Recharts                   RadarChart for scoring tiles, funnel
                                             for design partner pipeline, bar for
                                             financials

  File Exports    pptxgenjs (.pptx) ·        All exports client-side --- no
                  docx-js (.docx)            server required

  Voice Input     Web Speech API             Transcription shown in input field
                  (browser-native)           before submission --- founder
                                             reviews and edits

  Bundling        Parcel → single HTML       Via web-artifacts-builder bundling
                  bundle                     script
  -------------------------------------------------------------------------------

**20.2 Core TypeScript Interfaces**

  -----------------------------------------------------------------------
  *Build these types first --- everything else in the system depends on
  them. type SourceTag = \'FOUNDER\' \| \'VL\' \| \'AI_SYNTHESIS\' \|
  \'AI_RESEARCH\' \| \'CLIENT_INTERVIEW\' \| \'VC_INTERVIEW\' \|
  \'EXPERT_INTERVIEW\' \| \'PRESSURE_TEST\' \| \'SCORING\' \|
  \'COMPETITOR\' \| \'FINANCIAL\' \| \'DESIGN_PARTNER\' \| \'FEEDBACK\';
  interface ExternalCitation { title: string; url?: string;
  publicationDate?: string; accessDate: string; relevanceNote: string;
  flaggedBy?: \'FOUNDER\' \| \'VL\'; flagReason?: \'not_credible\' \|
  \'outdated\'; } interface ValidationTag { type: \'CLIENT_INTERVIEW\' \|
  \'VC_INTERVIEW\' \| \'EXPERT_INTERVIEW\' \| \'CONTRADICTED\';
  intervieweeCompany: string; intervieweeRole: string; date: string; }
  interface FeedbackEntry { rating: \'positive\' \| \'negative\';
  comment?: string; correctedValue?: string; userRole: \'FOUNDER\' \|
  \'VL\'; timestamp: string; } interface TrackedField\<T\> { value: T;
  source: SourceTag; subSource?: string; timestamp: string; citation?:
  ExternalCitation; // required when source is AI_RESEARCH
  validationTags?: ValidationTag\[\]; // set by Interview Insights
  feedback?: FeedbackEntry\[\]; // from feedback loop history: Array\<{
  value: T; source: SourceTag; timestamp: string }\>; }*

  -----------------------------------------------------------------------

**20.3 API Standards**

  -----------------------------------------------------------------------
  **Standard**        **Requirement**
  ------------------- ---------------------------------------------------
  Model               claude-sonnet-4-20250514 for all calls

  Max Tokens          1000 conversational (Idea Intake, Pressure Test) ·
                      2000 structured outputs (scoring, docs, financial
                      models) · 500 coverage assessment JSON (Idea Intake
                      progress dashboard)

  API Key             Never in code --- injected via environment variable
                      ANTHROPIC_API_KEY

  Error Handling      All calls in try/catch · User-facing error message
                      with retry button on every loading state

  JSON Outputs        Strip markdown fences before JSON.parse() ·
                      Validate expected shape before storing · Fallback
                      UI for malformed responses

  Source Citations    Every prompt includes: \'For every claim in your
                      response, cite the specific source tag that
                      informed it. For AI_RESEARCH claims, include the
                      source title, URL if available, and publication
                      date.\'

  Feedback Loop       Any prompt re-running an analysis includes all
                      previous feedback: \'Human feedback on prior
                      version: \[feedback\]. Incorporate this in your
                      response.\'

  Coverage Assessment Every Idea Intake conversational API call returns
                      two things: (1) the conversational response, (2) a
                      JSON coverage assessment for all 10 dimensions ---
                      used to update the live right-pane progress
                      dashboard

  No Mocking          Zero simulated or hardcoded AI responses --- all AI
                      output via live API on every call
  -----------------------------------------------------------------------

**20.4 Aesthetic Specification --- Obsidian Theme**

  --------------------------------------------------------------------------------
  **CSS Variable**      **Value**    **Usage**
  --------------------- ------------ ---------------------------------------------
  \--bg                 #13111C      Page background

  \--surface            #1E1A2E      Card and panel backgrounds

  \--border             #2E2A45      Card borders, dividers, table lines

  \--accent-primary     #7C6AF7      Primary actions, active states, highlights

  \--accent-secondary   #4F9CF9      Secondary accents, links, FOUNDER tag colour

  \--accent-warning     #F59E0B      Warnings, amber callouts, VL source chip
                                     colour

  \--accent-danger      #EF4444      Errors, kill signals, contradicted interview
                                     tags

  \--accent-success     #10B981      Success states, advance signals, complete
                                     indicators

  \--text-primary       #F0EEFF      Primary text

  \--text-muted         #8B87A8      Secondary text, metadata, timestamps, muted
                                     indicators
  --------------------------------------------------------------------------------

-   Typography: Sora (Google Fonts) for headings and UI labels · IBM
    Plex Mono for data values, scores, source chips, and metadata

-   Cards: background rgba(30,26,46,0.7) · backdrop-filter blur(12px) ·
    border 1px solid var(\--border) · border-radius 12px

-   Source chips: pill-shaped · 10px IBM Plex Mono · colour-coded fill
    at 15% opacity · matching border at 30% opacity · external link icon
    on AI_RESEARCH chips

-   Progress dashboard indicators: Green #10B981 (Complete) · Blue
    #4F9CF9 (In Progress) · Red #EF4444 (Issue) · Yellow #F59E0B
    (Missing) · Grey #8B87A8 (Not Started)

-   Animations: fade/slide on mount (300ms ease) · hover lift on cards
    (translateY -2px) · smooth accordion expand

**20.5 Loading Messages --- Complete List**

  -----------------------------------------------------------------------
  **Feature / Action**     **Loading Message**
  ------------------------ ----------------------------------------------
  Idea Intake --- AI       \"Preparing next question\...\"
  response                 

  Idea Intake --- Coverage \"Updating your progress\...\"
  assessment               

  Pressure Test            \"The \[Persona Name\] is reviewing your
                           venture\...\"

  Pressure Test --- End of \"Summarising this session\...\"
  session                  

  Scoring --- Corporate    \"Running Corporate Innovation analysis\...\"
  Innovation               

  Scoring --- Venture      \"Applying the VC Lens\...\"
  Capital                  

  Scoring --- Venture      \"Running Studio evaluation\...\"
  Studio                   

  Competitor               \"Mapping the competitive landscape\...\"
  Identification           

  Competitor ---           \"Updating competitive analysis with your
  Re-analysis with         input\...\"
  feedback                 

  Financial --- MVP Cost   \"Estimating your MVP build costs\...\"

  Financial --- Unit       \"Modelling your unit economics\...\"
  Economics                

  Financial --- Market     \"Sizing your market\...\"
  Sizing                   

  Interview Insights ---   \"Extracting insights from this
  Extract                  interview\...\"

  Interview Insights ---   \"Synthesising patterns across
  Synthesis                interviews\...\"

  Strategy --- Moat        \"Analysing which moats fit your model\...\"
  recommendation           

  Strategy --- Persona     \"The \[Persona\] is challenging your
  challenge                strategy\...\"

  Design Partner ---       \"Reading LinkedIn profile\...\"
  LinkedIn scoring         

  Design Partner --- Fit   \"Assessing candidate fit\...\"
  assessment               

  Design Partner ---       \"Drafting personalised outreach\...\"
  Outreach draft           

  Business Brief           \"Drafting your Business Brief\...\"
  generation               

  Pitch Deck generation    \"Crafting your narrative\...\"

  Investment Memo          \"Building your Investment Memo\...\"
  generation               

  Stage 04 --- Feedback    \"Synthesising design partner feedback\...\"
  synthesis                

  Stage 04 --- MVP Feature \"Generating your MVP feature list\...\"
  Generator                

  Stage 05 ---             \"Drafting technical architecture\...\"
  Architecture             

  Stage 05 --- Roadmap     \"Building your product roadmap\...\"

  Stage 05 --- Feature     \"Writing feature requirements\...\"
  PRDs                     

  Stage 05 --- Sprint Plan \"Building your sprint plan\...\"

  Stage 06 --- Pricing Lab \"Analysing your pricing model\...\"

  Stage 06 --- Feedback    \"Summarising pilot client feedback\...\"
  synthesis                

  Stage 01 --- VC thesis   \"Researching recent VC investment
  research                 theses\...\"

  Portfolio Report         \"Compiling portfolio snapshot\...\"
  generation               
  -----------------------------------------------------------------------

**20.6 Seed Data**

  ----------------------------------------------------------------------------
  **Venture**           **Stage**    **Status**   **Pre-Loaded Features**
  --------------------- ------------ ------------ ----------------------------
  ClearClose ---        Stage 03 --- At Risk      Full Idea Intake (10
  AI-native M&A         Incubate                  dimensions --- 2 Red issues:
  integration                                     unit economics and
  intelligence                                    competitive moat) · All 3
                                                  scoring models run
                                                  (composite: Caution) · 1
                                                  Pressure Test session
                                                  completed (Unit Economics
                                                  Enforcer) · Business Brief
                                                  generated · Investment Memo
                                                  in progress with 1 Gap Alert
                                                  on competitive landscape ·
                                                  Competitor analysis started
                                                  · Financial models seeded
                                                  with initial assumptions

  FlowState ---         Stage 04 --- On Track     Full Idea Intake (all 10
  Workforce composition Design &                  dimensions Green) · All 3
  intelligence for      Validate                  scoring models run
  CHROs                                           (composite: Advance) · All 6
                                                  Pressure Test personas
                                                  completed · Business Brief
                                                  and Investment Memo
                                                  generated · Pitch Deck
                                                  generated · 2/3 design
                                                  partners signed · Interview
                                                  Insights with 5 uploaded
                                                  interviews · Strategy & Moat
                                                  workspace populated with
                                                  moat recommendations

  LedgerLens ---        Stage 06 --- On Track     Full Idea Intake · All 3
  Financial disclosure  MVP Build &               scoring models (composite:
  compliance validation Pilot                     Advance) · Investment Memo
                                                  approved · 3/3 design
                                                  partners signed · Final
                                                  Pitch Deck · Financial
                                                  models complete · Stage 05
                                                  outputs all generated
                                                  (architecture, roadmap,
                                                  PRDs, sprint plan) · Pricing
                                                  Lab active with 3 pricing
                                                  scenarios
  ----------------------------------------------------------------------------

**20.7 Recommended Build Order for Cursor**

-   Step 1: Initialise with web-artifacts-builder --- read SKILL.md
    before writing any code

-   Step 2: Install dependencies: recharts · pptxgenjs · docx

-   Step 3: Implement TrackedField\<T\>, ExternalCitation,
    ValidationTag, and FeedbackEntry type system --- this is the
    foundation for everything else

-   Step 4: Build Idea Intake --- dual-pane layout with live progress
    dashboard; this populates the venture record that all other features
    read from

-   Step 5: Build Scoring Models --- three tiles on one page with
    weighting display before scoring and dimension explanations after

-   Step 6: Build Competitor Analysis, Financial Models (with
    assumptions sections), Interview Insights, and Strategy & Moat in
    parallel

-   Step 7: Build Design Partner Scorecard with LinkedIn URL input and
    founder candidate submission

-   Step 8: Build Pressure Test with Idea Intake integration and
    end-of-session insight integration flow

-   Step 9: Build Business Brief generator (Stage 02)

-   Step 10: Build Investment Memo and Pitch Deck generators (Stage 03)

-   Step 11: Build Stage 04 outputs (Feedback Summary, MVP Feature
    Generator)

-   Step 12: Build Stage 05 outputs (Architecture, Roadmap, PRDs, Sprint
    Plan)

-   Step 13: Build Stage 06 Pricing Lab

-   Step 14: Build VL Dashboard and Weekly Portfolio Report

-   Step 15: Build Stage 01 VC Thesis Intelligence feature

-   Step 16: Seed data for all 3 ventures · Bundle: bash
    scripts/bundle-artifact.sh

**Appendix A: Naming Reference --- v1 to v2**

  ------------------------------------------------------------------------
  **v1 Name**           **v2 Name**           **Notes**
  --------------------- --------------------- ----------------------------
  Founder Interview     Idea Intake           Renamed throughout --- all
                                              UI labels must use \'Idea
                                              Intake\'

  Investment Memo       Business Brief        Short early-stage document
  (5-page)                                    --- Stage 02 --- max 5 pages
                                              --- Word .docx --- generated
                                              from Idea Intake

  Investment Business   Investment Memo       Full incubation document ---
  Case                                        Stage 03 --- 10--20 pages
                                              --- Word .docx --- for
                                              Investment Committee

  Pitch Deck            Pitch Deck            Unchanged --- Stage 03 end
                                              --- 12 slides --- PowerPoint
                                              .pptx

  Design Partner        Design Partner        Shortened for UI use
  Qualification         Scorecard             
  Scorecard                                   

  3 tabs (Scoring)      3 tiles on one page   Scoring UI redesigned ---
                                              all three models visible
                                              simultaneously on one page

  Portfolio Report      Weekly Portfolio      Unchanged --- VL only
                        Report                
  ------------------------------------------------------------------------

**Appendix B: Studio Guiding Principles**

-   Client-led and market-validated from day one --- every feature
    reinforces this by surfacing client evidence and challenging claims
    that lack it

-   De-risk early before full investment --- scoring, pressure testing,
    financial models, and the design partner scorecard are all
    de-risking tools, not validation theater

-   No venture advances without a client who will pay --- the design
    partner scorecard and the Stage 04 gate enforce this structurally

-   Clear founder accountability --- Idea Intake treats founders as
    capable adults who can handle sharp questions and honest gaps

-   Prototype in days, validate in weeks, scale in months --- Stage
    04\'s 5-day sprint and Stage 05 architecture outputs embody this

-   Investment is focused on the highest-potential opportunities ---
    composite scoring signal and IC Actions in the weekly report support
    this judgment

-   The AI improves with use --- feedback loops from both users compound
    over the lifetime of a venture record

  -----------------------------------------------------------------------
  *This document is the complete and final specification for Venture OS
  v2.0, incorporating all stakeholder feedback from the review session.
  All naming conventions, user permissions, stage outputs, feature
  specifications, and technical requirements in this document are
  intentional and definitive. Build exactly as described.*

  -----------------------------------------------------------------------
