# Product Overview

## Problem

Ordinary AI chats are useful for answering a question, but they do not naturally become an organized study system. Important context becomes difficult to find, repeated mistakes are not accumulated, and a question's original attempt can get buried under later messages.

StudyWeave treats every question as a permanent study workspace.

## Intended user

The initial MVP is designed for an individual student who wants to:

- organize questions by course and topic;
- preserve their own attempted solution;
- understand the first incorrect step;
- ask follow-up questions without losing context;
- find earlier questions and explanations later.

Multi-user classrooms, instructors, organizations, and collaboration are outside the first version.

## Core experience

A saved question contains four distinct parts:

1. **Original question** — text and supported attachments.
2. **Student attempt** — the reasoning or solution submitted by the student.
3. **Canonical analysis** — structured feedback generated during question creation.
4. **Conversation** — chronological follow-up questions and answers.

The structured analysis should remain concise and easy to display. Follow-up messages should remain conversational instead of returning the entire analysis schema again.

## Initial analysis

The planned analysis contains:

- verdict;
- short answer;
- correct parts;
- first incorrect step;
- corrected solution;
- key concepts;
- lesson to remember;
- suggested review question.

A verdict may be `correct`, `partially_correct`, `incorrect`, or `insufficient_information`.

## MVP scope

The MVP includes:

- simple user identity;
- courses and topics;
- original-question submission;
- attempted solutions;
- supported attachments;
- structured AI analysis;
- persistent follow-up conversation;
- question search, filters, pagination, and full-thread retrieval;
- Hebrew RTL frontend with a dark default theme;
- baseline tests, security, and reliability controls.

## Outside the MVP

The following are intentionally deferred:

- instructor and classroom workflows;
- automatic flashcards;
- spaced repetition;
- automatic practice-question generation;
- multiple AI providers in the user interface;
- collaborative editing;
- instructor verification;
- final illustrations and polished brand assets.

## Interface direction

The application should:

- use Hebrew and RTL layout throughout the primary interface;
- default to a dark navy visual theme;
- use generous spacing and readable line height;
- support long explanations and mathematical notation;
- clearly distinguish student content, AI analysis, and conversation;
- never present AI review as proof of academic correctness.
