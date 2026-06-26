/**
 * A short, pleasant completion chime synthesized with the Web Audio API.
 * Generating it in-browser means no binary asset to ship or cache — the sound
 * works fully offline. The AudioContext is unlocked by the first user gesture
 * (starting the timer), so it is ready by the time a phase completes.
 */

type AudioContextCtor = typeof AudioContext

function audioContextCtor(): AudioContextCtor | undefined {
  return (
    globalThis.AudioContext ??
    (globalThis as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  )
}

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (context) return context
  const Ctor = audioContextCtor()
  if (!Ctor) return null
  context = new Ctor()
  return context
}

function playTone(ac: AudioContext, frequency: number, startAt: number, duration: number): void {
  const oscillator = ac.createOscillator()
  const gain = ac.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  // Soft attack/decay envelope to avoid clicks.
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(0.22, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  oscillator.connect(gain).connect(ac.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration)
}

/** Unlock the audio context within a user gesture so later playback is allowed. */
function unlock(): void {
  const ac = getContext()
  if (ac?.state === 'suspended') void ac.resume()
}

function playChime(): void {
  const ac = getContext()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()
  const now = ac.currentTime
  playTone(ac, 880, now, 0.2)
  playTone(ac, 1318.5, now + 0.16, 0.3)
}

export function useSound() {
  return { playChime, unlock }
}
