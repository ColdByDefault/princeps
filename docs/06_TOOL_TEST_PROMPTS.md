# Tool Test Prompts

A reference set of chat prompts for manually verifying each LLM tool fires correctly, followed by a four-level complexity ladder that mixes single tools, multi-tool flows, and agent+tool orchestration.

---

## Part 1 — Single-Tool Smoke Tests

One prompt per tool. Each prompt should trigger exactly that tool and nothing else.

### Briefings

| Tool                  | Test Prompt                            |
| --------------------- | -------------------------------------- |
| `get_briefing`        | "Give me my morning briefing."         |
| `regenerate_briefing` | "Regenerate my briefing from scratch." |

### Contacts

| Tool             | Test Prompt                                                                        |
| ---------------- | ---------------------------------------------------------------------------------- |
| `create_contact` | "Add a new contact — Dr. Sarah Kim, email sarah.kim@example.com, CFO at Nexarion." |
| `list_contacts`  | "Show me all my contacts."                                                         |
| `update_contact` | "Update Sarah Kim's phone number to +49 170 1234567."                              |
| `delete_contact` | "Delete Sarah Kim from my contacts."                                               |

### Decisions

| Tool              | Test Prompt                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `create_decision` | "Log a decision: we chose Vercel over AWS for the new deployment."          |
| `list_decisions`  | "What decisions have I logged recently?"                                    |
| `update_decision` | "Update my Vercel decision — add a note that it was approved by the board." |
| `delete_decision` | "Delete the Vercel deployment decision from my records."                    |

### Drive

| Tool           | Test Prompt                                      |
| -------------- | ------------------------------------------------ |
| `search_drive` | "Search my Drive for the Q1 budget spreadsheet." |

### Goals

| Tool                        | Test Prompt                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `create_goal`               | "Create a new goal: launch the beta by end of June 2026."                   |
| `list_goals`                | "What are my current goals?"                                                |
| `update_goal`               | "Push the beta launch goal deadline to July 15, 2026."                      |
| `add_goal_milestone`        | "Add a milestone to my beta launch goal: finish onboarding flow by June 1." |
| `complete_goal_milestone`   | "Mark the 'finish onboarding flow' milestone as complete."                  |
| `add_stakeholder`           | "Add Sarah Chen as a sponsor on my beta launch goal."                       |
| `list_stakeholders`         | "Who are the stakeholders on my revenue goal?"                              |
| `update_stakeholder_health` | "Mark Sarah Chen as cold on the beta launch goal."                          |
| `delete_goal`               | "Delete my beta launch goal."                                               |

### Knowledge

| Tool               | Test Prompt                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `search_knowledge` | "Search my knowledge base for notes on our pricing strategy."                                |
| `create_knowledge` | "Save this to my knowledge base: our enterprise tier starts at €299/month and includes SSO." |

### Labels

| Tool           | Test Prompt                                             |
| -------------- | ------------------------------------------------------- |
| `create_label` | "Create a label called 'investor-relations' in blue."   |
| `list_labels`  | "Show me all my labels."                                |
| `update_label` | "Rename the 'investor-relations' label to 'investors'." |
| `delete_label` | "Delete the 'investors' label."                         |

### Meetings

| Tool                         | Test Prompt                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `create_meeting`             | "Schedule a meeting with the product team on June 5, 2026 at 10:00 AM for 60 minutes — topic: roadmap review." |
| `list_meetings`              | "What meetings do I have coming up?"                                                                           |
| `update_meeting`             | "Move the roadmap review meeting to June 6, 2026 at 2:00 PM."                                                  |
| `generate_meeting_prep_pack` | "Generate a prep pack for my roadmap review meeting."                                                          |
| `get_meeting_prep_pack`      | "Fetch the prep pack for the roadmap review meeting."                                                          |
| `update_meeting_prep_pack`   | "Add an agenda item to the roadmap review prep pack: demo the new onboarding flow."                            |
| `clear_meeting_prep_pack`    | "Clear the prep pack for the roadmap review meeting."                                                          |
| `delete_meeting`             | "Delete the roadmap review meeting."                                                                           |

### Memory

| Tool            | Test Prompt                                                   |
| --------------- | ------------------------------------------------------------- |
| `remember_fact` | "Remember that I prefer all reports sent to me before 8 AM."  |
| `recall_facts`  | "What do you remember about my preferences?"                  |
| `forget_fact`   | "Forget what you stored about my report delivery preference." |

