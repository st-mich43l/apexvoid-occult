/**
 * AUTHORITATIVE fixtures must be generated from the historical worktree only:
 *
 *   git worktree add /tmp/apexvoid-po-0ac04ad \
 *     0ac04ad0875dd3de5b03036d8a673fa6b00b8a08
 *   # then run the extractor script inside that worktree
 *
 * Do NOT generate expected historical values from the current branch.
 * This file is intentionally a pointer / guard, not a generator.
 */
throw new Error(
  "Refuse: historical Palace Overview fixtures must be extracted from the 0ac04ad worktree, not current Calculation Core.",
);
