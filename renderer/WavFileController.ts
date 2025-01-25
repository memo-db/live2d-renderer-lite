export class WavFileController {
    private samples: Float32Array[] | null
    private lastRms: number
    private sampleOffset: number
    private userTime: number
    public numChannels: number
    public bitsPerSample: number
    public sampleRate: number
    public samplesPerChannel: number

    constructor() {
        this.samples = null
        this.lastRms = 0
        this.sampleOffset = 0
        this.userTime = 0
    }

    public start = async (wavBuffer: ArrayBuffer) => {
        this.sampleOffset = 0
        this.userTime = 0
        this.lastRms = 0
        const wavDecoder = await import("wav-file-decoder")
        const wav = wavDecoder.decodeWavFile(wavBuffer)
        this.numChannels = wav.numberOfChannels
        this.bitsPerSample = wav.bitsPerSample
        this.sampleRate = wav.sampleRate
        this.samples = wav.channelData
        this.samplesPerChannel = this.samples.length / this.numChannels
    }

    public update = (deltaTime: DOMHighResTimeStamp) => {
        if (!this.samples || this.sampleOffset >= this.samplesPerChannel) {
            this.lastRms = 0
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

        this.lastRms = Math.sqrt(rms / (this.numChannels * samplesToProcess))
        this.sampleOffset = goalOffset
    }

    getRms() {
        return this.lastRms
    }
}