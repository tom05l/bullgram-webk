import TcpObfuscated from '@lib/mtproto/transports/tcpObfuscated';

vi.mock('@lib/mtproto/transports/obfuscation', () => ({default: class {
  public decode = async(data: Uint8Array) => data;
  public destroy() {}
}}));

class Connection {
  public listeners = new Map<string, (...args: any[]) => any>();
  public addEventListener(name: string, fn: (...args: any[]) => any) { this.listeners.set(name, fn); }
  public removeEventListener(name: string) { this.listeners.delete(name); }
  public send() {}
  public close() {}
}

test('transport serializes crypto and delivers all fragmented/coalesced replies in order', async() => {
  const transport = new TcpObfuscated(Connection as any, 2, 'wss://webk.duckdns.org/apiws', '', 1000);
  let concurrent = 0, maximum = 0;
  (transport as any).obfuscation.decode = async(data: Uint8Array) => {
    maximum = Math.max(maximum, ++concurrent);
    await new Promise((resolve) => setTimeout(resolve, data[0] === 2 ? 10 : 1));
    --concurrent;
    return data;
  };
  const delivered: number[][] = [];
  transport.networker = {onTransportData: async(data: Uint8Array) => {
    await Promise.resolve();
    delivered.push([...data]);
  }} as any;
  const receive = (transport.connection as unknown as Connection).listeners.get('message')!;
  receive(new Uint8Array([2, 1, 2]).buffer);
  receive(new Uint8Array([3, 4, 5, 6, 7, 8, 1, 9, 10, 11, 12]).buffer);
  await (transport as any).receiveQueue;
  expect(maximum).toBe(1);
  expect(delivered).toEqual([[1, 2, 3, 4, 5, 6, 7, 8], [9, 10, 11, 12]]);
  transport.networker = undefined;
  transport.destroy();
});
