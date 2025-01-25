import {CubismModelSettingJson} from "../framework/src/cubismmodelsettingjson"
import {CubismDefaultParameterId} from "../framework/src/cubismdefaultparameterid"
import {ICubismModelSetting} from "../framework/src/icubismmodelsetting"
import {ACubismMotion, FinishedMotionCallback, BeganMotionCallback} from "../framework/src/motion/acubismmotion"
import {CubismEyeBlink} from "../framework/src/effect/cubismeyeblink"
import {CubismIdHandle} from "../framework/src/id/cubismid"
import {CubismBreath, BreathParameterData} from "../framework/src/effect/cubismbreath"
import {CubismMotionQueueManager, CubismMotionQueueEntryHandle, InvalidMotionQueueEntryHandleValue} from "../framework/src/motion/cubismmotionqueuemanager"
import {CubismFramework} from "../framework/src/live2dcubismframework"
import {CubismViewMatrix} from "../framework/src/math/cubismviewmatrix"
import {CubismMatrix44} from "../framework/src/math/cubismmatrix44"
import {CubismMotion} from "../framework/src/motion/cubismmotion"
import {CubismMoc} from "../framework/src/model/cubismmoc"
import {csmVector} from "../framework/src/type/csmvector"
import {csmMap} from "../framework/src/type/csmmap"
import {Live2DCubismUserModel} from "./Live2DCubismUserModel"
import {WavFileController} from "./WavFileController"
import {TouchController} from "./TouchController"
import {CameraController} from "./CameraController"
import path from "path"

export interface Live2DModelOptions {
    autoAnimate?: boolean
    autoInteraction?: boolean
    randomMotion?: boolean
    keepAspect?: boolean
    cubismCorePath?: string
    paused?: boolean
    speed?: number
    scale?: number
    minScale?: number
    maxScale?: number
    panSpeed?: number
    zoomStep?: number
    enableZoom?: boolean
    enablePan?: boolean
    logicalLeft?: number
    logicalRight?: number
    checkMocConsistency?: boolean
    premultipliedAlpha?: boolean
    enablePhysics?: boolean
    enableEyeblink?: boolean
    enableBreath?: boolean
    enableLipsync?: boolean
    enableMotion?: boolean
    enableExpression?: boolean
    enableMovement?: boolean
    enablePose?: boolean
}

export interface Live2DBuffers {
    modelBuffer: ArrayBuffer
    expressionBuffers: ArrayBuffer[]
    physicsBuffer: ArrayBuffer | null
    poseBuffer: ArrayBuffer | null
    userDataBuffer: ArrayBuffer | null
    motionGroups: {group: string, motionData: {motionBuffers: ArrayBuffer[], wavBuffer: ArrayBuffer | null}}[]
    textureImages: HTMLImageElement[]
}

export enum MotionPriority {
    None, Idle, Normal, Force
}

let id = null

export class Live2DCubismModel extends Live2DCubismUserModel {
    public buffers: Live2DBuffers
    public motions: csmMap<string, ACubismMotion>
    public expressions: csmMap<string, ACubismMotion>
    public eyeBlinkIds: csmVector<CubismIdHandle>
    public lipSyncIds: csmVector<CubismIdHandle>
    public settings: ICubismModelSetting
    public totalMotionCount: number
    public viewMatrix: CubismViewMatrix
    public projection: CubismMatrix44
    public deviceToScreen: CubismMatrix44
    public canvas: HTMLCanvasElement
    public deltaTime: DOMHighResTimeStamp
    public currentFrame: DOMHighResTimeStamp
    public lastFrame: DOMHighResTimeStamp
    public queueManager: CubismMotionQueueManager
    public shader: WebGLProgram
    public paused: boolean
    public needsResize: boolean
    public premultipliedAlpha: boolean
    public cubismCorePath: string
    public autoAnimate: boolean
    public autoInteraction: boolean
    public randomMotion: boolean
    public keepAspect: boolean
    public speed: number
    public logicalLeft: number
    public logicalRight: number
    public wavController: WavFileController
    public touchController: TouchController
    public cameraController: CameraController
    public enablePhysics: boolean
    public enableEyeblink: boolean
    public enableBreath: boolean
    public enableLipsync: boolean
    public enableMotion: boolean
    public enableExpression: boolean
    public enableMovement: boolean
    public enablePose: boolean
    public init: boolean

