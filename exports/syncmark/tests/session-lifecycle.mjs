import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';

function makeConn(metadata) {
  const handlers = {};
  return {
    metadata,
    open: true,
    sent: [],
    on(event, fn) { handlers[event] = fn; },
    close() { this.open = false; handlers.close?.(); },
    send(message) { this.sent.push(message); },
    emit(event, payload) { handlers[event]?.(payload); },
  };
}

function harness(app = 'twinlevel', timeoutMs = 15000) {
  const peers = [];
  const factory = (id) => {
    const handlers = {};
    const peer = {
      id: id || 'anon',
      destroyed: false,
      requestedId: id,
      outbound: null,
      on(event, fn) { handlers[event] = fn; return peer; },
      connect(hostId, options) {
        const conn = makeConn(options?.metadata);
        peer.outbound = { hostId, conn };
        return conn;
      },
      destroy() { this.destroyed = true; },
      emit(event, payload) { handlers[event]?.(payload); },
    };
    peers.push(peer);
    return peer;
  };
  const session = new Session(factory, 'phone-local-identity', app, () => {}, timeoutMs);
  return { session, peers };
}

const invalid = harness();
invalid.session.join('nope');
assert.equal(invalid.peers.length, 0);
assert.match(invalid.session.state.error, /six-character/);

const failed = harness();
failed.session.host();
assert.equal(failed.peers.length, 1);
assert.match(failed.peers[0].requestedId, /^phab2-twinlevel-[a-z2-9]{6}$/);
failed.peers[0].emit('error', { type: 'network' });
assert.equal(failed.session.state.status, 'error');
assert.equal(failed.peers[0].destroyed, true);
failed.peers[0].emit('error', { type: 'network' });
failed.peers[0].emit('disconnected');
failed.peers[0].emit('close');
assert.equal(failed.peers.length, 1);
failed.session.reconnect();
assert.equal(failed.peers.length, 2);
assert.equal(failed.session.state.status, 'opening');
assert.equal(failed.session.state.role, 'host');
failed.session.leave();

const hosted = harness('syncmark');
hosted.session.host();
hosted.peers[0].emit('open');
assert.equal(hosted.session.state.status, 'host');
hosted.session.reconnect();
assert.equal(hosted.peers[0].destroyed, true);
assert.equal(hosted.peers.length, 2);
assert.equal(hosted.session.state.status, 'opening');
hosted.session.leave();

const guest = harness('soundrace');
guest.session.join('abC123');
assert.equal(guest.session.state.code, 'ABC123');
guest.peers[0].emit('open');
assert.equal(guest.peers[0].outbound.hostId, 'phab2-soundrace-abc123');
guest.peers[0].outbound.conn.emit('open');
assert.equal(guest.session.state.status, 'guest');
guest.session.leave();
assert.equal(guest.session.state.status, 'idle');
assert.equal(guest.peers[0].destroyed, true);
guest.session.reconnect();
assert.equal(guest.peers.length, 1);

const timed = harness('sensorlink', 30);
timed.session.host();
await new Promise((resolve) => setTimeout(resolve, 80));
assert.equal(timed.session.state.status, 'error');
assert.match(timed.session.state.error, /timed out/);
await new Promise((resolve) => setTimeout(resolve, 80));
assert.equal(timed.peers.length, 1);
timed.session.leave();

console.log('Session lifecycle OK');