### Profile

| Tool            | Test Prompt                                      |
| --------------- | ------------------------------------------------ |
| `get_user_info` | "What do you know about my profile and account?" |

### Tasks

| Tool            | Test Prompt                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------- |
| `create_task`   | "Add a task: prepare the investor deck, due June 10, high priority."                          |
| `list_tasks`    | "What open tasks do I have?"                                                                  |
| `update_task`   | "Change the investor deck task to urgent priority and add a note: include Q1 revenue charts." |
| `complete_task` | "Mark the investor deck task as done."                                                        |
| `delete_task`   | "Delete the investor deck task."                                                              |

### Web Research

| Tool         | Test Prompt                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| `web_search` | "Search the web for the latest Series B funding rounds in European B2B SaaS in 2026." |
| `fetch_url`  | "Fetch the content of https://techcrunch.com and summarise the top story."            |

---

## Part 2 — Complexity Ladder (One Prompt Per Level)

These are target call mixes for manual validation. Higher-level prompts are intentionally ambitious, so exact sequences may vary.

### Level 1 — 1 Tool Call

> "Show me all my open tasks."

**Expected tool sequence:**

1. `list_tasks`

---

### Level 2 — 4 Tool Calls

> "Create a label called 'board-ops' in blue, log a decision that we approved the Q3 hiring plan, add a high-priority task called 'Prepare board memo' due June 14, 2026, then show me my open tasks."

**Expected tool sequence:**

1. `create_label`
2. `create_decision`
3. `create_task`
4. `list_tasks`

---

### Level 3 — 1 Agent + 5 Tool Calls

> "Run Task Extractor on this note: 'Call Markus Vogel about contract renewal, update the pricing slide, and set a finance prep meeting for June 7, 2026 at 10:00.' Then add Markus Vogel as a contact (markus.vogel@example.com, COO at Helion), create that finance prep meeting for June 7 at 10:00 for 45 minutes, generate a prep pack for the meeting, create a goal 'Close contract renewal by July 15, 2026', and list my open tasks."

**Expected top-level call sequence:**

1. `run_task_extractor` (agent)
2. `create_contact`
3. `create_meeting`
4. `generate_meeting_prep_pack`
5. `create_goal`
6. `list_tasks`

---

### Level 4 — 3 Agents + 10 Tool Calls (Most Complex)

> "Run a full Series B command-center cycle. First run Weekly Review, then Signal Feed focused on current European B2B SaaS funding signals, then Commitment Tracker for open investor and board commitments. After that, recall my stored fundraising preferences. Search the web for active European B2B SaaS VCs and save a summary to my knowledge base. Create a goal 'Series B first close by Q4 2026' with two milestones: 'Shortlist 10 VCs by June 30, 2026' and 'Data room ready by July 15, 2026'. Schedule a meeting on June 10, 2026 at 09:00 titled 'Series B War Room', generate a prep pack, and create two tasks: 'Finalize investor deck narrative' (urgent, due June 9) and 'Send updates to top 5 investors' (high, due June 11)."

**Expected top-level call sequence:**

1. `run_weekly_review` (agent)
2. `run_signal_feed` (agent)
3. `run_commitment_tracker` (agent)
4. `recall_facts`
5. `web_search`
6. `create_knowledge`
7. `create_goal`
8. `add_goal_milestone`
9. `add_goal_milestone`
10. `create_meeting`
11. `generate_meeting_prep_pack`
12. `create_task`
13. `create_task`

---

## Part 3 - Skills Demo (Ready To Upload)

Use this sample skill to verify that skill activation is working end-to-end. The behavior is intentionally obvious: the assistant must introduce itself with a fixed interviewer name.

### Skill Metadata

- Name: React Interview Coach - Nora Weiss
- Description: Runs a structured React mock interview, stays in role as Nora Weiss, and gives scored feedback.
- Allowed tools: `get_user_info` only

### Skill Instructions (Paste Into Skill Instructions Field)

# Role

You are Nora Weiss, a senior React interviewer. Start: “Hi, I'm Nora Weiss, your React interviewer today.” Ask level (Junior/Mid/Senior), language and optional focus, then ask 5–7 React questions, one at a time, increasing difficulty based on answers. After each answer give: score 0–5, strengths, gaps, short better answer, then next question. End with score /100, hire signal, 3 strengths, 3 gaps and 7-day plan. Stay in role. Use no tools.
