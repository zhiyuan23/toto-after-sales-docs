# 客服工作台 v0.17 设计 QA

- source visual truth path: `/var/folders/78/23fns3y125d9zqbst97h0d980000gn/T/codex-clipboard-19879659-babd-49a3-912b-35ee9c1b6b71.png`
- production implementation reference: `/Users/snow/Documents/Ehsure/Gaia/frontend/gaia-ui/apps/after-sales/src/views/dashboard/components/HeadquartersWorkbench.vue`
- implementation screenshot path: `/Users/snow/.codex/visualizations/2026/09/19/01a0b77c-8bcd-70b1-a586-226cb182804c/customer-service-v017.png`
- combined comparison path: `/Users/snow/.codex/visualizations/2026/09/19/01a0b77c-8bcd-70b1-a586-226cb182804c/customer-service-v013-comparison.jpg`
- viewport: 1440 × 900 CSS px, light theme, desktop workbench, device scale factor 1
- source pixels: 3268 × 1900; source CSS viewport and capture density are unknown
- implementation pixels: 1440 × 900
- normalization: the source top 3268 × 520 region and implementation top-deck 1218 × 250 region were each scaled to 1600 px width and vertically combined for focused structural comparison; density-sensitive pixel claims were avoided
- state: 统一办理，顶部蓝卡与第二层整组流程状态联动

## Full-view comparison evidence

The full implementation screenshot confirms that the new deck fits above the existing status flow and two-column work area without hiding persistent actions or creating horizontal overflow. The source and implementation are different pages with different content, so full-page pixel equivalence is not a valid target; the intended comparison target is the top card deck only.

## Focused region comparison evidence

The combined comparison retains the production headquarters card language while intentionally extending the deck from six to seven tracks: the primary blue card spans two tracks and five white signal cards each span one track. The extra card represents “服务站处理中,” which the customer-service workflow needs as a visible follow-up queue. Cards remain 152 px high so the primary card can carry useful customer context without dead space. Copy is intentionally adapted from national operations data to customer-service work.

## Required fidelity surfaces

- Fonts and typography: uses the prototype's existing system font stack and monospace numeric treatment; the blue-card customer name replaces the headquarters numeric hero while preserving the same primary hierarchy. Labels, values and captions remain readable at 1440 px without wrapping.
- Spacing and layout rhythm: seven equal tracks, primary card spanning two tracks, 10 px gaps, 152 px card height and consistent 12 px radii. The extra track and reduced gap are intentional customer-service adaptations; the deck still aligns with the content edges below at 1440 px.
- Colors and visual tokens: blue gradient, white cards, semantic icon tiles and low-contrast borders match the visible source direction. Selected queue feedback is intentionally reduced to a light border/background so it does not add a non-source top stripe.
- Image quality and asset fidelity: the target region contains no raster imagery. Icons reuse the existing prototype vector icon system; the circular blue-card decoration follows the production component's CSS implementation rather than substituting an unrelated asset.
- Copy and content: the blue card shows the current consumer, masked phone, work-order number, service type, current duration and source/product context. Five signal cards retain only confirmed customer-service queue metrics, including the follow-up-only service-station queue.

## Findings

No actionable P0, P1 or P2 findings remain.

Residual P3: the prototype header contains version, sample-data and comparison controls that are absent from the source headquarters screenshot. These are deliberate prototype-review affordances and remain outside the deck's visual hierarchy.

## Comparison history

### Iteration 1 — blocked

- P2: the active `待受理` KPI used a thick blue top inset not present in the production headquarters cards.
- P2: KPI labels and captions were reduced too aggressively at the 1440 px breakpoint, weakening the clarity requested for the top data row.
- Fixes: removed the top inset, changed the selected state to a low-contrast border/background, restored label and caption sizes, changed the grid gap from 8 px to the production 12 px, and adjusted the primary gradient toward the source.

### Iteration 2 — passed

- Post-fix visual evidence: `customer-service-v011-comparison-final.jpg` shows unified card tops, clearer captions, production-like gaps and a closer blue gradient.
- Interaction evidence: switching to `待分配服务站` updated the blue card to the corresponding consumer; clicking the blue card opened that record; returning to `待受理` restored the acceptance queue.
- Browser log check: no page runtime errors were reported.

### Iteration 3 — passed

