"""Bounded PNG structure, CRC, raster-length, and scanline validation.

No pixel transformations: imported bytes and their SHA-256 identity are retained.
"""
import struct
import zlib

from .core import Invalid

MAX_BYTES = 30 * 1024 * 1024
MAX_PIXELS = 24_000_000


def inspect_png(data):
    if not isinstance(data, bytes) or not 8 < len(data) <= MAX_BYTES or data[:8] != b"\x89PNG\r\n\x1a\n":
        raise Invalid("Choose a PNG of at most 30 MiB")
    offset, chunks, compressed, header, palette = 8, [], [], None, False
    while offset < len(data):
        if offset + 12 > len(data):
            raise Invalid("Truncated PNG chunk")
        size, kind = struct.unpack(">I4s", data[offset:offset + 8])
        if any(not (65 <= value <= 90 or 97 <= value <= 122) for value in kind) or not kind[2:3].isupper():
            raise Invalid("Invalid PNG chunk type")
        if kind in (b"acTL", b"fcTL", b"fdAT"):
            raise Invalid("Animated PNGs cannot be static references or screenshots")
        end = offset + 12 + size
        if end > len(data) or size > MAX_BYTES:
            raise Invalid("Invalid PNG chunk length")
        payload = data[offset + 8:end - 4]
        checksum = struct.unpack(">I", data[end - 4:end])[0]
        if zlib.crc32(kind + payload) & 0xffffffff != checksum:
            raise Invalid("PNG chunk checksum mismatch")
        if not chunks and kind != b"IHDR":
            raise Invalid("PNG must begin with IHDR")
        if kind == b"IHDR":
            if chunks or size != 13:
                raise Invalid("Invalid PNG header")
            header = struct.unpack(">IIBBBBB", payload)
        elif kind == b"PLTE":
            if palette or compressed or not size or size % 3 or size > 768:
                raise Invalid("Invalid PNG palette")
            palette = True
        elif kind == b"IDAT":
            if b"IDAT" in chunks and chunks[-1] != b"IDAT":
                raise Invalid("PNG image chunks must be consecutive")
            compressed.append(payload)
        elif kind == b"IEND":
            if size or end != len(data):
                raise Invalid("Unexpected bytes after PNG end")
            chunks.append(kind)
            break
        elif kind[:1].isupper():
            raise Invalid("Unsupported critical PNG chunk")
        chunks.append(kind)
        offset = end
    if not header or not compressed or chunks[-1] != b"IEND":
        raise Invalid("PNG is missing image data or end marker")
    width, height, depth, color, compression, filtering, interlace = header
    allowed = {0: (1, 2, 4, 8, 16), 2: (8, 16), 3: (1, 2, 4, 8), 4: (8, 16), 6: (8, 16)}
    if (not width or not height or width * height > MAX_PIXELS or width > 24000 or height > 24000
            or depth not in allowed.get(color, ()) or compression or filtering or interlace not in (0, 1)
            or (color == 3 and not palette)):
        raise Invalid("Unsupported PNG dimensions, color mode, or encoding")
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color]
    passes = [(0, 0, 1, 1)] if interlace == 0 else [
        (0, 0, 8, 8), (4, 0, 8, 8), (0, 4, 4, 8), (2, 0, 4, 4),
        (0, 2, 2, 4), (1, 0, 2, 2), (0, 1, 1, 2)]
    rows = []
    for x, y, dx, dy in passes:
        w, h = max(0, (width - x + dx - 1) // dx), max(0, (height - y + dy - 1) // dy)
        if w and h:
            rows.extend([1 + (w * channels * depth + 7) // 8] * h)
    expected = sum(rows)
    if expected > 192_000_000:
        raise Invalid("PNG raster exceeds the decoded size limit")
    try:
        decoder = zlib.decompressobj()
        raster = decoder.decompress(b"".join(compressed), expected + 1)
    except zlib.error as error:
        raise Invalid("Invalid compressed PNG raster") from error
    if len(raster) != expected or not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
        raise Invalid("PNG raster length does not match its dimensions")
    position = 0
    for length in rows:
        if raster[position] > 4:
            raise Invalid("Invalid PNG scanline filter")
        position += length
    return {"width": width, "height": height, "bytes": len(data)}
