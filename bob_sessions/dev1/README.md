# Dev 1 - Bob Architect Sessions

**Developer:** Dev 1  
**Role:** Bob Architect  
**Primary Ownership:** All `.bob/` configuration (modes, skills, slash commands, MCP bindings)

## Focus Areas

### Phase 1 (H+0 to H+2)
- Repository creation and directory scaffolding
- OnboardOps' own AGENTS.md
- Custom `/onboard` mode stub
- Repo Cartography skill stub
- Certification skill stub
- Project-scoped MCP binding configuration
- Bob ↔ Backend contracts documentation

### Phase 2 (H+2 to H+10)
- Full Onboard mode implementation with Socratic stance
- Complete Repo Cartography skill (4 stages)
- MCP tool integration and testing
- First end-to-end cartography run on demo repo

### Phase 3 (H+10 to H+24)
- Certification skill with 12 question templates
- Rubric development and grading logic
- End-to-end certification flow

### Phase 4 (H+24 to H+32)
- Starter PR generator implementation
- AGENTS.md builder for end users
- Integration with GitHub API

## Session Exports

### Phase 1 Sessions
1. `01_create-repository.md` - GitHub repo creation and initial setup
2. `02_directory-scaffolding.md` - Creating the canonical directory tree
3. `03_onboardops-agents-md.md` - Authoring OnboardOps' own AGENTS.md
4. `04_onboard-mode-stub.md` - Creating the custom `/onboard` mode stub
5. `05_cartography-skill-stub.md` - Repo Cartography skill structure
6. `06_certification-skill-stub.md` - Certification skill template
7. `07_mcp-binding-config.md` - Project-scoped MCP configuration
8. `08_bob-backend-contracts.md` - Documenting Bob ↔ Backend contracts

### Phase 2+ Sessions
(To be added as development progresses)

## Key Deliverables

- `.bob/modes/onboard.md` - Custom Socratic onboarding mode
- `.bob/skills/repo-cartography.md` - 4-stage codebase mapping skill
- `.bob/skills/certification.md` - 12-question competency verification
- `.bob/mcp.json` - Institutional Knowledge MCP server binding
- `docs/bob-contracts.md` - Data shape specifications for MCP tools

## Notes

- All Bob configuration files use YAML front matter for metadata
- Skills are designed to be composable and reusable
- MCP bindings are project-scoped (not global)
- Session exports focus on iterative refinement of prompts and configurations