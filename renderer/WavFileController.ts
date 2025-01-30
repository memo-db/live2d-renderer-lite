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
    public audioContext: AudioContext
    public smoothingFactor: number

    constructor() {
        this.samples = null
        this.previousRms = 0
        this.rms = 0
        this.sampleOffset = 0
        this.userTime = 0
        this.smoothingFactor = 0.1
        this.audioContext = new AudioContext()
    }

    public start = async (wavBuffer: ArrayBuffer) => {
        this.sampleOffset = 0
        this.userTime = 0
        this.previousRms = 0
        this.rms = 0
        const decodedAudio = await this.audioContext.decodeAudioData(wavBuffer)
        this.numChannels = decodedAudio.numberOfChannels
        this.sampleRate = decodedAudio.sampleRate
        this.samples = Array.from({length: this.numChannels}, (v, i) => decodedAudio.getChannelData(i))
        this.samplesPerChannel = decodedAudio.length
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