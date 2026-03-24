let showMessageNotification = () => {};
try {
  const n = require('./notifications');
  showMessageNotification = n.showMessageNotification;
} catch(e) {}

const BASE = 'http://45.83.178.10:8008/_matrix/client/v3';
const MEDIA = 'http://45.83.178.10:8008/_matrix/media/v3';

let token = null;
let userId = null;
let deviceId = null;
let syncToken = null;
let syncRunning = false;
let rooms = {};
let listeners = [];
let presence = {};
let typingUsers = {};

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function mx(method, path, body, base = BASE) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${base}/${path}`, opts);
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || json.errcode || `HTTP ${r.status}`);
  return json;
}

function mxcUrl(mxc) {
  if (!mxc || !mxc.startsWith('mxc://')) return null;
  const parts = mxc.replace('mxc://', '').split('/');
  return `${MEDIA}/download/${parts[0]}/${parts[1]}`;
}

function mxcThumb(mxc, w = 320, h = 320) {
  if (!mxc || !mxc.startsWith('mxc://')) return null;
  const parts = mxc.replace('mxc://', '').split('/');
  return `${MEDIA}/thumbnail/${parts[0]}/${parts[1]}?width=${w}&height=${h}&method=scale`;
}

// Auth
async function login(user, pass) {
  const r = await mx('POST', 'login', {
    type: 'm.login.password', user, password: pass,
    initial_device_display_name: 'PrivateChat RN'
  });
  token = r.access_token; userId = r.user_id; deviceId = r.device_id;
  return r;
}

async function register(user, pass) {
  const r = await mx('POST', 'register', {
    username: user, password: pass,
    auth: { type: 'm.login.dummy' },
    initial_device_display_name: 'PrivateChat RN'
  });
  token = r.access_token; userId = r.user_id; deviceId = r.device_id;
  return r;
}

function restoreSession(t, uid, did) { token = t; userId = uid; deviceId = did; }

function logout() {
  token = null; userId = null; deviceId = null;
  syncToken = null; syncRunning = false; rooms = {}; presence = {}; typingUsers = {};
}

// Sync
function onRoomsUpdate(fn) { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn); }; }
function notifyListeners() { const list = getRoomList(); listeners.forEach(fn => fn(list)); }

function getRoomList() {
  return Object.values(rooms).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
}

function getRoom(id) { return rooms[id]; }

function getPresence(uid) { return presence[uid] || { status: 'offline', lastActive: 0 }; }

function getTypingInRoom(roomId) {
  const t = typingUsers[roomId] || [];
  return t.filter(u => u !== userId);
}

function getReadReceipts(roomId) {
  const room = rooms[roomId];
  return room ? (room.receipts || {}) : {};
}

async function startSync() {
  if (syncRunning) return;
  syncRunning = true;
  // Set own presence
  try { await mx('PUT', `presence/${encodeURIComponent(userId)}/status`, { presence: 'online', status_msg: '' }); } catch(_){}
  while (syncRunning) {
    try {
      const timeout = syncToken ? 30000 : 0;
      const url = `${BASE}/sync?timeout=${timeout}&set_presence=online${syncToken ? `&since=${syncToken}` : ''}`;
      const r = await fetch(url, { headers: headers() });
      if (!r.ok) { await sleep(5000); continue; }
      const data = await r.json();
      processSync(data);
      syncToken = data.next_batch;
      notifyListeners();
    } catch (e) { await sleep(5000); }
  }
}

function stopSync() { syncRunning = false; }

function processSync(data) {
  // Presence
  if (data.presence && data.presence.events) {
    for (const ev of data.presence.events) {
      if (ev.type === 'm.presence') {
        presence[ev.sender] = {
          status: ev.content.presence || 'offline',
          lastActive: ev.content.last_active_ago ? Date.now() - ev.content.last_active_ago : 0,
          statusMsg: ev.content.status_msg || ''
        };
      }
    }
  }

  if (!data.rooms) return;
  const joined = data.rooms.join || {};
  for (const [rid, jr] of Object.entries(joined)) {
    if (!rooms[rid]) rooms[rid] = { id: rid, name: '', members: {}, msgs: [], lastMsg: '', lastTs: 0, unread: 0, avatar: null, receipts: {}, pinned: false };
    const room = rooms[rid];
    for (const ev of (jr.state?.events || [])) processState(room, ev);
    for (const ev of (jr.timeline?.events || [])) {
      if (ev.type === 'm.room.message') {
        const body = ev.content?.body || '';
        const msgtype = ev.content?.msgtype || 'm.text';
        room.lastMsg = msgtype === 'm.image' ? '📷 Фото' : msgtype === 'm.audio' ? '🎤 Голосовое' : msgtype === 'm.video' ? '🎥 Видео' : msgtype === 'm.file' ? '📎 Файл' : body;
        room.lastTs = ev.origin_server_ts || 0;
        room.lastSender = ev.sender;
        // Notification for new messages from others
        if (syncToken && ev.sender !== userId) {
          const senderName = room.members[ev.sender] || ev.sender?.split(':')[0]?.slice(1) || 'Сообщение';
          showMessageNotification(senderName, room.lastMsg, rid);
        }
      }
      if (ev.state_key !== undefined) processState(room, ev);
    }
    // Ephemeral (typing, receipts)
    if (jr.ephemeral && jr.ephemeral.events) {
      for (const ev of jr.ephemeral.events) {
        if (ev.type === 'm.typing') {
          typingUsers[rid] = ev.content.user_ids || [];
        }
        if (ev.type === 'm.receipt') {
          if (!room.receipts) room.receipts = {};
          for (const [eventId, types] of Object.entries(ev.content)) {
            const readData = types['m.read'] || {};
            for (const [uid, info] of Object.entries(readData)) {
              room.receipts[uid] = { eventId, ts: info.ts };
            }
          }
        }
      }
    }
    room.unread = jr.unread_notifications?.notification_count || 0;
    if (!room.name) {
      const others = Object.entries(room.members).filter(([k]) => k !== userId);
      room.name = others.length > 0 ? (others[0][1] || others[0][0].split(':')[0].slice(1)) : rid;
    }
  }
  // Invites
  const invited = data.rooms.invite || {};
  for (const [rid, ir] of Object.entries(invited)) {
    if (!rooms[rid]) rooms[rid] = { id: rid, name: 'Приглашение', members: {}, msgs: [], lastMsg: 'Вас пригласили', lastTs: Date.now(), unread: 1, avatar: null, isInvite: true };
    for (const ev of (ir.invite_state?.events || [])) {
      if (ev.type === 'm.room.name') rooms[rid].name = ev.content?.name || rooms[rid].name;
      if (ev.type === 'm.room.member' && ev.content?.displayname) rooms[rid].name = ev.content.displayname;
    }
  }
}

function processState(room, ev) {
  if (ev.type === 'm.room.name' && ev.content?.name) room.name = ev.content.name;
  if (ev.type === 'm.room.avatar') room.avatar = ev.content?.url;
  if (ev.type === 'm.room.member') {
    const uid = ev.state_key;
    if (ev.content?.membership === 'join') room.members[uid] = ev.content?.displayname || uid;
    else if (ev.content?.membership === 'leave' || ev.content?.membership === 'ban') delete room.members[uid];
  }
}

// Messages
async function loadMessages(roomId, limit = 50) {
  const r = await mx('GET', `rooms/${encodeURIComponent(roomId)}/messages?dir=b&limit=${limit}`);
  const allEvents = r.chunk || [];
  const msgEvents = allEvents.filter(e => e.type === 'm.room.message');
  const reactionEvents = allEvents.filter(e => e.type === 'm.reaction');

  // Collect edits
  const edits = {};
  for (const e of msgEvents) {
    const rel = e.content?.['m.relates_to'];
    if (rel?.rel_type === 'm.replace' && rel?.event_id) {
      const nc = e.content?.['m.new_content'];
      if (nc) edits[rel.event_id] = nc;
    }
  }

  // Collect reactions per event
  const reactions = {};
  for (const e of reactionEvents) {
    const rel = e.content?.['m.relates_to'];
    if (rel?.rel_type === 'm.annotation' && rel?.event_id && rel?.key) {
      if (!reactions[rel.event_id]) reactions[rel.event_id] = {};
      const emoji = rel.key;
      if (!reactions[rel.event_id][emoji]) reactions[rel.event_id][emoji] = [];
      const name = rooms[roomId]?.members[e.sender] || e.sender?.split(':')[0]?.slice(1) || '?';
      reactions[rel.event_id][emoji].push({ sender: e.sender, name });
    }
  }

  return msgEvents
    .filter(e => !(e.content?.['m.relates_to']?.rel_type === 'm.replace'))
    .map(e => {
      const edited = edits[e.event_id];
      const content = edited || e.content;
      // Convert reactions to array format [{emoji, count, users}]
      const msgReactions = reactions[e.event_id] ? Object.entries(reactions[e.event_id]).map(([emoji, users]) => ({
        emoji, count: users.length, byMe: users.some(u => u.sender === userId)
      })) : [];
      return {
        id: e.event_id, sender: e.sender,
        senderName: rooms[roomId]?.members[e.sender] || e.sender?.split(':')[0]?.slice(1) || '?',
        body: content?.body || '', msgtype: content?.msgtype || 'm.text',
        ts: e.origin_server_ts || 0, isMe: e.sender === userId,
        url: content?.url, info: content?.info, filename: content?.filename, 'org.matrix.msc3245.voice': content?.['org.matrix.msc3245.voice'],
        relatesTo: e.content?.['m.relates_to'], edited: !!edited,
        reactions: msgReactions
      };
    }).reverse();
}

async function sendMessage(roomId, text) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx('PUT', `rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`, { msgtype: 'm.text', body: text });
}

async function sendImage(roomId, mxcUri, filename, mimetype, size) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx('PUT', `rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`, {
    msgtype: 'm.image', body: filename, url: mxcUri, info: { mimetype, size }
  });
}

async function sendAudio(roomId, mxcUri, duration, size) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx('PUT', `rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`, {
    msgtype: 'm.audio', body: 'Голосовое сообщение', url: mxcUri,
    info: { mimetype: 'audio/mp4', size, duration }, 'org.matrix.msc3245.voice': {}
  });
}

async function sendFile(roomId, mxcUri, filename, mimetype, size) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx('PUT', `rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`, {
    msgtype: 'm.file', body: filename, url: mxcUri, filename, info: { mimetype, size }
  });
}

async function sendReply(roomId, text, replyTo) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx('PUT', `rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`, {
    msgtype: 'm.text',
    body: `> <${replyTo.sender}> ${replyTo.body}\n\n${text}`,
    format: 'org.matrix.custom.html',
    formatted_body: `<mx-reply><blockquote>${replyTo.body}</blockquote></mx-reply>${text}`,
    'm.relates_to': { 'm.in_reply_to': { event_id: replyTo.id } }
  });
}

async function editMessage(roomId, eventId, newText) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx('PUT', `rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`, {
    msgtype: 'm.text', body: `* ${newText}`,
    'm.new_content': { msgtype: 'm.text', body: newText },
    'm.relates_to': { rel_type: 'm.replace', event_id: eventId }
  });
}

async function deleteMessage(roomId, eventId) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx('PUT', `rooms/${encodeURIComponent(roomId)}/redact/${encodeURIComponent(eventId)}/${txn}`, { reason: 'deleted' });
}

async function sendReaction(roomId, eventId, emoji) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx('PUT', `rooms/${encodeURIComponent(roomId)}/send/m.reaction/${txn}`, {
    'm.relates_to': { rel_type: 'm.annotation', event_id: eventId, key: emoji }
  });
}

async function markRead(roomId, eventId) {
  try { await mx('POST', `rooms/${encodeURIComponent(roomId)}/read_markers`, { 'm.fully_read': eventId, 'm.read': eventId }); } catch (_) {}
}

async function sendTyping(roomId, typing) {
  try { await mx('PUT', `rooms/${encodeURIComponent(roomId)}/typing/${encodeURIComponent(userId)}`, { typing, timeout: 10000 }); } catch (_) {}
}

// Rooms
async function createDM(uid) {
  return mx('POST', 'createRoom', { preset: 'trusted_private_chat', invite: [uid], is_direct: true });
}

async function createGroup(name, invites) {
  return mx('POST', 'createRoom', { preset: 'private_chat', name, invite: invites });
}

async function createChannel(name, desc, isPublic) {
  return mx('POST', 'createRoom', {
    preset: isPublic ? 'public_chat' : 'private_chat', name, topic: desc,
    power_level_content_override: { events_default: 50 },
    initial_state: [{ type: 'com.privatechat.channel', state_key: '', content: { is_channel: true, description: desc } }]
  });
}

async function leaveRoom(roomId) {
  await mx('POST', `rooms/${encodeURIComponent(roomId)}/leave`);
  delete rooms[roomId];
  notifyListeners();
}

async function joinRoom(roomId) {
  return mx('POST', `join/${encodeURIComponent(roomId)}`);
}

async function inviteUser(roomId, uid) {
  return mx('POST', `rooms/${encodeURIComponent(roomId)}/invite`, { user_id: uid });
}

async function searchUsers(query) {
  const r = await mx('POST', 'user_directory/search', { search_term: query, limit: 20 });
  return r.results || [];
}

async function getRoomMembers(roomId) {
  const r = await mx('GET', `rooms/${encodeURIComponent(roomId)}/members`);
  return (r.chunk || []).filter(e => e.content?.membership === 'join').map(e => ({
    userId: e.state_key, displayName: e.content?.displayname || e.state_key?.split(':')[0]?.slice(1),
    avatar: e.content?.avatar_url
  }));
}

// Upload
async function upload(bytes, filename, mimetype) {
  const r = await fetch(`${MEDIA}/upload?filename=${encodeURIComponent(filename)}`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': mimetype }, body: bytes
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || `Upload failed ${r.status}`);
  return json.content_uri;
}

// Profile
async function getProfile(uid) { return mx('GET', `profile/${encodeURIComponent(uid || userId)}`); }
async function setDisplayName(name) { return mx('PUT', `profile/${encodeURIComponent(userId)}/displayname`, { displayname: name }); }
async function setAvatar(mxcUrl) { return mx("PUT", `profile/${encodeURIComponent(userId)}/avatar_url`, { avatar_url: mxcUrl }); }

function getToken() { return token; }
function getUserId() { return userId; }
function getDeviceId() { return deviceId; }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sendVideoCircle(roomId, mxcUri, duration, size) {
  const txn = `m${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return mx("PUT", `rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`, {
    msgtype: "m.video", body: "Видеосообщение", url: mxcUri,
    info: { mimetype: "video/mp4", size, duration, "org.matrix.msc3245.voice": {} },
    "org.matrix.msc3245.voice": {}
  });
}
let savedRoomId = null;

