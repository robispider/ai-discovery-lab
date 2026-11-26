import type { WasteClass } from '../../engines/vision';

export const CLASS_META: Record<
  WasteClass,
  { icon: string; name: [string, string]; color: string; soft: string; binCode: string }
> = {
  organic: {
    icon: '🥬',
    name: ['Organic', 'জৈব বর্জ্য'],
    color: 'var(--ok)',
    soft: 'var(--accent-soft)',
    binCode: 'BIN-A',
  },
  plastic: {
    icon: '🧴',
    name: ['Plastic', 'প্লাস্টিক'],
    color: 'var(--c5)',
    soft: 'var(--no-soft)',
    binCode: 'BIN-B',
  },
  paper: {
    icon: '📄',
    name: ['Paper', 'কাগজ'],
    color: 'var(--c2)',
    soft: 'var(--warn-soft)',
    binCode: 'BIN-C',
  },
};