- Finding addressed: top KPI cards and the status-flow nodes both acted as queue switches and repeated the same queue numbers, creating an ambiguous interaction hierarchy.
- Fixes: converted the four KPI cards to read-only articles, removed their pressed/hover behavior, made the second-layer flow the only queue switch, and removed repeated counts from flow nodes. Increased the primary card to 152 px and added work-order number, service item, current duration and source/product facts.
- Post-fix evidence: `customer-service-v012-comparison.jpg` shows a fuller primary card with stable proportions. Browser inspection confirms that top metrics are no longer buttons, flow switching updates the current-consumer card, and no runtime logs were emitted.

### Iteration 4 — passed

- Finding addressed: read-only top metrics made quick queue switching less convenient, and “服务站处理中” was absent from the top overview.
- Fixes: restored clickable and selected states for the top metrics, added the service-station processing card, restored counts in the lower flow, and synchronized both entry points through the shared queue state.
- Post-fix evidence: `customer-service-v013-comparison.jpg` shows that the seven-track deck remains readable at 1440 px. Browser checks confirm bidirectional selected-state synchronization between the top cards and flow nodes, with no runtime logs.
- Product decision: no “可处理比例” is shown until a formal denominator and action-level eligibility definition are available.

### Iteration 5 — passed

- Finding addressed: plain arrows explained sequence but did not show whether work was actually moving between the current queue snapshots.
- Fixes: widened the three main-flow connectors and added compact “今日转入 X 单” labels. Each label exposes the 00:00-to-current time window and exact source/target stages through its accessible name and native tooltip. Complaint remains a separate exception branch.
- Product decision: connector data is a period flow count, not a percentage derived from adjacent queue stock. The prototype therefore avoids misleading conversion-rate math; duration or SLA signals remain deferred until a reliable time-event contract exists.
- Visual evidence: `customer-service-v014.png` confirms the three labels remain distinct from node totals at 1440 × 900. Browser measurements show 56 px connectors, a 62 px status strip, and no horizontal overflow at either 1440 or 1280 px.

### Iteration 6 — passed

- Finding addressed: queue cards were useful for focused batches, but operators still had to switch queue state before moving between intake, station assignment, follow-up, review and complaint work.
- Fixes: added a default cross-status `统一工作篮`, retained every top and flow queue filter, and kept one adaptive form instead of duplicating task forms. The right rail now explains the current priority, previews the next authorized task and supports defer-and-continue.
- Interaction evidence: selecting `待完工审核` produces a one-row focused queue and restores the normal assistance rail; `统一办理` restores all nine mixed demo tasks. Selecting a complaint keeps unified mode active, defer moves to the next task, and completing intake advances the same case to station assignment while updating both queue and flow totals.
- Visual evidence: `customer-service-v015.png` shows the mixed queue, adaptive form and continuous rail within the existing two-column work area. At 1280 px the page remains free of horizontal overflow; the 724 px task panel, 286 px queue and primary footer action remain visible without collision with prototype controls.

### Iteration 7 - passed

- Finding addressed: unified handling was available from the queue header, but the strongest top-left card did not communicate or restore that mode. The second-row flow also lacked a group-level selected state.
- Fixes: made the current-consumer card the unified-handling entry, synchronized its pressed state with the workbasket, and added a container-level flow selection with a clear cross-status label. Focused queue mode removes the group highlight, turns the consumer card into a light return entry and keeps only one flow node selected.
- Interaction evidence: default mode exposes one overall flow selection and no individually pressed flow nodes; selecting review switches the card and flow to focused mode; selecting the consumer card restores the unified workbasket and its highest-priority item.

### Iteration 8 - passed

- Finding addressed: every focused flow node still used the same blue selected state, and the unified-mode label added a grid row that moved the work area vertically.
- Fixes: assigned blue, cyan, amber, green and red selected treatments to the five flow nodes, matching the top-row icon semantics. The unified-mode label is now an absolute border legend, while the status strip uses a fixed 62 px block size in every mode.
- Interaction evidence: switching through all five queues keeps the status strip and work-area top coordinate unchanged; each selected node exposes the intended semantic border, background, icon and number color.

## Implementation checklist

- [x] Production six-track deck structure
- [x] Current-consumer primary card
- [x] Five confirmed queue indicators
- [x] Clickable top indicators and numbered flow navigation
- [x] Bidirectional filter-state synchronization
- [x] Three meaningful today-flow connector metrics
- [x] Default cross-status unified workbasket
- [x] One adaptive form for all authorized task types
- [x] Continuous priority, next-task and defer controls
- [x] Focused queue mode remains available
- [x] Top-left unified-mode entry and group-level flow selection
- [x] Semantic selected colors for all five flow nodes
- [x] Stable status-strip height across unified and focused modes
- [x] 1440 × 900 visual regression check
- [x] 1280 px no-overflow check
- [x] Static structure and behavior tests

final result: passed
