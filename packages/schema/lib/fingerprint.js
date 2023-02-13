"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove_fingerprint = exports.add_fingerprint = exports.check_fingerprint = exports.fingerprint = void 0;
exports.fingerprint = new Uint8Array("KATE/0v0".split("").map((x) => x.charCodeAt(0)));
function check_fingerprint(data) {
    if (data.byteLength - data.byteOffset < exports.fingerprint.length) {
        throw new Error(`Invalid cartridge: unmatched fingerprint`);
    }
    for (let i = 0; i < exports.fingerprint.length; ++i) {
        if (exports.fingerprint[i] !== data.getUint8(i)) {
            throw new Error(`Invalid cartridge: unmatched fingerprint`);
        }
    }
}
exports.check_fingerprint = check_fingerprint;
function add_fingerprint(data) {
    const result = new Uint8Array(exports.fingerprint.length + data.length);
    result.set(exports.fingerprint, 0);
    result.set(data, exports.fingerprint.length);
    return result;
}
exports.add_fingerprint = add_fingerprint;
function remove_fingerprint(data) {
    check_fingerprint(data);
    return new DataView(data.buffer.slice(exports.fingerprint.length));
}
exports.remove_fingerprint = remove_fingerprint;
