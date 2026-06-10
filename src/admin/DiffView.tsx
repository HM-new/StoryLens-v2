import { useMemo } from 'react';
import { diffLines } from 'diff';

interface Props {
  before: string;
  after: string;
}

// Groups consecutive added/removed/unchanged lines into blocks so we can
// render long unchanged regions collapsed and changes prominently.
interface Block {
  type: 'unchanged' | 'added' | 'removed';
  lines: string[];
}

function buildBlocks(before: string, after: string): Block[] {
  const parts = diffLines(before, after);
  const blocks: Block[] = [];
  for (const part of parts) {
    const lines = part.value.replace(/\n$/, '').split('\n');
    if (part.added) blocks.push({ type: 'added', lines });
    else if (part.removed) blocks.push({ type: 'removed', lines });
    else blocks.push({ type: 'unchanged', lines });
  }
  return blocks;
}

// Collapse runs of unchanged context to N lines of context around each change.
function withContext(blocks: Block[], context: number): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type !== 'unchanged') {
      out.push(b);
      continue;
    }
    const isFirst = i === 0;
    const isLast = i === blocks.length - 1;
    if (b.lines.length <= context * 2 + 1) {
      out.push(b);
      continue;
    }
    // Keep first N lines (unless at very start), last N lines (unless at very end),
    // and a "(N lines unchanged)" marker in between.
    const head = isFirst ? [] : b.lines.slice(0, context);
    const tail = isLast ? [] : b.lines.slice(-context);
    const hidden = b.lines.length - head.length - tail.length;
    if (head.length) out.push({ type: 'unchanged', lines: head });
    out.push({ type: 'unchanged', lines: [`… ${hidden} lines unchanged …`] });
    if (tail.length) out.push({ type: 'unchanged', lines: tail });
  }
  return out;
}

export default function DiffView({ before, after }: Props) {
  const blocks = useMemo(() => withContext(buildBlocks(before, after), 3), [before, after]);

  let added = 0,
    removed = 0;
  for (const b of blocks) {
    if (b.type === 'added') added += b.lines.length;
    else if (b.type === 'removed') removed += b.lines.length;
  }

  return (
    <div className="diff-view">
      <div className="diff-summary">
        <span style={{ color: '#15803d' }}>+{added}</span>{' '}
        <span style={{ color: '#b91c1c' }}>−{removed}</span> lines changed
      </div>
      <pre className="diff-body">
        {blocks.map((b, idx) => (
          <div key={idx} className={`diff-block diff-${b.type}`}>
            {b.lines.map((line, j) => (
              <div key={j} className="diff-line">
                <span className="diff-marker">
                  {b.type === 'added' ? '+' : b.type === 'removed' ? '−' : ' '}
                </span>
                <span className="diff-text">{line}</span>
              </div>
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}
