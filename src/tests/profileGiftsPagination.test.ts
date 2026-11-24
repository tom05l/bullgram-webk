import {createRoot} from 'solid-js';

const mocks = vi.hoisted(() => ({getGifts: vi.fn()}));
vi.mock('@lib/rootScope', () => ({default: {myId: 1, managers: {appGiftsManager: {getProfileGifts: mocks.getGifts}}}}));
vi.mock('@helpers/solid/createListenerSetter', () => ({default: () => ({add: () => () => {}})}));
import {createProfileGiftsStore} from '@components/stargifts/profileStore';

beforeEach(() => {mocks.getGifts.mockReset();});

test('small first page preserves all 471 gifts and their order through scrolling', async() => {
  mocks.getGifts.mockImplementation(async({offset, limit}) => {
    const start = Number(offset || 0), end = Math.min(start + limit, 471);
    return {gifts: Array.from({length: end - start}, (_, i) => ({id: start + i})), count: 471, next: end < 471 ? String(end) : undefined, collections: []};
  });
  let dispose!: () => void;
  const onCountChange = vi.fn();
  const [store, actions] = createRoot((end) => {dispose = end; return createProfileGiftsStore({peerId: 1 as PeerId, onCountChange});});
  try {
    await actions.loadNext();
    expect(store.items).toHaveLength(24);
    expect(store.loaded).toBe(false);
    expect(onCountChange).toHaveBeenCalledWith(471);
    while(!store.loaded) await actions.loadNext();
    expect(store.items.map((item: any) => item.id)).toEqual(Array.from({length: 471}, (_, i) => i));
    expect(mocks.getGifts).toHaveBeenCalledTimes(20);
    expect(mocks.getGifts.mock.calls.every(([params]) => params.limit === 24)).toBe(true);
    await actions.loadNext();
    expect(mocks.getGifts).toHaveBeenCalledTimes(20);
  } finally {dispose();}
});

test('repeated scroll events do not duplicate an in-flight gift page', async() => {
  let resolve!: (value: any) => void;
  mocks.getGifts.mockImplementation(() => new Promise((done) => {resolve = done;}));
  let dispose!: () => void;
  const [store, actions] = createRoot((end) => {dispose = end; return createProfileGiftsStore({peerId: 1 as PeerId});});
  try {
    const first = actions.loadNext();
    await actions.loadNext();
    expect(mocks.getGifts).toHaveBeenCalledTimes(1);
    resolve({gifts: [{id: 1}], count: 1, next: undefined, collections: []});
    await first;
    expect(store.items).toHaveLength(1);
    expect(store.loaded).toBe(true);
    expect(store.loading).toBe(false);
  } finally {dispose();}
});
