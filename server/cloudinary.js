import { createHash, randomUUID } from 'node:crypto';

export function createUploadSignature(cloudinaryUrl) {
  let config;
  try { config = new URL(cloudinaryUrl); } catch { throw new Error('CLOUDINARY_URL chưa được cấu hình hợp lệ trong .env.local.'); }
  if (config.protocol !== 'cloudinary:' || !config.username || !config.password || !config.hostname) throw new Error('CLOUDINARY_URL chưa được cấu hình hợp lệ trong .env.local.');
  const params = {
    folder: 'gymmaster/avatars',
    public_id: randomUUID(),
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const payload = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  const signature = createHash('sha256').update(payload + decodeURIComponent(config.password)).digest('hex');
  return { cloudName: config.hostname, apiKey: decodeURIComponent(config.username), signature, params };
}

// Development only. The app currently uses local demo accounts.
// A deployed signing endpoint MUST authenticate users and enforce upload quotas.
export function cloudinaryDevPlugin(cloudinaryUrl) {
  return {
    name: 'gymmaster-cloudinary-dev',
    apply: 'serve',
    configureServer(server) {
      let lastRequest = 0;
      server.middlewares.use('/api/avatar/sign', (req, res) => {
        const reply = (status, data) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(data));
        };
        if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); reply(405, { error: 'Method not allowed.' }); return; }
        const remote = req.socket.remoteAddress;
        let origin;
        try { origin = new URL(req.headers.origin); } catch { reply(403, { error: 'Chỉ hỗ trợ upload từ ứng dụng trên localhost.' }); return; }
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote) || !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) || origin.host !== req.headers.host || req.headers['x-gymmaster-upload'] !== 'avatar') {
          reply(403, { error: 'Endpoint test chỉ hỗ trợ trình duyệt cùng nguồn trên localhost.' }); return;
        }
        if (!cloudinaryUrl) { reply(503, { error: 'Chưa cấu hình CLOUDINARY_URL trong .env.local. Thêm cấu hình phía server rồi khởi động lại Vite.' }); return; }
        if (Date.now() - lastRequest < 2000) { reply(429, { error: 'Vui lòng đợi vài giây trước khi tải ảnh tiếp theo.' }); return; }
        try { const result = createUploadSignature(cloudinaryUrl); lastRequest = Date.now(); reply(200, result); }
        catch { reply(503, { error: 'Cấu hình Cloudinary không hợp lệ. Vui lòng kiểm tra .env.local.' }); }
      });
    },
  };
}
