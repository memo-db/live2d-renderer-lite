import React, {useContext, useState} from "react"
import live2d from "../../assets/live2d.png"
import uparrow from "../../assets/uparrow.png"
import {ModelContext} from "../demo"
import "./styles/titlebar.less"

const TitleBar: React.FunctionComponent = (props) => {
    const {model, setModel} = useContext(ModelContext)
    const [buttonHover, setButtonHover] = useState(false)

    const uploadModel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setModel(url + "#.zip")
    }

    return (
        <div className="titlebar-container">
            <img draggable={false} className="titlebar-logo" src={live2d}/>
            <label htmlFor="file-upload" className={`upload-button ${buttonHover ? "upload-button-hover" : ""}`}
            onMouseEnter={() => setButtonHover(true)} onMouseLeave={() => setButtonHover(false)}>
                <img draggable={false} className="upload-button-img" src={uparrow}/>
                <span className="upload-button-text">Upload Model</span>
            </label>
            <input id="file-upload" type="file" onChange={(event) => uploadModel(event)}/>
        </div>
    )
}

export default TitleBar