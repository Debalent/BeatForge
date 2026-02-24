/**
 * Meter AudioWorklet Processor
 * Computes peak, RMS and LUFS-K values per audio block.
 * Runs in the AudioWorkletGlobalScope — must be plain ES2017, no imports.
 */
class MeterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  _peak = 0;
  _rmsAccum = 0;
  _rmsCount = 0;
  _holdFrames = 0;
  _peakHold = 0;

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const L = input[0] ?? new Float32Array(128);
    const R = input[1] ?? L;
    const len = L.length;

    let peakL = 0, peakR = 0;
    let sumL = 0, sumR = 0;

    for (let i = 0; i < len; i++) {
      const absL = Math.abs(L[i]);
      const absR = Math.abs(R[i]);
      if (absL > peakL) peakL = absL;
      if (absR > peakR) peakR = absR;
      sumL += L[i] * L[i];
      sumR += R[i] * R[i];
    }

    const rmsL = Math.sqrt(sumL / len);
    const rmsR = Math.sqrt(sumR / len);

    // Simple LUFS-S proxy (ITU BS.1770 K-weight simplified)
    const lufsShort = -0.691 + 10 * Math.log10((rmsL * rmsL + rmsR * rmsR) * 0.5 + 1e-10);

    this.port.postMessage({ peakL, peakR, rmsL, rmsR, lufsShort });
    return true;
  }
}

registerProcessor('meter-processor', MeterProcessor);
