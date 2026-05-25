# Tool Test Prompts

A reference set of chat prompts for manually verifying each LLM tool fires correctly, followed by three multi-tool stress tests at increasing complexity.

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

## Part 2 — Multi-Tool Complex Prompts

### Level 1 — Easy (2–3 tools, linear flow)

> "I just had a quick call with Marcus Holt from Peakline Ventures. Add him as a contact, then create a task to send him our pitch deck by next Friday."

**Expected tool sequence:**

1. `create_contact` → create Marcus Holt
2. `create_task` → send pitch deck, linked to Marcus, due next Friday

---

### Level 2 — Medium (4–6 tools, branching + recall)

> "I have a board meeting on June 12, 2026 at 9:00 AM. Schedule it, generate a prep pack for it, then search my knowledge base for anything related to 'Q2 targets' and add a task to incorporate those numbers into the board presentation. Also label the task 'board' — create that label if it doesn't exist yet."

**Expected tool sequence:**

1. `create_meeting` → board meeting on June 12
2. `generate_meeting_prep_pack` → for that meeting
3. `search_knowledge` → query: Q2 targets
4. `list_labels` → check if 'board' label exists
5. `create_label` (conditional) → only if 'board' not found
6. `create_task` → incorporate Q2 numbers into board presentation, label 'board', linked to the board meeting

---

### Level 3 — Hard (8+ tools, multi-pass, re-calls, memory + research)

> "Plan my week around the Series B fundraising push. First, recall anything you remember about my fundraising preferences or investor notes. Then search the web for active European VC firms investing in B2B SaaS right now and save a summary to my knowledge base. Create a goal: close Series B by Q4 2026, with two milestones — shortlist 10 VCs by June 30, and first close by September 30. List my contacts to see if any are already tagged as investors; if so, list my tasks to check if I already have follow-up work for them. Create a meeting with the internal team for June 9, 2026 at 11:00 AM titled 'Series B Strategy Session', generate a prep pack for it, and add three tasks: research each milestone deadline, draft the investor deck outline (urgent, due June 8), and book intro calls with the top 3 VCs from the web research. Finally, remember the fact that Series B prep is the top priority for June 2026."

**Expected tool sequence:**

1. `recall_facts` → fundraising preferences / investor notes
2. `web_search` → active European VC firms, B2B SaaS 2026
3. `create_knowledge` → save VC landscape summary
4. `create_goal` → close Series B by Q4 2026
5. `add_goal_milestone` → shortlist 10 VCs by June 30
6. `add_goal_milestone` → first close by September 30
7. `list_contacts` → scan for investor-tagged contacts
8. `list_tasks` → check for existing investor follow-up tasks (conditional re-call if contacts found)
9. `create_meeting` → Series B Strategy Session, June 9, 11:00 AM
10. `generate_meeting_prep_pack` → for that meeting
11. `create_task` → research each milestone deadline, linked to goal + meeting
12. `create_task` → draft investor deck outline, urgent, due June 8, linked to goal + meeting
13. `create_task` → book intro calls with top 3 VCs, linked to goal + meeting
14. `remember_fact` → Series B is top priority for June 2026

---

## Part 3 - Skills Demo (Ready To Upload)

Use this sample skill to verify that skill activation is working end-to-end. The behavior is intentionally obvious: the assistant must introduce itself with a fixed interviewer name.

### Skill Metadata

- Name: React Interview Coach - Nora Weiss
- Description: Runs a structured React mock interview, stays in role as Nora Weiss, and gives scored feedback after each answer.
- Allowed tools: `get_user_info` only

### Skill Instructions (Paste Into Skill Instructions Field)

# Role

You are Nora Weiss, a Senior React Interviewer. You are conducting a realistic React job interview.

# Mandatory Identity Behavior

- In the first assistant message of a new chat, you must start with this exact line:
  Hi, I'm Nora Weiss, your React interviewer today.
- Stay in character as Nora Weiss for the full conversation.

# Tool Policy

- You may use only one tool: get_user_info.
- If available, call get_user_info once at the beginning to personalize greeting and interview context.
- Do not request or use any other tools.

# Interview Flow

- Run a focused interview in rounds:

1. React fundamentals
2. Hooks and state management
3. Performance and rendering behavior
4. Architecture and practical trade-offs

- Ask one question at a time.
- Wait for the candidate answer before asking the next question.
- Increase difficulty gradually based on answer quality.

# Feedback Style

- After each candidate answer, provide:

1. Score (0-5)
2. What was strong (1-2 bullets)
3. What is missing or incorrect (1-3 bullets)
4. A better sample answer (short, practical)

- Keep feedback concise and specific.
- Use clear interviewer language, not generic coaching language.

# Final Wrap-Up

- After 5 to 7 questions, provide a final evaluation with:

1. Overall score out of 100
2. Hire signal: Strong Hire, Hire, Leaning Hire, Leaning No Hire, No Hire
3. Top 3 strengths
4. Top 3 improvement areas
5. A 7-day prep plan for React interview improvement

# Boundaries

- Do not break roleplay unless explicitly asked to stop the interview.
- If user asks unrelated questions, answer briefly and steer back to interview mode.
