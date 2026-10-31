import { describe, expect, it } from 'vitest';
import { attentionFor } from './attention';
import { aggregateCi, buildProject, isTrackedDoc, parseInbox, parseProjectsJson, parseTask, splitFrontMatter } from './parse';

describe('splitFrontMatter', () => {
  it('parses YAML with trailing comments and empty values', () => {
    const { meta, body } = splitFrontMatter('---\nstatus: ready   # comment\npr:\ndate: 2026-10-31\n---\n\nBody\n');
    expect(meta).toEqual({ status: 'ready', pr: null, date: '2026-10-31' });
    expect(body).toBe('Body');
  });
  it('tolerates missing or broken front matter', () => {
    expect(splitFrontMatter('# Just text').meta).toEqual({});
    expect(splitFrontMatter('---\n: [bad\n---\nx').meta).toEqual({});
  });
});

describe('parseTask', () => {
  it('normalises fields and falls back on the filename', () => {
    const t = parseTask('tasks/T-012-thing.md', '---\nstatus: In-Progress\ncontext: [a.md, b.md]\ndone_when: one\n---\nnotes');
    expect(t).toMatchObject({ id: 'T-012', status: 'in-progress', owner: 'claude', context: ['a.md', 'b.md'], doneWhen: ['one'], pr: '' });
  });
  it('treats unknown statuses as backlog', () => {
    expect(parseTask('tasks/x.md', '---\nstatus: someday\n---').status).toBe('backlog');
  });
});

describe('parseInbox', () => {
  it('collects checklist items with sections and skips placeholders', () => {
    const items = parseInbox('## Needs a decision (owner)\n\n- [ ] Pick engine\n- [x] Name\n- [ ] _Example_\n\n## Ideas\n\n- free idea\n- [ ] Playtest: jump');
    expect(items).toEqual([
      { section: 'Needs a decision (owner)', text: 'Pick engine', checked: false },
      { section: 'Needs a decision (owner)', text: 'Name', checked: true },
      { section: 'Ideas', text: 'Playtest: jump', checked: false },
    ]);
  });
});

describe('isTrackedDoc', () => {
  it('ignores templates, readmes and nested files', () => {
    expect(isTrackedDoc('tasks/T-001-a.md', 'tasks')).toBe(true);
    expect(isTrackedDoc('tasks/_template.md', 'tasks')).toBe(false);
    expect(isTrackedDoc('tasks/README.md', 'tasks')).toBe(false);
    expect(isTrackedDoc('tasks/old/T-1.md', 'tasks')).toBe(false);
    expect(isTrackedDoc('devlog/x.md', 'tasks')).toBe(false);
  });
});

describe('aggregateCi', () => {
  it('prioritises pending, then failure', () => {
    expect(aggregateCi([])).toBe('none');
    expect(aggregateCi([{ status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'skipped' }])).toBe('success');
    expect(aggregateCi([{ status: 'completed', conclusion: 'failure' }, { status: 'completed', conclusion: 'success' }])).toBe('failure');
    expect(aggregateCi([{ status: 'in_progress', conclusion: null }, { status: 'completed', conclusion: 'failure' }])).toBe('pending');
  });
});

describe('parseProjectsJson', () => {
  it('accepts strings, objects and a wrapper', () => {
    expect(parseProjectsJson('["a/b"]')).toEqual([{ repo: 'a/b' }]);
    expect(parseProjectsJson('{"projects":[{"repo":"a/b","branch":"dev"}]}')).toEqual([{ repo: 'a/b', branch: 'dev' }]);
    expect(() => parseProjectsJson('[{"repo":"nope"}]')).toThrow();
  });
});

describe('buildProject + attentionFor', () => {
  it('surfaces what needs the owner, CI first', () => {
    const text = new Map([
      ['project.yml', 'name: Game\nmilestone: M1'],
      ['inbox.md', '## Needs a decision\n- [ ] Engine?\n## Ideas\n- [ ] Playtest: feel'],
      ['tasks/T-001-a.md', '---\nstatus: ready\nowner: human\ntitle: Decide\n---'],
      ['tasks/T-002-b.md', '---\nstatus: blocked\ntitle: Stuck\n---'],
      ['tasks/T-003-c.md', '---\nstatus: done\nowner: human\n---'],
      ['devlog/2026-10-01-a.md', '---\ndate: 2026-10-01\n---\nold'],
      ['devlog/2026-10-05-b.md', 'no front matter'],
    ]);
    const p = buildProject(
      { repo: 'o/game' },
      { branch: 'main', htmlUrl: 'https://github.com/o/game', hasKit: true, ci: 'failure', prs: [
        { number: 3, title: 'PR', url: 'u', draft: false, author: 'c', updatedAt: '', ci: 'success' },
        { number: 4, title: 'Draft', url: 'u', draft: true, author: 'c', updatedAt: '', ci: 'none' },
      ] },
      { text, media: [] },
    );
    expect(p.meta.name).toBe('Game');
    expect(p.devlog.map((d) => d.date)).toEqual(['2026-10-05', '2026-10-01']);
    expect(attentionFor(p).map((a) => a.kind)).toEqual(['ci', 'review', 'decision', 'human-task', 'playtest', 'blocked']);
  });
});