async function ensureSavedRoom() {
  if (savedRoomId && rooms[savedRoomId]) return savedRoomId;
  // Look for existing saved room - just match by name
  const list = getRoomList();
  for (const r of list) {
    if (r.name === "Избранное" || r.name === "⭐ Избранное") {
      savedRoomId = r.id;
      return savedRoomId;
    }
  }
  // Create new saved room only if none found
  try {
    const res = await mx("POST", "createRoom", {
      preset: "private_chat",
      name: "Избранное",
      invite: [],
      creation_content: { "m.federate": false }
    });
    savedRoomId = res.room_id;
    if (!rooms[savedRoomId]) {
      rooms[savedRoomId] = { id: savedRoomId, name: "Избранное", members: {}, msgs: [], lastMsg: "", lastTs: Date.now(), unread: 0, avatar: null };
    }
  } catch(e) { console.log('ensureSavedRoom error:', e); }
  return savedRoomId;
}

function getSavedRoomId() { return savedRoomId; }


async function sendPoll(roomId, question, options, multi = false, anon = true) {
  const kind = anon ? 'org.matrix.msc3381.poll.undisclosed' : 'org.matrix.msc3381.poll.disclosed';
  const content = {
    'org.matrix.msc3381.poll.start': {
      question: { text: question },
      kind,
      max_selections: multi ? options.length : 1,
      answers: options.map((t, i) => ({ id: String(i), text: t }))
    }
  };
  const txn = 'm' + Date.now() + Math.random().toString(36).slice(2);
  await mx('PUT', 'rooms/' + encodeURIComponent(roomId) + '/send/m.poll.start/' + txn, content);
}

async function votePoll(roomId, pollEventId, answerId) {
  const txn = 'm' + Date.now() + Math.random().toString(36).slice(2);
  const content = {
    'm.relates_to': { rel_type: 'm.reference', event_id: pollEventId },
    'org.matrix.msc3381.poll.response': { answers: [answerId] }
  };
  await mx('PUT', 'rooms/' + encodeURIComponent(roomId) + '/send/m.poll.response/' + txn, content);
}

export default {
  login, register, restoreSession, logout,
  startSync, stopSync, onRoomsUpdate, getRoomList, getRoom,
  loadMessages, sendMessage, sendImage, sendAudio, sendFile, sendVideoCircle,
  sendReply, editMessage, deleteMessage, sendReaction, markRead, sendTyping,
  createDM, createGroup, createChannel, leaveRoom, joinRoom, inviteUser, searchUsers,
  getRoomMembers, upload, getProfile, setDisplayName, setAvatar,
  mxcUrl, mxcThumb, getPresence, getTypingInRoom, getReadReceipts,
  getToken, getUserId, getDeviceId, ensureSavedRoom, getSavedRoomId,
  sendPoll, votePoll,
};
