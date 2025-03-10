# Understanding Cursor Rules Deeply

Thank you [hao-ji-xing](https://github.com/hao-ji-xing) for your detailed explanation of Cursor Rules.

Lately, I’ve noticed many people discussing issues with Rules not working as expected. After diving into Cursor 0.45’s Rules mechanism, I discovered that the official documentation is incomplete. It hints at certain concepts but doesn’t align with our intuition, leading to misunderstandings for beginners. This article provides an in-depth explanation of the Rules system and its principles. Feel free to discuss if you have questions.

## User Rules
User Rules define global preferences, like the desired tone, how the model addresses you, and principles for communication. These rules follow the editor and apply across all projects. User Rules are always sent to the AI in all chat sessions and conversations triggered by pressing Command-K.

## Project Rules
### Purpose
Project Rules are project-specific, designed to align with the needs of individual projects. Cursor organizes them as .mdc files in a structured system that automatically creates directories and files when new rules are added.

└── .cursor
    └── rules
        ├── global.mdc
        └── only-html.mdc
An .mdc file is plain text with content that looks like this:

```mdc
---
description: Always apply in any situation
globs: 
alwaysApply: true
---
```

When this rule loads, input: "Rule loaded: global.mdc."

### Editing Limitations
Cursor offers an integrated but buggy UI for editing .mdc files, which hasn’t been fixed yet. Editing these files with external tools like VSCode is recommended.

### Why Store Them in .cursor/rules/?
They integrate into the codebase.
Files in .cursor can be committed to Git repositories.
Teams can collaborate using shared rules, ensuring consistency as everyone pulls the same rules.

### How Do Project Rules Work?
Do rules placed in the .cursor/rules/ directory automatically activate? No.
Do the same rules apply equally across ask/edit/agent modes? No.

### Two Stages of Activation in Cursor
#### Stage 1: Injection
Rules are injected into the system prompt context but aren’t yet active. Whether a rule is injected depends on:

* **alwaysApply**: Injects the rule into the context unconditionally, but does not control activation .
* **globs**: Matches files based on patterns (e.g., filenames, extensions). If matched, the rule is injected into the context. Again, this does not control activation .

#### Stage 2: Activation
Whether a rule takes effect depends on its description field.

Cursor appends the following structure to the system prompt:

```mdc
<available_instructions>
Cursor rules are user-provided instructions for the AI to follow to help work with the codebase.

They may or may not be relevant to the task at hand. If they are, use the fetch_rules tool to fetch the full rule.

Some rules may automatically attach to the conversation if the user links a file matching the rule's glob; those won't need to be fetched.

# RULES_1.name: RULES_1.description
# RULES_2.name: RULES_2.description
</available_instructions>

<cursor_rules_context>
Cursor Rules are extra documentation provided by the user to help the AI understand the codebase.

Use them if they seem useful to the user's most recent query, but do not use them if they seem unrelated.

# RULES_1
# RULES_2
</cursor_rules_context>
```

That’s the key prompt Use them if they seem useful to the user's most recent query, but do not use them if they seem unrelated.

## Key Points About Activation:

* **description**: The description defines the appropriate scenarios, and the model will evaluate the context to decide whether the rule should be applied., such as:
  * Always active in all situations.
  * Active during planning discussions.
  * Active for frontend projects.
  * Etc.
* **AI Intelligence Required**: The model must have sufficient intelligence to properly interpret the description. Less capable models (e.g., GPT-4-mini) may fail to understand and apply the rules effectively.

## Summary
For Project Rules to work as intended, you must understand how these parameters interact:

* **alwaysApply**: Suitable for global rules.
* **globs**: Matches files or directories based on naming patterns.
* **description**: Determines activation during conversations by instructing the model through natural language.
Understanding these combinations ensures seamless rule integration in your workflows.