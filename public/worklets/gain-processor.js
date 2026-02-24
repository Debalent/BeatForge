/**
 * Gain AudioWorklet Processor
 * Per-sample smoothed gain with optional pan (constant-power).
 */
class GainProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'gain', defaultValue: 1,    minValue: 0,  maxValue: 2,  automationRate: 'a-rate' },
      { name: 'pan',  defaultValue: 0,    minValue: -1, maxValue: 1,  automationRate: 'k-rate' },
    ];
  }

  process(inputs, outputs, parameters) {
    const input  = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0) return true;

    const gainParam = parameters['gain'];
    const panParam  = parameters['pan'];
    const pan       = panParam.length > 1 ? panParam[0] : panParam[0] ?? 0;

    // Constant-power panning
    const panRad = (pan * Math.PI) / 4;
    const gainL  = Math.cos(panRad);
    const gainR  = Math.sin(panRad) + Math.cos(panRad);

    const L = input[0] ?? new Float32Array(128);
    const R = input[1] ?? L;

    for (let i = 0; i < (output[0]?.length ?? 128); i++) {
      const g = gainParam.length > 1 ? gainParam[i] : gainParam[0];
      if (output[0]) output[0][i] = L[i] * g * gainL;
      if (output[1]) output[1][i] = R[i] * g * gainR;
    }
    return true;
  }
}

registerProcessor('gain-processor', GainProcessor);
