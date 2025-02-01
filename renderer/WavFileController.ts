export class WavFileController {
    public samples: Float32Array[] | null
    public previousRms: number
    public rms: number
    public sampleOffset: number
    public userTime: number
    public numChannels: number
    public bitsPerSample: number
    public sampleRate: number
    public samplesPerChannel: number
    public smoothingFactor: number
    public audioContext: AudioContext
    public volumeNode: GainNode
    public sourceNode: AudioBufferSourceNode | null

    constructor() {
        this.samples = null
        this.previousRms = 0
        this.rms = 0
        this.sampleOffset = 0
        this.userTime = 0
        this.smoothingFactor = 0.1
        this.audioContext = new AudioContext()
        this.sourceNode = null
        this.volumeNode = this.audioContext.createGain()
        this.volumeNode.connect(this.audioContext.destination)
    }

    public start = async (wavBuffer: ArrayBuffer, playAudio = false, volume = 1.0) => {
        this.sampleOffset = 0
        this.userTime = 0
        this.previousRms = 0
        this.rms = 0
        const cloneBufer = wavBuffer.slice(0)
        const decodedAudio = await this.audioContext.decodeAudioData(wavBuffer)
        const cloneAudio = await this.audioContext.decodeAudioData(cloneBufer)
        this.numChannels = decodedAudio.numberOfChannels
        this.sampleRate = decodedAudio.sampleRate
        this.samples = Array.from({length: this.numChannels}, (v, i) => decodedAudio.getChannelData(i))
        this.samplesPerChannel = decodedAudio.length
        if (playAudio) await this.play(cloneAudio, volume)
        return this.audioContext
    }

    public play = async (audioBuffer: AudioBuffer, volume = 1.0) => {
        this.stop()
        this.sourceNode = this.audioContext.createBufferSource()
        this.sourceNode.buffer = audioBuffer
        this.sourceNode.connect(this.audioContext.destination)
        this.volumeNode.gain.value = volume
        this.sourceNode.connect(this.volumeNode)
        this.sourceNode.start(this.userTime)
    }

    public stop = async () => {
        if (this.sourceNode) {
            this.sourceNode.stop()
            this.sourceNode.disconnect()
            this.sourceNode = null
        }
    }

    public update = (deltaTime: DOMHighResTimeStamp) => {
        if (!this.samples || this.sampleOffset >= this.samplesPerChannel) {
            this.rms = 0
            return
        }

        this.userTime += deltaTime
        const goalOffset = Math.min(Math.floor(this.userTime * this.sampleRate), this.samplesPerChannel)

        let rms = 0
        const samplesToProcess = goalOffset - this.sampleOffset

        for (const channel of this.samples) {
            for (let i = this.sampleOffset; i < goalOffset; i++) {
                rms += channel[i] ** 2
            }
        }

        this.rms = Math.sqrt(rms / (this.numChannels * samplesToProcess)) * 5
        this.rms = Math.max(0, Math.min(this.rms, 1))

        if (this.smoothingFactor > 0) {
            this.rms = this.previousRms * (1 - this.smoothingFactor) + this.rms * this.smoothingFactor
        }
        this.previousRms = this.rms

        this.sampleOffset = goalOffset
    }

    getRms() {
        return this.rms
    }
}