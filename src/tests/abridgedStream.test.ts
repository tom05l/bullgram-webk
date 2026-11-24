import codec, {AbridgedPacketStream} from '@lib/mtproto/transports/abridged';

function packet(size: number, value: number) {
  const body = new Uint8Array(size).fill(value);
  const words = size / 4;
  const header = words < 127 ? [words] : [127, words & 255, (words >> 8) & 255, (words >> 16) & 255];
  return {body, wire: new Uint8Array([...header, ...body])};
}

describe('abridged packets carried over a TCP/WebSocket stream', () => {
  test.each([4, 504, 508, 65536, 800000])('reassembles a %i byte response across TCP reads', (size) => {
    const {body, wire} = packet(size, 42);
    const stream = new AbridgedPacketStream();
    const packets: Uint8Array[] = [];
    for(let offset = 0; offset < wire.length; offset += 16381) packets.push(...stream.push(wire.slice(offset, offset + 16381)));
    expect(packets).toEqual([body]);
  });
  test('retains each partial extended header and separates combined packets', () => {
    const a = packet(508, 17), b = packet(8, 23);
    const stream = new AbridgedPacketStream();
    for(let i = 0; i < 3; ++i) expect(stream.push(a.wire.slice(i, i + 1))).toEqual([]);
    const remainder = new Uint8Array([...a.wire.slice(3), ...b.wire, ...a.wire.slice(0, 10)]);
    expect(stream.push(remainder)).toEqual([a.body, b.body]);
    expect(stream.push(a.wire.slice(10))).toEqual([a.body]);
  });
  test('codec returns exactly one packet without trailing bytes', () => {
    for(const size of [8, 508]) {
      const a = packet(size, 9);
      expect(codec.readPacket(new Uint8Array([...a.wire, 5, 6, 7]))).toEqual(a.body);
    }
  });
  test.each([[0], [128], [127, 0, 0, 0], [127, 255, 255, 255]])('rejects invalid or oversized frame %j', (...bytes) => {
    expect(() => new AbridgedPacketStream().push(new Uint8Array(bytes))).toThrow();
  });
});
