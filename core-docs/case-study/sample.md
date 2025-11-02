You are absolutely right. The Intel case is flawed because the outcome is too well-known. A great case study must place the user in a state of genuine ambiguity, where the "right" path is fiercely debatable even with all the facts. It must be a test of judgment, not history.

My apologies. I will create a new example that meets this higher standard.

**The Case Study: The Disney Streaming Dilemma (2017)**

This case is superior because, in 2017, the decision was not obvious. Disney's legacy business was a cash-printing machine. The choice to proactively cannibalize billions in high-margin licensing and cable revenue to chase Netflix in a low-margin, high-spend streaming model was a radical, bet-the-company decision with a very real possibility of failure. A brilliant, rational executive could have argued powerfully against it. This eliminates hindsight bias and creates a genuine strategic dilemma.

Here is the complete `CaseStudyData.json` object.

---

```json
{
  "caseId": "cs_02_disney_streaming_pivot_2017",
  "version": "1.2",
  "title": "Disney's Streaming Dilemma: Cannibalize or Defend? (2017)",
  "description": "You are Disney CEO Bob Iger in 2017. Your cable networks are immensely profitable, as is your content licensing deal with Netflix. But subscriber trends are alarming. You must decide whether to go all-in on a direct-to-consumer streaming service, directly attacking your own profit centers.",
  "competencies": ["Corporate Strategy", "Capital Allocation", "Risk Management", "Investor Narrative"],

  "caseFiles": [
    {
      "fileId": "doc_a",
      "fileName": "Financial Summary: Media Networks & Studio Entertainment (2015-2017).csv",
      "fileType": "FINANCIAL_DATA",
      "source": {
        "type": "REMOTE_CSV",
        "url": "https://api.praxis.program/data/cs02_disney_legacy_financials.csv"
      }
    },
    {
      "fileId": "doc_b",
      "fileName": "CONFIDENTIAL MEMO: The Netflix Licensing Deal.md",
      "fileType": "MEMO",
      "source": {
        "type": "STATIC",
        "content": "To: CEO\nFrom: CFO\nSubject: Projecting the Netflix Deal Value\n\nOur current licensing deal for our 'Pay 1' movie window with Netflix is worth approximately $350M/year in pure, high-margin profit. This deal is up for renewal in 2019. Netflix has indicated a willingness to increase this substantially, potentially to over $500M/year. Forfeiting this revenue stream to launch our own service represents a significant, guaranteed hit to operating income for the foreseeable future."
      }
    },
    {
      "fileId": "doc_c",
      "fileName": "Market Research: The Cord-Cutting Threat & SVOD Growth.md",
      "fileType": "REPORT",
      "source": {
        "type": "STATIC",
        "content": "Internal research confirms an accelerating decline in multichannel video subscribers (cable/satellite), impacting ESPN's long-term growth. Conversely, Netflix's subscriber base is projected to double in the next 4 years, and their content spend is set to exceed $10 billion annually. They are increasingly using our content to build their platform, which they will then leverage to outbid us for new creative talent."
      }
    },
    {
      "fileId": "doc_d",
      "fileName": "INTERNAL DRAFT: 'Project D+' Strategic Options Analysis.pdf",
      "fileType": "PRESENTATION_DECK",
      "source": {
        "type": "REMOTE_PDF",
        "url": "https://api.praxis.program/data/cs02_dplus_options.pdf"
      }
    }
  ],

  "stages": [
    {
      "stageId": "stage_1_triage",
      "stageTitle": "Choose Your Strategic Path",
      "challengeType": "STRATEGIC_OPTIONS_TRIAGE", 
      "challengeData": {
        "prompt": "You are presented with three viable strategic paths for Disney's digital future. Each has significant risks and rewards. You must choose ONE path to recommend to the board. This choice will lock in your strategy for the rest of the simulation.",
        "options": [
          {
            "id": "option_a",
            "title": "All-In Direct-to-Consumer (DTC)",
            "description": "Forfeit the Netflix licensing revenue. Launch a mass-market Disney-branded streaming service. Invest $4B/year in new content and technology. This is a high-risk, high-reward bet to own your own destiny."
          },
          {
            "id": "option_b",
            "title": "Defend & License (The 'Arms Dealer' Strategy)",
            "description": "Do not launch a broad streaming service. Instead, renew and expand the licensing deal with Netflix. Use that high-margin cash to create even more premium content, making Disney the indispensable 'arms dealer' to all streaming platforms."
          },
          {
            "id": "option_c",
            "title": "Niche & Premium DTC",
            "description": "Launch a smaller, high-priced streaming service for die-hard fans only (e.g., 'Disney Vault Club'). Keep the main blockbusters licensed to Netflix to minimize revenue loss. A hedged approach that avoids direct conflict."
          }
        ]
      }
    },
    {
      "stageId": "stage_2_persuade",
      "stageTitle": "Justify Your Strategy to the Board",
      "challengeType": "BOARD_DECK_CRITIQUE",
      "challengeData": {
        "prompt": "Your team has prepared a draft board presentation (doc_d) arguing for your chosen path, but the narrative is weak and the data isn't presented effectively. Your task is to leave at least 8 specific, actionable comments on the slides. Your critique must sharpen the argument, preemptively address the board's likely objections to your chosen path, and make the presentation compelling and defensible.",
        "documentToCritique": "doc_d"
      }
    },
    {
      "stageId": "stage_3_communicate",
      "stageTitle": "Defend Your Decision to Wall Street",
      "challengeType": "EARNINGS_CALL_QA",
      "challengeData": {
        "prompt": "You have just announced your strategic decision on the quarterly earnings call. Now, you must face the consequences. Respond to the following questions from Wall Street analysts. Your answers must be consistent with the path you chose.",
        "analystQuestions": [
          {
            "persona": "Morgan Stanley (Bullish but Cautious)",
            "question": "Bob, this is a bold move. Can you walk us through the expected impact on operating margins for the next 24 months and give us a sense of when you expect this new strategy to become profitable?"
          },
          {
            "persona": "Bernstein Research (Skeptical Bear)",
            "question": "It seems you're either destroying billions in guaranteed profit (if you chose DTC) or ceding the future to Netflix (if you chose to license). Can you explain why you believe this path won't permanently impair shareholder value?"
          },
          {
            "persona": "The Hollywood Reporter (Industry Focused)",
            "question": "How does this decision impact your relationship with key distribution partners, from cable companies to movie theaters? Are you prepared for the potential backlash?"
          }
        ]
      }
    }
  ]
}
```