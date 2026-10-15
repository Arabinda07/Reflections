---
description: Run the full quality gate (lint + tests) and write the end-of-run report
---

Run `npm run lint` and `npm test`. If either fails, fix the cause (not the assertion, unless the assertion is stale because of an intended change) and rerun until both pass.

Then report under exactly these headings:

**Blocked on me**: decisions or access only the owner can give. "Nothing" if none.
**Changed**: files and behavior changed, one line each.
**Found**: anything surprising, plus anything unverified and where you looked.