    get enableZoom() {
        return this.cameraController.enableZoom
    }

    set enableZoom(enableZoom) {
        this.cameraController.enableZoom = enableZoom
    }

    get minScale() {
        return this.cameraController.minScale
    }

    set minScale(minScale) {
        this.cameraController.minScale = minScale
    }

    get maxScale() {
        return this.cameraController.maxScale
    }

    set maxScale(maxScale) {
        this.cameraController.maxScale = maxScale
    }

    get panSpeed() {
        return this.cameraController.panSpeed
    }

    set panSpeed(panSpeed) {
        this.cameraController.panSpeed = panSpeed
    }

    get zoomStep() {
        return this.cameraController.zoomStep
    }

    set zoomStep(zoomStep) {
        this.cameraController.zoomStep = zoomStep
    }

    get scale() {
        return this.cameraController.scale
    }

    set scale(scale) {
        this.cameraController.scale = scale
    }

    get x() {
        return this.cameraController.x
    }

    set x(x) {
        this.cameraController.x = x
    }

    get y() {
        return this.cameraController.y
    }

    set y(y) {
        this.cameraController.y = y
    }

    public constructor(canvas: HTMLCanvasElement, options?: Live2DModelOptions) {
        if (!options) options = {}
        super()
        this.motions = new csmMap<string, ACubismMotion>()
        this.expressions = new csmMap<string, ACubismMotion>()
        this.eyeBlinkIds = new csmVector<CubismIdHandle>()
        this.lipSyncIds = new csmVector<CubismIdHandle>()
        this.viewMatrix = new CubismViewMatrix()
        this.projection = new CubismMatrix44()
        this.deviceToScreen = new CubismMatrix44()
        this.queueManager = new CubismMotionQueueManager()
        this.totalMotionCount = 0
        this.canvas = canvas
        this.needsResize = false
        this.cubismCorePath = options.cubismCorePath ?? "live2dcubismcore.min.js"
        this.mocConsistency = options.checkMocConsistency ?? true
        this.premultipliedAlpha = options.premultipliedAlpha ?? true
        this.logicalLeft = options.logicalLeft ?? -2
        this.logicalRight = options.logicalRight ?? 2
        this.autoAnimate = options.autoAnimate ?? true
        this.autoInteraction = options.autoInteraction ?? true
        this.keepAspect = options.keepAspect ?? false
        this.randomMotion = options.randomMotion ?? true
        this.paused = options.paused ?? false
        this.speed = options.speed ?? 1
        this.updateTime()
        this.shader = this.createShader()
        this.wavController = new WavFileController()
        this.touchController = new TouchController()
        this.cameraController = new CameraController(this.canvas)
        this.cameraController.enableZoom = options.enableZoom ?? true
        this.cameraController.enablePan = options.enablePan ?? true
        this.cameraController.minScale = options.minScale ?? 0.1
        this.cameraController.maxScale = options.maxScale ?? 10
        this.cameraController.panSpeed = options.panSpeed ?? 1.5
        this.cameraController.zoomStep = options.zoomStep ?? 0.005
        this.enablePhysics = options.enablePhysics ?? true
        this.enableBreath = options.enableBreath ?? true
        this.enableEyeblink = options.enableEyeblink ?? true
        this.enableLipsync = options.enableLipsync ?? true
        this.enableMotion = options.enableMotion ?? true
        this.enableExpression = options.enableExpression ?? true
        this.enableMovement = options.enableMovement ?? true
        this.enablePose = options.enablePose ?? true
        this.startPointerInteractions()
        this.init = true
    }

    public destroy = () => {
        cancelAnimationFrame(id)
        this.motions.clear()
        this.expressions.clear()
        this.eyeBlinkIds.clear()
        this.lipSyncIds.clear()
        CubismFramework.dispose()
        this.cancelPointerInteractions()
        this.cameraController.removeListeners()
        this.buffers = null
        this.canvas = null
        this.init = true
    }

    public loadCubismCore = async () => {
        return new Promise<void>(async (resolve) => {
            if (document.querySelector(`script[src="${this.cubismCorePath}"]`)) {
                return resolve()
            }
            const script = document.createElement("script")
            script.src = this.cubismCorePath
            script.defer = true
            document.body.appendChild(script)
            script.onload = () => resolve()
        })
    }

