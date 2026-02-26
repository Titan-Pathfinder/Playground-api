import { Encoder } from "@msgpack/msgpack";

export interface ByteAnnotation {
  offset: number;
  length: number;
  hex: string;
  description: string;
  type: string;
}

/**
 * Encode a request to MessagePack and produce hex dump + annotations
 */
export function inspectMessagePack(
  method: string,
  params?: any
): {
  bytes: Uint8Array;
  hex: string;
  annotations: ByteAnnotation[];
  totalBytes: number;
} {
  const encoder = new Encoder({ useBigInt64: true });
  const request = { id: 0, data: { [method]: params || {} } };
  const bytes = encoder.encode(request);

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");

  // Generate annotations by analyzing the MessagePack structure
  const annotations: ByteAnnotation[] = [];
  let offset = 0;

  // MessagePack format analysis
  if (bytes.length > 0) {
    const firstByte = bytes[0];

    // fixmap (0x80-0x8f) - map with N entries
    if (firstByte >= 0x80 && firstByte <= 0x8f) {
      const mapSize = firstByte & 0x0f;
      annotations.push({
        offset: 0,
        length: 1,
        hex: bytes[0].toString(16).padStart(2, "0"),
        description: `fixmap(${mapSize}) - Root object with ${mapSize} keys`,
        type: "map",
      });
      offset = 1;
    }
    // map16 (0xde)
    else if (firstByte === 0xde) {
      annotations.push({
        offset: 0,
        length: 3,
        hex: Array.from(bytes.slice(0, 3)).map((b) => b.toString(16).padStart(2, "0")).join(" "),
        description: "map16 - Root object",
        type: "map",
      });
      offset = 3;
    }

    // Annotate the remaining bytes in chunks
    while (offset < bytes.length && annotations.length < 50) {
      const b = bytes[offset];

      // fixstr (0xa0-0xbf)
      if (b >= 0xa0 && b <= 0xbf) {
        const strLen = b & 0x1f;
        const str = new TextDecoder().decode(bytes.slice(offset + 1, offset + 1 + strLen));
        annotations.push({
          offset,
          length: 1 + strLen,
          hex: Array.from(bytes.slice(offset, offset + 1 + strLen)).map((x) => x.toString(16).padStart(2, "0")).join(" "),
          description: `fixstr("${str}")`,
          type: "string",
        });
        offset += 1 + strLen;
      }
      // str8 (0xd9)
      else if (b === 0xd9) {
        const strLen = bytes[offset + 1];
        const str = new TextDecoder().decode(bytes.slice(offset + 2, offset + 2 + strLen));
        annotations.push({
          offset,
          length: 2 + strLen,
          hex: Array.from(bytes.slice(offset, offset + 2 + strLen)).map((x) => x.toString(16).padStart(2, "0")).join(" "),
          description: `str8("${str.slice(0, 30)}${str.length > 30 ? "..." : ""}")`,
          type: "string",
        });
        offset += 2 + strLen;
      }
      // positive fixint (0x00-0x7f)
      else if (b >= 0x00 && b <= 0x7f) {
        annotations.push({
          offset,
          length: 1,
          hex: b.toString(16).padStart(2, "0"),
          description: `fixint(${b})`,
          type: "number",
        });
        offset += 1;
      }
      // uint8 (0xcc)
      else if (b === 0xcc) {
        annotations.push({
          offset,
          length: 2,
          hex: Array.from(bytes.slice(offset, offset + 2)).map((x) => x.toString(16).padStart(2, "0")).join(" "),
          description: `uint8(${bytes[offset + 1]})`,
          type: "number",
        });
        offset += 2;
      }
      // uint32 (0xce)
      else if (b === 0xce) {
        const val = new DataView(bytes.buffer, bytes.byteOffset + offset + 1, 4).getUint32(0);
        annotations.push({
          offset,
          length: 5,
          hex: Array.from(bytes.slice(offset, offset + 5)).map((x) => x.toString(16).padStart(2, "0")).join(" "),
          description: `uint32(${val})`,
          type: "number",
        });
        offset += 5;
      }
      // bin8 (0xc4)
      else if (b === 0xc4) {
        const binLen = bytes[offset + 1];
        annotations.push({
          offset,
          length: 2 + binLen,
          hex: Array.from(bytes.slice(offset, Math.min(offset + 2 + binLen, offset + 10))).map((x) => x.toString(16).padStart(2, "0")).join(" ") + (binLen > 8 ? "..." : ""),
          description: `bin8(${binLen} bytes)`,
          type: "binary",
        });
        offset += 2 + binLen;
      }
      // fixmap
      else if (b >= 0x80 && b <= 0x8f) {
        const mapSize = b & 0x0f;
        annotations.push({
          offset,
          length: 1,
          hex: b.toString(16).padStart(2, "0"),
          description: `fixmap(${mapSize})`,
          type: "map",
        });
        offset += 1;
      }
      // bool true/false
      else if (b === 0xc3) {
        annotations.push({ offset, length: 1, hex: "c3", description: "true", type: "bool" });
        offset += 1;
      }
      else if (b === 0xc2) {
        annotations.push({ offset, length: 1, hex: "c2", description: "false", type: "bool" });
        offset += 1;
      }
      else {
        // Unknown byte, skip
        annotations.push({
          offset,
          length: 1,
          hex: b.toString(16).padStart(2, "0"),
          description: `0x${b.toString(16)} (format byte)`,
          type: "unknown",
        });
        offset += 1;
      }
    }
  }

  return {
    bytes,
    hex,
    annotations,
    totalBytes: bytes.length,
  };
}
