from __future__ import annotations

import hashlib
import os
import struct
from pathlib import Path

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from orion.constants.constant import CONSTANTS

MAGIC = b"ORIONTENANTEXPORT\x01"
NONCE_SIZE = 12
CHUNK_SIZE = 1024 * 1024
RECORD_HEADER = struct.Struct(">IB")


class ExportCipher:

    @staticmethod
    def _key() -> bytes:
        return hashlib.sha256(f"orion-tenant-export:{CONSTANTS.S_ENCRYPTION_KEY}".encode()).digest()

    @staticmethod
    def _nonce(base: bytes, index: int) -> bytes:
        return (int.from_bytes(base, "big") ^ index).to_bytes(NONCE_SIZE, "big")

    @staticmethod
    def _aad(index: int, final: bool) -> bytes:
        return RECORD_HEADER.pack(index, int(final))

    @classmethod
    def encrypt_stream(cls, chunks):
        aead = AESGCM(cls._key())
        base = os.urandom(NONCE_SIZE)
        yield MAGIC + base
        index = 0
        pending = b""
        for data in chunks:
            pending += data
            while len(pending) >= CHUNK_SIZE:
                block, pending = pending[:CHUNK_SIZE], pending[CHUNK_SIZE:]
                sealed = aead.encrypt(cls._nonce(base, index), block, cls._aad(index, False))
                yield RECORD_HEADER.pack(len(sealed), 0) + sealed
                index += 1
        sealed = aead.encrypt(cls._nonce(base, index), pending, cls._aad(index, True))
        yield RECORD_HEADER.pack(len(sealed), 1) + sealed

    @classmethod
    def decrypt_to_file(cls, handle, target: Path) -> None:
        aead = AESGCM(cls._key())
        header = handle.read(len(MAGIC) + NONCE_SIZE)
        if not header.startswith(MAGIC) or len(header) != len(MAGIC) + NONCE_SIZE:
            raise ValueError("not an export from this server")
        base = header[len(MAGIC):]
        index = 0
        with target.open("wb") as output:
            while True:
                record = handle.read(RECORD_HEADER.size)
                if len(record) != RECORD_HEADER.size:
                    raise ValueError("export is truncated")
                size, final = RECORD_HEADER.unpack(record)
                sealed = handle.read(size)
                if len(sealed) != size:
                    raise ValueError("export is truncated")
                try:
                    output.write(aead.decrypt(cls._nonce(base, index), sealed, cls._aad(index, bool(final))))
                except InvalidTag as exc:
                    raise ValueError("export was modified or belongs to another server") from exc
                if final:
                    return
                index += 1