    private loadBuffers = async (link: string) => {
        if (this.init) {
            await this.loadCubismCore()
            CubismFramework.startUp({logFunction: (msg: string) => console.log(msg), loggingLevel: 5})
            CubismFramework.initialize()
            this.init = false
        }
        if (path.extname(link).replace(".", "") === "zip") {
            const JSZip = await import("jszip").then((r) => r.default)
            const zipBuffer = await fetch(link).then((r) => r.arrayBuffer())
            const zip  = await JSZip.loadAsync(zipBuffer)

            let files = {} as {[key: string]: ArrayBuffer}
            for (let i = 0; i < Object.keys(zip.files).length; i++) {
                const relativePath = Object.keys(zip.files)[i]
                if (relativePath.startsWith("__MACOSX")) continue
                const file = Object.values(zip.files)[i]
                let contents = null
                if (!file.dir) contents = await file.async("arraybuffer")
                const key = relativePath.split("/").slice(1).join("/")
                files[key] = contents
                if (relativePath.endsWith("model3.json")) {
                    const settings = new CubismModelSettingJson(contents, contents.byteLength)
                    this.settings = settings
                }
            }

            const modelFilename = this.settings.getModelFileName()
            const modelBuffer = files[modelFilename]
            if (!modelBuffer?.byteLength) return Promise.reject(`Failed to load ${modelFilename}`)

            let expressionBuffers = [] as ArrayBuffer[]
            for (let i = 0; i < this.settings.getExpressionCount(); i++) {
                const filename = this.settings.getExpressionFileName(i)
                const expressionBuffer = files[filename]
                if (!expressionBuffer?.byteLength) return Promise.reject(`Failed to load ${filename}`)
                expressionBuffers.push(expressionBuffer)
            }

            let physicsBuffer = null as ArrayBuffer | null
            const physicsFilename = this.settings.getPhysicsFileName()
            if (physicsFilename) {
                physicsBuffer = files[physicsFilename]
                if (!physicsBuffer?.byteLength) return Promise.reject(`Failed to load ${physicsFilename}`)
            }
    
            let poseBuffer = null as ArrayBuffer | null
            const poseFilename = this.settings.getPoseFileName()
            if (poseFilename) {
                poseBuffer = files[poseFilename]
                if (!poseBuffer?.byteLength) return Promise.reject(`Failed to load ${poseFilename}`)
            }
    
            let userDataBuffer = null as ArrayBuffer | null
            const userDataFile = this.settings.getUserDataFile()
            if (userDataFile) {
                userDataBuffer = files[userDataFile]
                if (!userDataBuffer?.byteLength) return Promise.reject(`Failed to load ${userDataFile}`)
            }

            let motionGroups = [] as {group: string, motionData: {motionBuffers: ArrayBuffer[], wavBuffer: ArrayBuffer | null}}[]
            let totalMotionCount = 0
            for (let i = 0; i < this.settings.getMotionGroupCount(); i++) {
                const group = this.settings.getMotionGroupName(i)
                totalMotionCount += this.settings.getMotionCount(group)
    
                let motionBuffers = [] as ArrayBuffer[]
                let wavBuffer = null as ArrayBuffer | null
                for (let i = 0; i < this.settings.getMotionCount(group); i++) {
                    const filename = this.settings.getMotionFileName(group, i)
                    const motionBuffer = files[filename]
                    if (!motionBuffer?.byteLength) return Promise.reject(`Failed to load ${filename}`)
                    motionBuffers.push(motionBuffer)

                    const voice = this.settings.getMotionSoundFileName(group, i)
                    if (voice.localeCompare("") !== 0) {
                        wavBuffer = files[voice]
                    }
                }
                motionGroups.push({group, motionData: {motionBuffers, wavBuffer}})
            }
            this.totalMotionCount = totalMotionCount

            const textureImages = [] as HTMLImageElement[]
            for (let i = 0; i < this.settings.getTextureCount(); i++) {
                const filename = this.settings.getTextureFileName(i)

                const imageArrayBuffer = files[filename]
                const blob = new Blob([imageArrayBuffer])
                const url = URL.createObjectURL(blob)
    
                const img = new Image()
                img.src = url
                await new Promise<void>((resolve) => {
                    img.onload = () => resolve()
                })
                textureImages.push(img)
            }
    
            this.buffers = {modelBuffer, expressionBuffers, physicsBuffer, poseBuffer, userDataBuffer, motionGroups, textureImages}
            return this.buffers
        } else {
            let basename = path.dirname(link)
            const settingsBuffer = await fetch(link).then((r) => r.arrayBuffer()).catch(() => new ArrayBuffer(0))
            if (!settingsBuffer.byteLength) return Promise.reject(`Failed to load ${link}`)
            const settings = new CubismModelSettingJson(settingsBuffer, settingsBuffer.byteLength)
            this.settings = settings
    
            const modelFilename = settings.getModelFileName()
            const modelPath = path.join(basename, modelFilename)
            const modelBuffer = await fetch(modelPath).then((r) => r.arrayBuffer()).catch(() => new ArrayBuffer(0))
            if (!modelBuffer.byteLength) return Promise.reject(`Failed to load ${modelPath}`)
    
            let expressionBuffers = [] as ArrayBuffer[]
            for (let i = 0; i < settings.getExpressionCount(); i++) {
                const filename = settings.getExpressionFileName(i)
                const expressionPath = path.join(basename, filename)
                const expressionBuffer = await fetch(expressionPath).then((r) => r.arrayBuffer()).catch(() => new ArrayBuffer(0))
                if (!expressionBuffer.byteLength) return Promise.reject(`Failed to load ${expressionPath}`)
                expressionBuffers.push(expressionBuffer)
            }
    
            let physicsBuffer = null as ArrayBuffer | null
            const physicsFilename = settings.getPhysicsFileName()
            if (physicsFilename) {
                const physicsPath = path.join(basename, physicsFilename)
                physicsBuffer = await fetch(physicsPath).then((r) => r.arrayBuffer()).catch(() => new ArrayBuffer(0))
                if (!physicsBuffer.byteLength) return Promise.reject(`Failed to load ${physicsPath}`)
            }
    
            let poseBuffer = null as ArrayBuffer | null
            const poseFilename = settings.getPoseFileName()
            if (poseFilename) {
                const posePath = path.join(basename, poseFilename)
                poseBuffer = await fetch(posePath).then((r) => r.arrayBuffer()).catch(() => new ArrayBuffer(0))
                if (!poseBuffer.byteLength) return Promise.reject(`Failed to load ${posePath}`)
            }
    
            let userDataBuffer = null as ArrayBuffer | null
            const userDataFile = settings.getUserDataFile()
            if (userDataFile) {
                const userDataPath = path.join(basename, userDataFile)
                userDataBuffer = await fetch(userDataPath).then((r) => r.arrayBuffer()).catch(() => new ArrayBuffer(0))
                if (!userDataBuffer.byteLength) return Promise.reject(`Failed to load ${userDataPath}`)
            }
    
            let motionGroups = [] as {group: string, motionData: {motionBuffers: ArrayBuffer[], wavBuffer: ArrayBuffer | null}}[]
            let totalMotionCount = 0
            for (let i = 0; i < settings.getMotionGroupCount(); i++) {
                const group = settings.getMotionGroupName(i)
                totalMotionCount += settings.getMotionCount(group)
    
                let motionBuffers = [] as ArrayBuffer[]
                let wavBuffer = null as ArrayBuffer | null
                for (let i = 0; i < this.settings.getMotionCount(group); i++) {
                    const filename = this.settings.getMotionFileName(group, i)
                    const motionPath = path.join(basename, filename)
                    const motionBuffer = await fetch(motionPath).then((r) => r.arrayBuffer()).catch(() => new ArrayBuffer(0))
                    if (!motionBuffer.byteLength) return Promise.reject(`Failed to load ${motionPath}`)
                    motionBuffers.push(motionBuffer)

                    const voice = this.settings.getMotionSoundFileName(group, i)
                    if (voice.localeCompare("") !== 0) {
                        const wavPath = path.join(basename, voice)
                        wavBuffer = await fetch(wavPath).then((r) => r.arrayBuffer()).catch(() => new ArrayBuffer(0))
                        if (!wavBuffer.byteLength) return Promise.reject(`Failed to load ${wavPath}`)
                    }
                }
                motionGroups.push({group, motionData: {motionBuffers, wavBuffer}})
            }
            this.totalMotionCount = totalMotionCount
    
            const textureImages = [] as HTMLImageElement[]
            for (let i = 0; i < settings.getTextureCount(); i++) {
                const filename = this.settings.getTextureFileName(i)
                const texturePath = path.join(basename, filename)
    
                const img = new Image()
                img.src = texturePath
                await new Promise<void>((resolve) => {
                    img.onload = () => resolve()
                })
                textureImages.push(img)
            }
    
            this.buffers = {modelBuffer, expressionBuffers, physicsBuffer, poseBuffer, userDataBuffer, motionGroups, textureImages}
            return this.buffers
        }
    }

