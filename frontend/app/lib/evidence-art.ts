export type SceneArt = 'wall' | 'furniture' | 'checkout' | 'chat' | 'desk';

const KEY_ART: Record<string, SceneArt> = {
  wall: 'wall', photo: 'wall', 'movein-photo': 'wall', 'photo-scratch': 'wall',
  furniture: 'furniture', inventory: 'furniture',
  keys: 'checkout', checkout: 'checkout',
  chat: 'chat', transfer: 'chat', 'chat-old-damage': 'chat',
  contract: 'desk', repair: 'desk', 'contract-deposit': 'desk', 'repair-no-proof': 'desk',
};

export function exhibitKey(id: string) {
  const match = id.match(/(?:^|-)(?:spot|doc|ev|clue)-(.+)$/);
  return match ? match[1] : id;
}

export function artworkFor(id: string, type = 'doc'): SceneArt {
  const key = exhibitKey(id);
  if (KEY_ART[key]) return KEY_ART[key];
  if (type === 'chat') return 'chat';
  if (type === 'image' || type === 'img') return 'wall';
  return 'desk';
}

type EvidenceArtCase = {
  scenes: Array<{ hotspots: Array<{ id: string; evidenceId: string }> }>;
  evidence: Array<{ id: string; type?: string; sourceDocumentId?: string }>;
  documents: Array<{ id: string; type: string; hotspots: Array<{ evidenceId: string }> }>;
};

/** Follow the exhibit back to its collection spot, never the hand slot or draw ID. */
export function artworkForEvidence(demo: EvidenceArtCase, evidenceId: string): SceneArt {
  const spot = demo.scenes.flatMap((scene) => scene.hotspots).find((item) => item.evidenceId === evidenceId);
  if (spot) return artworkFor(spot.id);
  const evidence = demo.evidence.find((item) => item.id === evidenceId);
  const document = demo.documents.find((item) => item.id === evidence?.sourceDocumentId)
    || demo.documents.find((item) => item.hotspots.some((clue) => clue.evidenceId === evidenceId));
  return document ? artworkFor(document.id, document.type) : artworkFor(evidenceId, evidence?.type);
}
