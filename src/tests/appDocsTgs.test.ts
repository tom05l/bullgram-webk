import {AppDocsManager} from '@appManagers/appDocsManager';
import StickerType from '@config/stickerType';
import {getEnvironment, setEnvironment} from '@environment/utils';

let previous: ReturnType<typeof getEnvironment>;
beforeEach(() => {
  previous = getEnvironment();
  setEnvironment({IS_WEBP_SUPPORTED: true, IS_WEBM_SUPPORTED: true} as any);
});
afterEach(() => setEnvironment(previous));

function manager() {
  const instance = new AppDocsManager();
  Object.assign(instance as any, {docs: {}, altDocsByMainMediaDocument: {}});
  return instance;
}

function document(fileName?: string, mime = 'application/x-tgsticker', attribute = 'documentAttributeCustomEmoji') {
  return {
    _: 'document', id: '12345', access_hash: '0', date: 1, dc_id: 2, size: 1024,
    mime_type: mime, pFlags: {}, attributes: [
      {_: attribute, pFlags: {}, alt: '🎁', stickerset: {_: 'inputStickerSetEmpty'}},
      ...(fileName ? [{_: 'documentAttributeFilename', file_name: fileName}] : [])
    ]
  } as any;
}

describe('Bullgram TGS documents', () => {
  test.each(['0.tgs', 'model.tgs', 'gift-model.tgs', 'emoji.tgs', 'AnimatedSticker.tgs', undefined])('recognizes TGS %s regardless of filename', (name) => {
    const doc = manager().saveDoc(document(name));
    expect(doc.type).toBe('sticker');
    expect(doc.sticker).toBe(StickerType.Lottie);
    expect(doc.animated).toBe(true);
  });
  test('recognizes gift TGS without custom-emoji attributes', () => {
    const input = document('gift.tgs');
    input.attributes = [{_: 'documentAttributeFilename', file_name: 'gift.tgs'}];
    expect(manager().saveDoc(input).sticker).toBe(StickerType.Lottie);
  });
  test('repairs a cached document classified before the fix', () => {
    const instance = manager();
    const stale = {id: '12345', type: 'photo', sticker: StickerType.Static};
    (instance as any).docs['12345'] = stale;
    const saved = instance.saveDoc(document('0.tgs'));
    expect(saved).toBe(stale);
    expect(saved.sticker).toBe(StickerType.Lottie);
    expect(saved.type).toBe('sticker');
  });
  test.each([['image/webp', StickerType.Static], ['video/webm', StickerType.WebM]])('keeps %s in its own renderer', (mime, type) => {
    expect(manager().saveDoc(document('0.tgs', mime)).sticker).toBe(type);
  });
  test('does not treat arbitrary filenames as TGS with another MIME type', () => {
    expect(manager().saveDoc(document('0.tgs', 'application/octet-stream')).sticker).not.toBe(StickerType.Lottie);
  });
});