    public load = async (link: string) => {
        const {modelBuffer, expressionBuffers, physicsBuffer, 
        poseBuffer, userDataBuffer, motionGroups} = await this.loadBuffers(link)

        this.loadModel(modelBuffer, this._mocConsistency)

        for (let i = 0; i < expressionBuffers.length; i++) {
            const name = this.settings.getExpressionName(i)
            const expressionBuffer = expressionBuffers[i]
            const motion = this.loadExpression(expressionBuffer, expressionBuffer.byteLength, name)

            if (this.expressions.getValue(name) !== null) {
                ACubismMotion.delete(this.expressions.getValue(name))
                this.expressions.setValue(name, null)
            }
            this.expressions.setValue(name, motion)
        }

        if (physicsBuffer) {
            this.loadPhysics(physicsBuffer, physicsBuffer.byteLength)
        }

        if (poseBuffer) {
            this.loadPose(poseBuffer, poseBuffer.byteLength)
        }

        if (this.settings.getEyeBlinkParameterCount() > 0) {
            this.eyeBlink = CubismEyeBlink.create(this.settings)
        }

        this.breath = CubismBreath.create()
        const breathParameters = new csmVector<BreathParameterData>()

        const paramAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleX)
        const paramAngleY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleY)
        const paramAngleZ = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleZ)
        const paramBodyAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBodyAngleX)
        const paramBreath = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath)
        breathParameters.pushBack(new BreathParameterData(paramAngleX, 0.0, 15.0, 6.5345, 0.5))
        breathParameters.pushBack(new BreathParameterData(paramAngleY, 0.0, 8.0, 3.5345, 0.5))
        breathParameters.pushBack(new BreathParameterData(paramAngleZ, 0.0, 10.0, 5.5345, 0.5))
        breathParameters.pushBack(new BreathParameterData(paramBodyAngleX, 0.0, 4.0, 15.5345, 0.5))
        breathParameters.pushBack(new BreathParameterData(paramBreath, 0.5, 0.5, 3.2345, 1))
        this.breath.setParameters(breathParameters)

        if (userDataBuffer) {
            this.loadUserData(userDataBuffer, userDataBuffer.byteLength)
        }

        const eyeBlinkCount = this.settings.getEyeBlinkParameterCount() 
        for (let i = 0; i < eyeBlinkCount; ++i) {
            this.eyeBlinkIds.pushBack(this.settings.getEyeBlinkParameterId(i))
        }

        const lipSyncCount = this.settings.getLipSyncParameterCount()
        for (let i = 0; i < lipSyncCount; ++i) {
            this.lipSyncIds.pushBack(this.settings.getLipSyncParameterId(i))
        }

        const layout = new csmMap<string, number>()
        this.settings.getLayoutMap(layout)
        this.modelMatrix.setupFromLayout(layout)

        this.model.saveParameters()

        for (let i = 0; i < motionGroups.length; i++) {
            const group = motionGroups[i].group
            const motionBuffers = motionGroups[i].motionData.motionBuffers
            const name = `${group}_${i}`

            for (let i = 0; i < motionBuffers.length; i++) {
                const motionBuffer = motionBuffers[i]
                const motion = this.loadMotion(motionBuffer, motionBuffer.byteLength, name, null, null, this.settings, group, i)

                if (motion !== null) {
                    motion.setEffectIds(this.eyeBlinkIds, this.lipSyncIds)
                    if (this.motions.getValue(name) !== null) {
                        ACubismMotion.delete(this.motions.getValue(name))
                    }
                    this.motions.setValue(name, motion)
                } else {
                    this.totalMotionCount--
                }
            }
        }

        this.createRenderer()
        await this.loadTextures()
        const gl = this.canvas.getContext("webgl2")
        this.getRenderer().startUp(gl)
        await this.resize()
        this.animationLoop()
    }

    public loadTextures = async () => {
        const {textureImages} = this.buffers

        for (let i = 0; i < textureImages.length; i++) {
            const img = textureImages[i]

            const gl = this.canvas.getContext("webgl2")
            const tex = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            if (this.premultipliedAlpha) gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
            gl.generateMipmap(gl.TEXTURE_2D)
            gl.bindTexture(gl.TEXTURE_2D, null)
            
            this.getRenderer().bindTexture(i, tex)
            this.getRenderer().setIsPremultipliedAlpha(this.premultipliedAlpha)
        }
    }

    public createShader() {
        const gl = this.canvas.getContext("webgl2")
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)
        const vertexShaderString = `
            precision mediump float;
            attribute vec3 position;
            attribute vec2 uv;
            varying vec2 vuv;
            void main(void) {
               gl_Position = vec4(position, 1.0);
               vuv = uv;
            }`
    
        gl.shaderSource(vertexShader, vertexShaderString)
        gl.compileShader(vertexShader)
    
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
        const fragmentShaderString = `
            precision mediump float;
            varying vec2 vuv;
            uniform sampler2D texture;
            void main(void) {
               gl_FragColor = texture2D(texture, vuv);
            }`
    
        gl.shaderSource(fragmentShader, fragmentShaderString)
        gl.compileShader(fragmentShader)
    
        const shader = gl.createProgram()
        gl.attachShader(shader, vertexShader)
        gl.attachShader(shader, fragmentShader)
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        gl.linkProgram(shader)
        gl.useProgram(shader)
        return shader
    }

    public resize = async () => {
        const gl = this.canvas.getContext("webgl2")
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        if (this.keepAspect) {
            const ratio = this.width / this.height
            if (this.canvas.width / this.canvas.height >= ratio) {
                this.canvas.height = this.canvas.height
                this.canvas.width = this.canvas.height * ratio
            } else {
                this.canvas.width = this.canvas.width
                this.canvas.height = this.canvas.width / ratio
            }
        } else {
            this.canvas.width = this.canvas.clientWidth
            this.canvas.height = this.canvas.clientHeight
        }
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

        const {width, height} = gl.canvas
        const ratio = width / height
        const left = -ratio
        const right = ratio
        const bottom = -1
        const top = 1

        this.viewMatrix.setScreenRect(left, right, bottom, top)
        this.viewMatrix.scale(1, 1)

        this.deviceToScreen.loadIdentity()
        if (width > height) {
          const screenW = Math.abs(right - left)
          this.deviceToScreen.scaleRelative(screenW / width, -screenW / width)
        } else {
          const screenH = Math.abs(top - bottom)
          this.deviceToScreen.scaleRelative(screenH / height, -screenH / height)
        }
        this.deviceToScreen.translateRelative(-width * 0.5, -height * 0.5)

        this.viewMatrix.setMinScale(this.minScale)
        this.viewMatrix.setMaxScale(this.maxScale)
        this.viewMatrix.setMaxScreenRect(this.logicalLeft, this.logicalRight, this.logicalLeft, this.logicalRight)
    }

    public updateTime = () => {
        this.currentFrame = performance.now()
        this.deltaTime = (this.currentFrame - this.lastFrame) / 1000
        this.lastFrame = this.currentFrame
    }

    public draw = () => {
        this.projection.multiplyByMatrix(this.modelMatrix)
        this.getRenderer().setMvpMatrix(this.projection)
        const gl = this.canvas.getContext("webgl2")
        const viewport = [0, 0, gl.canvas.width, gl.canvas.height]

        const frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING)
        this.getRenderer().setRenderState(frameBuffer, viewport)
        this.getRenderer().drawModel()
    }

    public updateCamera = () => {
        const {x, y, scale} = this.cameraController
        this.viewMatrix.translate(-x, -y)
        this.viewMatrix.scale(scale, scale)
    }

    public updateProjection = () => {
        const gl = this.canvas.getContext("webgl2")
        const {width, height} = gl.canvas
        const projection = new CubismMatrix44()
        if (this.model.getCanvasWidth() > 1 && width < height) {
            this.modelMatrix.setWidth(2)
            projection.scale(1, width / height)
        } else {
            projection.scale(height / width, 1)
        }

        if (this.viewMatrix) {
            projection.multiplyByMatrix(this.viewMatrix)
        }
        this.projection = projection
    }

    public update = async () => {
        if (this.paused) return
        const gl = this.canvas.getContext("webgl2")
        if (gl.isContextLost()) return

        this.updateTime()
        this.updateProjection()
        this.deltaTime *= this.speed

        if (this.needsResize) {
            this.resize()
            this.needsResize = false
        }

        gl.clearColor(0, 0, 0, 0)
        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LEQUAL)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.clearDepth(1)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.useProgram(this.shader)
        gl.flush()

        this.dragManager.update(this.deltaTime)
        this.dragX = this.dragManager.getX()
        this.dragY = this.dragManager.getY()

        let motionUpdated = false
        if (this.enableMotion) {
            this.model.loadParameters()
            if (this.motionManager.isFinished()) {
                if (this.randomMotion) {
                    this.startRandomMotion(null, MotionPriority.Idle)
                } else {
                    this.startMotion("Idle", 1, MotionPriority.Idle)
                }
            } else {
                motionUpdated = this.motionManager.updateMotion(this.model, this.deltaTime)
            }
            this.model.saveParameters()
            
        }

        if (!motionUpdated) {
            if (this.eyeBlink !== null && this.enableEyeblink) {
              this.eyeBlink.updateParameters(this.model, this.deltaTime)
            }
        }
      
        if (this.expressionManager != null && this.enableExpression) {
            this.expressionManager.updateMotion(this.model, this.deltaTime)
        }

        if (this.enableMovement) {
            const paramAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleX)
            const paramAngleY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleY)
            const paramAngleZ = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleZ)
            const paramBodyAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBodyAngleX)
            this.model.addParameterValueById(paramAngleX, this.dragX * 30)
            this.model.addParameterValueById(paramAngleY, this.dragY * 30)
            this.model.addParameterValueById(paramAngleZ, this.dragX * this._dragY * -30)
            this.model.addParameterValueById(paramBodyAngleX, this._dragX * 10)
            const paramEyeBallX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamEyeBallX)
            const paramEyeBallY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamEyeBallY)
            this.model.addParameterValueById(paramEyeBallX, this.dragX)
            this.model.addParameterValueById(paramEyeBallY, this.dragY)
        }

        if (this.breath !== null && this.enableBreath) {
            this.breath.updateParameters(this.model, this.deltaTime)
        }

        if (this.physics !== null && this.enablePhysics) {
            this.physics.evaluate(this.model, this.deltaTime)
        }

        if (this.lipsync && this.enableLipsync) {
            this.wavController.update(this.deltaTime)
            let value = this.wavController.getRms()
    
            for (let i = 0; i < this.lipSyncIds.getSize(); ++i) {
                this.model.addParameterValueById(this.lipSyncIds.at(i), value, 0.8)
            }
        }
    
        if (this.pose !== null && this.enablePose) {
          this.pose.updateParameters(this.model, this.deltaTime)
        }
    
        this.queueManager.doUpdateMotion(this.model, this.deltaTime)
        this.model.update()
        this.draw()
    }

    public animationLoop = () => {
        this.update()
        if (!this.autoAnimate) return
        const loop = async () => {
            this.updateCamera()
            await this.update()
            id = window.requestAnimationFrame(loop)
        }
        loop()
    }

    public startMotion = async (group: string, i: number, priority: number, onStartMotion?: BeganMotionCallback, 
        onEndMotion?: FinishedMotionCallback): Promise<CubismMotionQueueEntryHandle> => {
        if (priority === MotionPriority.Force) {
          this.motionManager.setReservePriority(priority)
        } else if (!this.motionManager.reserveMotion(priority)) {
          return InvalidMotionQueueEntryHandleValue
        }

        const {motionGroups} = this.buffers
        const motionGroup = motionGroups.find((motion) => motion.group === group)
        const {motionBuffers, wavBuffer} = motionGroup.motionData

        const name = `${group}_${i}`
        let motion = this.motions.getValue(name) as CubismMotion
        let autoDelete = false

        if (motion === null) {
            const motionBuffer = motionBuffers[i]

            motion = this.loadMotion(motionBuffer, motionBuffer.byteLength, null, onEndMotion, onStartMotion, this.settings, group, i)
            if (!motion) return
    
            motion.setEffectIds(this.eyeBlinkIds, this.lipSyncIds)
            autoDelete = true
        } else {
            motion.setBeganMotionHandler(onStartMotion)
            motion.setFinishedMotionHandler(onEndMotion)
        }

        if (wavBuffer) {
            this.wavController.start(wavBuffer)
        }

        return this.motionManager.startMotionPriority(motion, autoDelete, priority)
    }

    public startRandomMotion = async (group: string | null, priority: number, onStartMotion?: BeganMotionCallback, 
        onEndMotion?: FinishedMotionCallback): Promise<CubismMotionQueueEntryHandle> => {
        if (!group) {
            const randGroup = Math.floor(Math.random() * this.settings.getMotionGroupCount())
            group = this.settings.getMotionGroupName(randGroup)
        }
        const rand = Math.floor(Math.random() * this.settings.getMotionCount(group))
        return this.startMotion(group, rand, priority, onStartMotion, onEndMotion)
    }

    public setExpression = (expression: string) => {
        const motion = this.expressions.getValue(expression)
        if (motion !== null) this.expressionManager.startMotion(motion, false)
    }

    public setRandomExpression = () => {
        if (!this.expressions.getSize()) return
        const rand = Math.floor(Math.random() * this.expressions.getSize())
        const name = this.expressions._keyValues[rand].first
        this.setExpression(name)
    }

    public hitTest = (areaName: string, x: number, y: number) => {
        if (!this.settings) return
        if (this.opacity < 1) return
        for (let i = 0; i < this.settings.getHitAreasCount(); i++) {
            if (this.settings.getHitAreaName(i) == areaName) {
                const drawId = this.settings.getHitAreaId(i)
                return this.isHit(drawId, x, y)
            }
        }
    }

    public isMocConsistent = () => {
        const {modelBuffer} = this.buffers
        return CubismMoc.hasMocConsistency(modelBuffer)
    }

    public pointerDown = (event: PointerEvent) => {
        if (this.paused) return
        const rect = this.canvas.getBoundingClientRect()
        const posX = event.clientX - rect.left
        const posY = event.clientY - rect.top
        this.touchController.touchStart(posX, posY)
    }

    public pointerMove = (event: PointerEvent) => {
        if (this.paused) return
        const rect = this.canvas.getBoundingClientRect()
        const posX = event.clientX - rect.left
        const posY = event.clientY - rect.top

        const x = this.transformX(this.touchController.lastX)
        const y = this.transformY(this.touchController.lastY)

        this.touchController.touchMove(posX, posY)
        this.setDragging(x, y)
    }

    public pointerUp = (event: PointerEvent) => {
        if (this.paused) return
        const rect = this.canvas.getBoundingClientRect()
        const posX = event.clientX - rect.left
        const posY = event.clientY - rect.top
        this.setDragging(0, 0)
        const x = this.transformX(posX)
        const y = this.transformY(posY)
        if (this.hitTest("Head", x, y)) {
            this.setRandomExpression()
        } else if (this.hitTest("Body", x, y)) {
            this.startRandomMotion("TapBody", MotionPriority.Normal)
        }
    }

    public transformX = (pointX: number) => {
        const screenX = this.deviceToScreen.transformX(pointX)
        return this.viewMatrix.invertTransformX(screenX)
    }

    public transformY = (pointY: number) => {
        const screenY = this.deviceToScreen.transformY(pointY)
        return this.viewMatrix.invertTransformY(screenY)
    }

    public startPointerInteractions = () => {
        if (!this.autoInteraction) return
        document.addEventListener("pointerdown", this.pointerDown, {passive: true})
        document.addEventListener("pointermove", this.pointerMove, {passive: true})
        document.addEventListener("pointerup", this.pointerUp, {passive: true})
        document.addEventListener("pointercancel", this.pointerUp, {passive: true})
    }

    public cancelPointerInteractions = () => {
        document.removeEventListener("pointerdown", this.pointerDown)
        document.removeEventListener("pointermove", this.pointerMove)
        document.removeEventListener("pointerup", this.pointerUp)
        document.removeEventListener("pointercancel", this.pointerUp)
    }
}