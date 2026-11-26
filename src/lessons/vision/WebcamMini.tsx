/*
 * Optional local-only webcam sampler for Lesson 7.
 * Never starts automatically; only opens when the user clicks "Start live webcam".
 * Downsamples each frame onto an offscreen 10×10 canvas so the exact same transfer-learning
 * feature extractor and softmax head classify real objects completely offline.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  extractFeaturesFromRgbGrid,
  predictHead,
  WASTE_CLASSES,
  type PixelGrid,
  type WasteClass,
  type WasteHeadModel,
} from '../../engines/vision';
import { useT } from '../../i18n';
import { Bars } from '../kit';
import { CLASS_META } from './meta';

interface Props {
  mode: 'capture' | 'predict';
  model: WasteHeadModel;
  minConfidence: number;
  onCapture?: (
    label: WasteClass,
    features: readonly [number, number, number, number, number, number],
    name: string,
  ) => void;
}

function sampleVideoToGrid(video: HTMLVideoElement, canvas: HTMLCanvasElement): PixelGrid | null {
  if (video.readyState < 2) return null;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  canvas.width = 10;
  canvas.height = 10;
  ctx.drawImage(video, 0, 0, 10, 10);
  const { data } = ctx.getImageData(0, 0, 10, 10);
  const grid: PixelGrid = [];
  for (let r = 0; r < 10; r++) {
    const row: [number, number, number][] = [];
    for (let c = 0; c < 10; c++) {
      const idx = (r * 10 + c) * 4;
      row.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    grid.push(row);
  }
  return grid;
}

export function WebcamMini({ mode, model, minConfidence, onCapture }: Props) {
  const { bi, num } = useT();
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grid, setGrid] = useState<PixelGrid | null>(null);
  const [features, setFeatures] = useState<
    readonly [number, number, number, number, number, number] | null
  >(null);
  const [shotCount, setShotCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const g = sampleVideoToGrid(videoRef.current, canvasRef.current);
      if (g) {
        setGrid(g);
        setFeatures(extractFeaturesFromRgbGrid(g));
      }
    }, 260);
    return () => window.clearInterval(id);
  }, [active]);

  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        bi(
          'Webcam API is unavailable in this browser. Use the illustrated waste items above or open Teachable Machine.',
          'এই ব্রাউজারে ওয়েবক্যাম পাওয়া যায়নি। উপরের বর্জ্যের ছবি ব্যবহার করুন অথবা Teachable Machine খুলুন।',
        ),
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError(
        bi(
          'Camera permission was declined or no camera was found. Everything in this lab still works offline with illustrated waste.',
          'ক্যামেরার অনুমতি মেলেনি বা ক্যামেরা পাওয়া যায়নি। এই ল্যাবের সবকিছু অফলাইনে বর্জ্যের ছবি দিয়েই কাজ করে।',
        ),
      );
    }
  }

  const pred = features ? predictHead(model, features, minConfidence) : null;

  return (
    <div className="vis-webcam-box">
      <div className="lab-row">
        {!active ? (
          <button type="button" className="btn ghost" onClick={() => void startCamera()}>
            📷 {bi('Try live webcam (runs locally)', 'সরাসরি ওয়েবক্যাম চালু করুন (অফলাইন)')}
          </button>
        ) : (
          <button type="button" className="btn ghost" onClick={stopCamera}>
            ⏹ {bi('Stop webcam', 'ওয়েবক্যাম বন্ধ করুন')}
          </button>
        )}
        <span className="muted vis-cam-note">
          {bi('Zero images leave your browser.', 'কোনো ছবি ইন্টারনেটে পাঠানো হয় না।')}
        </span>
      </div>

      {error && <p className="vis-cam-err">{error}</p>}

      {active && (
        <div className="vis-cam-live">
          <div className="vis-cam-feeds">
            <video ref={videoRef} playsInline muted className="vis-cam-video" />
            <canvas ref={canvasRef} className="visually-hidden" aria-hidden="true" />
            {grid && (
              <div className="vis-cam-mosaic" aria-label={bi('10×10 webcam pixel view', '১০×১০ ওয়েবক্যাম পিক্সেল')}>
                {grid.flatMap((row, r) =>
                  row.map(([R, G, B], c) => (
                    <span key={`${r}-${c}`} style={{ background: `rgb(${R},${G},${B})` }} />
                  )),
                )}
              </div>
            )}
          </div>

          {mode === 'capture' && onCapture && features && (
            <div className="lab-row">
              {WASTE_CLASSES.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    const next = shotCount + 1;
                    setShotCount(next);
                    onCapture(cls, features, `Cam #${next}`);
                  }}
                >
                  + {CLASS_META[cls].icon} {bi(`Save as ${CLASS_META[cls].name[0]}`, `${CLASS_META[cls].name[1]} হিসেবে নিন`)}
                </button>
              ))}
            </div>
          )}

          {mode === 'predict' && pred && (
            <div>
              <p className="vis-cam-pred" role="status">
                <strong>
                  {pred.routedTo === 'manual'
                    ? '✋ ' + bi('Uncertain → Manual review', 'অনিশ্চিত → মানুষের যাচাই')
                    : `${CLASS_META[pred.topClass].icon} ${bi(CLASS_META[pred.topClass].name[0], CLASS_META[pred.topClass].name[1])} (${num(Math.round(pred.confidence * 100))}%)`}
                </strong>
              </p>
              <Bars
                items={WASTE_CLASSES.map((cls) => ({
                  key: cls,
                  label: `${CLASS_META[cls].icon} ${bi(CLASS_META[cls].name[0], CLASS_META[cls].name[1])}`,
                  value: pred.probs[cls],
                }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
