// Signed upload. The API secret stays on the Node server.
export function validateAvatar(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Ảnh phải có dung lượng lớn hơn 0 và không quá 5 MB.');
}
async function prepareImage(file) {
  validateAvatar(file);
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error('Không thể đọc ảnh này. Vui lòng chọn ảnh khác.'); }
  try {
    if (bitmap.width * bitmap.height > 25000000) throw new Error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 25 megapixel.');
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Không thể xử lý ảnh.')), 'image/webp', 0.85));
  } finally { bitmap.close(); }
}
export async function uploadAvatar(file, signal) {
  const blob = await prepareImage(file);
  signal?.throwIfAborted();
  const signingResponse = await fetch('/api/avatar/sign', {
    method: 'POST', headers: { 'X-GymMaster-Upload': 'avatar' }, signal,
  });
  let signed;
  try { signed = await signingResponse.json(); }
  catch { throw new Error('Dịch vụ upload chưa khả dụng. Hãy chạy ứng dụng bằng npm run dev.'); }
  if (!signingResponse.ok) throw new Error(signed.error || 'Không thể chuẩn bị upload.');
  if (!signed.cloudName || !signed.signature || !signed.apiKey || !signed.params) throw new Error('Phản hồi upload không hợp lệ.');
  const body = new FormData();
  body.append('file', blob, 'avatar.webp');
  body.append('api_key', signed.apiKey);
  body.append('signature', signed.signature);
  for (const [key, value] of Object.entries(signed.params)) body.append(key, value);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`, { method: 'POST', body, signal });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('Upload Cloudinary thất bại. Vui lòng kiểm tra cấu hình và thử lại.'); }
  if (!response.ok || typeof result.secure_url !== 'string' || !result.secure_url.startsWith('https://')) throw new Error('Upload Cloudinary thất bại. Vui lòng kiểm tra cấu hình và thử lại.');
  return result.secure_url;
}
