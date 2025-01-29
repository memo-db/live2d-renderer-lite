import React, {useEffect, useRef, useState, useContext, useReducer} from "react"
import {ModelContext, Live2DContext, DefaultOpacitiesContext} from "../demo"
import zoomLock from "../../assets/zoomlock.png"
import zoomLocked from "../../assets/zoomlocked.png"
import zoomIn from "../../assets/zoomin.png"
import zoomOut from "../../assets/zoomout.png"
import halfSpeed from "../../assets/0.5x.png"
import normalSpeed from "../../assets/1x.png"
import doubleSpeed from "../../assets/2x.png"
import pause from "../../assets/pause.png"
import play from "../../assets/play.png"
import {Live2DCubismModel} from "../../live2dcubism"
import "./styles/live2dmodel.less"

const Live2DModel: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {model, setModel} = useContext(ModelContext)
    const {live2D, setLive2D} = useContext(Live2DContext)
    const {defaultOpacities, setDefaultOpacities} = useContext(DefaultOpacitiesContext)
    const [controlHover, setControlHover] = useState(false)
    const [speed, setSpeed] = useState(1)
    const [paused, setPaused] = useState(false)
    const [enableZoom, setEnableZoom] = useState(true)
    const rendererRef = useRef<HTMLCanvasElement>(null)

    const load = async () => {
        let cubismCorePath = "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"
        const live2DModel = new Live2DCubismModel(rendererRef.current!, {cubismCorePath})
        await live2DModel.load(model)
        setLive2D(live2DModel)
        setDefaultOpacities(structuredClone(live2DModel.parts.opacities))
    }

    useEffect(()=> {
        load()
    }, [model])

    useEffect(() => {
        if (!live2D) return
        live2D.paused = paused
        live2D.speed = speed
        live2D.enableZoom = enableZoom
        forceUpdate()
    }, [live2D, paused, speed, enableZoom])

    const changeSpeed = () => {
        if (speed === 0.5) setSpeed(1)
        if (speed === 1) setSpeed(2)
        if (speed === 2) setSpeed(0.5)
    }

    const zoomLockIcon = () => {
        return enableZoom ? zoomLock : zoomLocked
    }

    const speedIcon = () => {
        if (speed === 0.5) return halfSpeed
        if (speed === 1) return normalSpeed
        if (speed === 2) return doubleSpeed
    }

    return (
        <div className="live2d-model-container">
            {live2D ? <div className={`live2d-controls ${controlHover ? "live2d-controls-visible" : ""}`} 
            onMouseEnter={() => setControlHover(true)} onMouseLeave={() => setControlHover(false)}>
                <img draggable={false} className="live2d-control-icon" src={zoomLockIcon()} onClick={() => setEnableZoom((prev) => !prev)}/>
                <img draggable={false} className="live2d-control-icon" src={zoomOut} onClick={() => live2D.zoomOut()}/>
                <img draggable={false} className="live2d-control-icon" src={zoomIn} onClick={() => live2D.zoomIn()}/>
                <img draggable={false} className="live2d-control-icon" src={live2D.paused ? play : pause} onClick={() => setPaused((prev) => !prev)}/>
                <img draggable={false} className="live2d-control-icon" src={speedIcon()} onClick={changeSpeed}/>
            </div> : null}
            <canvas ref={rendererRef} width={700} height={700}></canvas>
        </div>
    )
}

export default Live2DModel