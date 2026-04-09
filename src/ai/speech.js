class SpeechSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.enabled = false;
    this.voices = [];
    this.currentUtterance = null;
    
    this.loadVoices();
    if (this.synth) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }
  
  loadVoices() {
    this.voices = this.synth.getVoices();
    if (this.voices.length === 0) {
      setTimeout(() => this.loadVoices(), 100);
    }
  }
  
  getPreferredVoice() {
    const preferences = [
      { name: 'Google UK English Male', lang: 'en-GB' },
      { name: 'Google UK English Female', lang: 'en-GB' },
      { name: 'Daniel', lang: 'en-GB' },
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Microsoft David', lang: 'en-US' },
      { name: 'Samantha', lang: 'en-US' }
    ];
    
    for (const pref of preferences) {
      const voice = this.voices.find(v => 
        v.name.includes(pref.name) || 
        (v.lang === pref.lang && v.localService)
      );
      if (voice) return voice;
    }
    
    return this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
  }
  
  speak(text, onStart, onEnd) {
    if (!this.enabled || !this.synth) return;
    
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.getPreferredVoice();
    utterance.rate = 1.1;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
      if (onStart) onStart();
    };
    
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }
  
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
  
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stop();
    }
    return this.enabled;
  }
}

export const speechSynth = new SpeechSynthesizer();
