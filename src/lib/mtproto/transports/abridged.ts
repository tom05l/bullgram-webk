import {Codec} from '@lib/mtproto/transports/codec';

class AbridgedPacketCodec implements Codec {
  public tag = 0xef;
  public obfuscateTag = new Uint8Array([this.tag, this.tag, this.tag, this.tag]);

  public encodePacket(data: Uint8Array) {
    const len = data.byteLength >> 2;
    let header: Uint8Array;
    if(len < 127) {
      header = new Uint8Array([len]);
    } else { // Length: payload length, divided by four, and encoded as 3 length bytes (little endian)
      // header = new Uint8Array([0x7f, ...addPadding(bytesFromHex(len.toString(16)).reverse(), 3, true)/* .reverse() */]);
      header = new Uint8Array([0x7f, len & 0xFF, (len >> 8) & 0xFF, (len >> 16) & 0xFF]);
      // console.log('got nobody cause im braindead', header, len);
    }

    return header.concat(data);
    // return new Uint8Array([...header, ...data]);
  }

  public readPacket(data: Uint8Array) {
    let length = data[0];
    if(length >= 127) { // 0x7f
      length = data[1] | (data[2] << 8) | (data[3] << 16);

      return data.slice(4, 4 + (length << 2)); // need +1
    }

    return data.slice(1, 1 + (length << 2)); // need +1
  }
}

export default new AbridgedPacketCodec();

// WebSocket messages from a TCP bridge may split or combine transport packets.
export class AbridgedPacketStream {
  private buffer = new Uint8Array(0);

  public push(chunk: Uint8Array): Uint8Array[] {
    const joined = new Uint8Array(this.buffer.length + chunk.length);
    joined.set(this.buffer);
    joined.set(chunk, this.buffer.length);
    const packets: Uint8Array[] = [];
    let offset = 0;
    while(offset < joined.length) {
      const tag = joined[offset];
      if(tag > 127 || tag === 0) throw new Error('Invalid abridged packet header');
      const header = tag === 127 ? 4 : 1;
      if(joined.length - offset < header) break;
      const words = header === 1 ? tag : joined[offset + 1] | (joined[offset + 2] << 8) | (joined[offset + 3] << 16);
      const length = words * 4;
      if(!length || length > 16 * 1024 * 1024) throw new Error('Invalid abridged packet length');
      if(joined.length - offset < header + length) break;
      packets.push(joined.slice(offset + header, offset + header + length));
      offset += header + length;
    }
    this.buffer = joined.slice(offset);
    return packets;
  }
}
