# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
and follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [0.1.0] - 2026-03-01

### Added

- `runStructuredPrompt()` — core function to get typed, Zod-validated JSON from any LLM.
- `AIProvider` interface — provider-agnostic contract for plugging in any AI backend.
- `OpenAIProvider` — built-in provider for OpenAI Chat Completions API (gpt-4o default).
- `AIValidationError` — custom error class with `lastRawOutput`, `validationIssues`, and `attempts`.
- Auto-repair retry loop — sends validation errors back to the model for self-correction (configurable `maxRetries`).
- Safe JSON parser — strips markdown fences, extracts outermost JSON structures, handles common AI quirks.
- Prompt builder utilities — `buildInitialPrompt()` and `buildRepairPrompt()` for custom orchestration.
- `describeSchema()` — converts Zod schemas to human-readable text for prompt injection.
- Full TypeScript support with strict mode, declaration maps, and zero `any` types.

[0.1.0]: https://github.com/dinethpiyumantha/zuai/releases/tag/v0.1.0
