import React, {useContext, useReducer, useEffect, useState} from "react"
import {Live2DContext, DefaultOpacitiesContext} from "../demo"
import {MotionPriority} from "../../live2dcubism"
import parametersIcon from "../../assets/parameters.png"
import partsIcon from "../../assets/parts.png"
import expressionIcon from "../../assets/expression.png"
import motionIcon from "../../assets/motion.png"
import play from "../../assets/play.png"
import pause from "../../assets/pause.png"
import Slider from "react-slider"
import "./styles/parameters.less"

const Parameters: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {live2D, setLive2D} = useContext(Live2DContext)
    const {defaultOpacities, setDefaultOpacities} = useContext(DefaultOpacitiesContext)
    const [expressionValues, setExpressionValues] = useState([] as boolean[])
    const [motionValues, setMotionValues] = useState([] as boolean[])

    useEffect(() => {
        if (live2D) {
            const loop = () => {
                forceUpdate()
                setTimeout(() => {
                    loop()
                }, 5)
            }
            loop()
        }
    }, [live2D])

    const getParameterDialogJSX = () => {
        if (!live2D) return null
        let jsx = [] as React.ReactElement[]

        let parameters = live2D.parameters
        const resetParameters = () => {
            for (let i = 0; i < parameters.ids.length; i++) {
                const defaultValue = parameters.defaultValues[i]
                live2D.setParameter(i, defaultValue)
            }
            live2D.model.update()
            forceUpdate()
        }

        for (let i = 0; i < parameters.ids.length; i++) {
            const id = parameters.ids[i]
            const value = parameters.values[i]
            const defaultValue = parameters.defaultValues[i]
            const min = parameters.minimumValues[i]
            const max = parameters.maximumValues[i]
            const keys = parameters.keyValues[i]
            const step = (Math.abs(max - min) / 100) || 0.01
            const updateParameter = (value: number) => {
                live2D.setParameter(i, value)
                forceUpdate()
            }
            jsx.push(
                <div className="parameters-dialog-row">
                    <span className="parameters-dialog-text">{id}</span>
                    <Slider className="parameters-slider" trackClassName="parameters-slider-track" thumbClassName="parameters-slider-thumb" 
                    onChange={(value: number) => updateParameter(value)} min={min} max={max} step={step} value={value}/>
                </div>
            )
        }
        return (
            <div className="parameters-dialog-box">
                <div className="parameters-dialog-row-center">
                    <img draggable={false} className="parameters-dialog-icon" src={parametersIcon}/>
                    <span className="parameters-dialog-title">Parameters</span>
                </div>
                {jsx}
                <div className="parameters-dialog-row-center">
                    <button className="parameters-button" onClick={() => resetParameters()}>Reset</button>
                </div>
            </div>
        )
    }

    const getPartsDialogJSX = () => {
        if (!live2D) return null
        let jsx = [] as React.ReactElement[]

        let parts = live2D.parts
        const resetParts = () => {
            for (let i = 0; i < parts.ids.length; i++) {
                const defaultValue = defaultOpacities[i] ?? 1
                live2D.setPartOpacity(i, defaultValue)
            }
            live2D.model.update()
            forceUpdate()
        }

        for (let i = 0; i < parts.ids.length; i++) {
            const id = parts.ids[i]
            const opacity = parts.opacities[i]
            const updateOpacity = (opacity: number) => {
                live2D.setPartOpacity(i, opacity)
                forceUpdate()
            }
            jsx.push(
                <div className="parameters-dialog-row">
                    <span className="parameters-dialog-text">{id}</span>
                    <Slider className="parameters-slider" trackClassName="parameters-slider-track" thumbClassName="parameters-slider-thumb" 
                    onChange={(opacity: number) => updateOpacity(opacity)} min={0} max={1} step={0.01} value={opacity}/>
                </div>
            )
        }
        return (
            <div className="parts-dialog-box">
                <div className="parameters-dialog-row-center">
                    <img draggable={false} className="parameters-dialog-icon" src={partsIcon}/>
                    <span className="parameters-dialog-title">Parts</span>
                </div>
                {jsx}
                <div className="parameters-dialog-row-center">
                    <button className="parameters-button" onClick={() => resetParts()}>Reset</button>
                </div>
            </div>
        )
    }

    const getExpressionsDialogJSX = () => {
        if (!live2D) return null
        let jsx = [] as React.ReactElement[]

        let expressions = live2D.getExpressions()

        for (const id of expressions) {
            const setExpression = () => {
                live2D.setExpression(id)
            }
            jsx.push(
                <div className="parameters-dialog-row">
                    <span className="parameters-dialog-text" onClick={setExpression}>{id}</span>
                </div>
            )
        }

        return (
            <div className="parts-dialog-box">
                <div className="parameters-dialog-row-center">
                    <img draggable={false} className="parameters-dialog-icon" src={expressionIcon}/>
                    <span className="parameters-dialog-title">Expressions</span>
                </div>
                {jsx}
            </div>
        )
    }

    const getMotionsDialogJSX = () => {
        if (!live2D) return null
        let jsx = [] as React.ReactElement[]

        let motions = live2D.getMotions()

        for (let i = 0; i < motions.length; i++) {
            const name = motions[i]
            const onStartMotion = () => {
                motionValues.fill(false)
                motionValues[i] = true
            }
            const onEndMotion = () => {
                motionValues[i] = false
            }
            const startMotion = () => {
                const [group, idx] = name.split("_")
                live2D.stopMotions()
                live2D.startMotion(group, Number(idx), MotionPriority.Force, onStartMotion, onEndMotion)
            }
            jsx.push(
                <div className="parameters-dialog-row">
                    <span className="parameters-dialog-text">{name}</span>
                    <img draggable={false} className="parameters-dialog-icon" src={motionValues[i] ? pause : play} onClick={startMotion}/>
                </div>
            )
        }

        return (
            <div className="parts-dialog-box">
                <div className="parameters-dialog-row-center">
                    <img draggable={false} className="parameters-dialog-icon" src={motionIcon}/>
                    <span className="parameters-dialog-title">Motions</span>
                </div>
                {jsx}
            </div>
        )
    }

    return (
        <>
        <div className="parameters-container">
            {getParameterDialogJSX()}
            {getPartsDialogJSX()}
        </div>
        <div className="parameters-container-right">
            {getExpressionsDialogJSX()}
            {getMotionsDialogJSX()}
        </div>
        </>
    )
}

export default Parameters