/* ===== 録音のしくみ（端末のマイクで録って、その場で聞き返す） =====
   ・マイクの許可は最初の1回だけ（同じ練習の中では使い回す）。
   ・録音はこの端末の中だけで扱い、どこにも送らない。 */
const REC = (() => {
  const can = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  let stream = null, mr = null, chunks = [], t0 = 0, stopTimer = 0, tick = 0;
  const pickMime = () => {
    const c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
    try { for (const m of c) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m; } catch (e) {}
    return '';
  };
  async function getStream() {
    if (stream && stream.active) return stream;
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    return stream;
  }
  /* 録音を始める。onTick(秒) は1秒ごと、onDone({blob,url,dur,mime}) は止めたとき */
  async function start({ max = 30, onTick, onDone, onError } = {}) {
    if (!can) { if (onError) onError('unsupported'); return false; }
    if (mr && mr.state !== 'inactive') return false;
    try { await getStream(); }
    catch (e) { if (onError) onError(e && e.name === 'NotAllowedError' ? 'denied' : 'nomic'); return false; }
    const mime = pickMime();
    try { mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); }
    catch (e) { try { mr = new MediaRecorder(stream); } catch (e2) { if (onError) onError('unsupported'); return false; } }
    chunks = [];
    const me = mr;
    me.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    me.onstop = () => {
      clearTimeout(stopTimer); clearInterval(tick);
      const type = (me.mimeType || mime || 'audio/webm').split(';')[0];
      const blob = new Blob(chunks, { type });
      const dur = Math.max(0, (Date.now() - t0) / 1000);
      if (onDone) onDone(blob.size ? { blob, url: URL.createObjectURL(blob), dur, mime: type } : null);
    };
    t0 = Date.now();
    me.start();
    if (onTick) { onTick(0); tick = setInterval(() => onTick(Math.floor((Date.now() - t0) / 1000)), 250); }
    stopTimer = setTimeout(stop, max * 1000);
    return true;
  }
  function stop() { clearTimeout(stopTimer); if (mr && mr.state !== 'inactive') { try { mr.stop(); } catch (e) {} } }
  function release() { stop(); if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch (e) {} stream = null; } }
  const busy = () => !!(mr && mr.state === 'recording');
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  return { can, start, stop, release, busy };
})();
const REC_ERR = {
  denied: 'マイクが 使えません。ブラウザの 設定で マイクを「許可」に して ください。',
  nomic: 'マイクが 見つかりません。',
  unsupported: 'この 端末[たんまつ]では 録音[ろくおん]できません。',
};
