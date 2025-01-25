import {CubismUserModel} from "../framework/src/model/cubismusermodel"

export class Live2DCubismUserModel extends CubismUserModel {
    constructor() {
        super()
    }

    get accelerationX() {
        return this._accelerationX
    }

    set accelerationX(accelerationX) {
        this._accelerationX = accelerationX
    }

    get accelerationY() {
        return this._accelerationY
    }

    set accelerationY(accelerationY) {
        this._accelerationY = accelerationY
    }

    get accelerationZ() {
        return this._accelerationZ
    }

    set accelerationZ(accelerationZ) {
        this._accelerationZ = accelerationZ
    }

    get breath() {
        return this._breath
    }

    set breath(breath) {
        this._breath = breath
    }

    get dragManager() {
        return this._dragManager
    }

    set dragManager(dragManager) {
        this._dragManager = dragManager
    }

    get dragX() {
        return this._dragX
    }

    set dragX(dragX) {
        this._dragX = dragX
    }

    get dragY() {
        return this._dragY
    }

    set dragY(dragY) {
        this._dragY = dragY
    }

    get expressionManager() {
        return this._expressionManager
    }

    set expressionManager(expressionManager) {
        this._expressionManager = expressionManager
    }

    get eyeBlink() {
        return this._eyeBlink
    }

    set eyeBlink(eyeBlink) {
        this._eyeBlink = eyeBlink
    }

    get initialized() {
        return this._initialized
    }

    set initialized(initialized) {
        this._initialized = initialized
    }

    get lastLipSyncValue() {
        return this._lastLipSyncValue
    }

    set lastLipSyncValue(lastLipSyncValue) {
        this._lastLipSyncValue = lastLipSyncValue
    }

    get lipsync() {
        return this._lipsync
    }

    set lipsync(lipsync) {
        this._lipsync = lipsync
    }

    get moc() {
        return this.moc
    }

    set moc(moc) {
        this._moc = moc
    }

    get mocConsistency() {
        return this._mocConsistency
    }

    set mocConsistency(mocConsistency) {
        this._mocConsistency = mocConsistency
    }

    get modelMatrix() {
        return this._modelMatrix
    }

    set modelMatrix(modelMatrix) {
        this._modelMatrix = modelMatrix
    }

    get modelUserData() {
        return this._modelUserData
    }

    set modelUserData(modelUserData) {
        this._modelUserData = modelUserData
    }

    get model() {
        return this._model
    }

    set model(model) {
        this._model = model
    }

    get motionManager() {
        return this._motionManager
    }

    set motionManager(motionManager) {
        this._motionManager = motionManager
    }

    get opacity() {
        return this._opacity
    }

    set opacity(opacity) {
        this._opacity = opacity
    }

    get pose() {
        return this._pose
    }

    set pose(pose) {
        this._pose = pose
    }

    get physics() {
        return this._physics
    }

    set physics(physics) {
        this._physics = physics
    }

    get updating() {
        return this._updating
    }

    set updating(updating) {
        this._updating = updating
    }

    get parameters() {
        const model = this.model as any
        return model._model.parameters as {count: number, defaultValues: Float32Array, ids: string[], 
        keyCounts: Int32Array, keyValues: Float32Array[], maximumValues: Float32Array, minimumValues: Float32Array, 
        opacities: Float32Array, types: Int32Array, values: Float32Array}
    }

    public getParameterValue = (index: number) => {
        return this.model.getParameterValueByIndex(index)
    }

    public setParameter = (index: number, value: number) => {
        this.model.setParameterValueByIndex(index, value)
        this.model.update()
    }

    get parts() {
        const model = this.model as any
        return model._model.parts as {count: number, ids: string[], 
        opacities: Float32Array, parentIndices: Float32Array}
    }

    public getPartOpacity = (index: number) => {
        return this.model.getPartOpacityByIndex(index)
    }

    public setPartOpacity = (index: number, opacity: number) => {
        this.model.setPartOpacityByIndex(index, opacity)
        this.model.update()
    }

    get drawables() {
        const model = this.model as any
        return model._model.drawables as {count: number, constantFlags: Uint8Array, 
        drawOrders: Int32Array, dynamicFlags: Uint8Array, ids: string[], indexCounts: Int32Array,
        indices: Uint16Array[], maskCounts: Int32Array, masks: Int32Array[], multiplyColors: Float32Array,
        opacities: Float32Array, parentPartIndices: Int32Array, renderOrders: Int32Array, screenColors: Float32Array,
        textureIndices: Int32Array, vertexCounts: Int32Array, vertexPositions: Float32Array[], vertexUvs: Float32Array[]}
    }

    get width () {
        const model = this.model as any
        return model._model.canvasinfo.CanvasWidth as number
    }

    get height () {
        const model = this.model as any
        return model._model.canvasinfo.CanvasHeight as number
    }

    get originX () {
        const model = this.model as any
        return model._model.canvasinfo.CanvasOriginX as number
    }

    get originY () {
        const model = this.model as any
        return model._model.canvasinfo.CanvasOriginY as number
    }

    get pixelsPerUnit () {
        const model = this.model as any
        return model._model.canvasinfo.PixelsPerUnit as number
    }
}