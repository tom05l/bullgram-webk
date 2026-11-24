import {AppEmojiManager} from '@appManagers/appEmojiManager';

function manager() {
  const value = new AppEmojiManager();
  Object.assign(value as any, {appDocsManager: {getDoc: (): undefined => undefined}});
  return value;
}

beforeEach(() => {vi.useFakeTimers();});
afterEach(() => {vi.useRealTimers();});

test('missing emoji documents settle once instead of retrying forever', async() => {
  const value = manager();
  const fetch = vi.spyOn(value, 'getCustomEmojiDocuments').mockResolvedValue([]);
  const promises = ['1', '2', '3'].map(id => value.getCustomEmojiDocument(id as DocId));
  await vi.advanceTimersByTimeAsync(1);
  await expect(Promise.all(promises)).resolves.toEqual([undefined, undefined, undefined]);
  await vi.advanceTimersByTimeAsync(1000);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect((value as any).getCustomEmojiDocumentPromises.size).toBe(0);
});

test('partial and reordered responses match requested IDs instead of array positions', async() => {
  const value = manager();
  const a = {id: '1'} as any, c = {id: '3'} as any;
  vi.spyOn(value, 'getCustomEmojiDocuments').mockResolvedValue([c, a]);
  const promises = ['1', '2', '3'].map(id => value.getCustomEmojiDocument(id as DocId));
  await vi.advanceTimersByTimeAsync(1);
  await expect(Promise.all(promises)).resolves.toEqual([a, undefined, c]);
});

test('batch boundary preserves every document across 100-item chunks', async() => {
  const value = manager();
  const fetch = vi.spyOn(value, 'getCustomEmojiDocuments').mockImplementation(async ids => ids.slice().reverse().map(id => ({id})) as any);
  const ids = Array.from({length: 103}, (_, i) => String(i + 1));
  const promises = ids.map(id => value.getCustomEmojiDocument(id as DocId));
  await vi.advanceTimersByTimeAsync(1);
  const result = await Promise.all(promises);
  expect(result.map(doc => doc?.id)).toEqual(ids);
  expect(fetch.mock.calls.map(([ids]) => ids.length)).toEqual([100, 3]);
});

test('unexpected decode failures reject waiters and release the queue', async() => {
  const value = manager();
  vi.spyOn(value, 'getCustomEmojiDocuments').mockRejectedValue(Error('invalid document'));
  const outcomes = Promise.allSettled(['1', '2'].map(id => value.getCustomEmojiDocument(id as DocId)));
  await vi.advanceTimersByTimeAsync(1);
  expect((await outcomes).map(result => result.status)).toEqual(['rejected', 'rejected']);
  expect((value as any).getCustomEmojiDocumentPromises.size).toBe(0);
});
