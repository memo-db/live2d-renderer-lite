export class TouchController {
    public startX: number
    public startY: number
    public lastX: number
    public lastY: number
  
    constructor() {
        this.startX = this.startY = 0
        this.lastX = this.lastY = 0
    }
  
    public touchStart = (posX: number, posY: number) => {
        this.startX = this.lastX = posX
        this.startY = this.lastY = posY
    }
  
    public touchMove = (posX: number, posY: number) => {
        this.lastX = posX
        this.lastY = posY
    }
  
    public getFlickDistance = () => {
        return this.calculateDistance(this.startX, this.startY, this.lastX, this.lastY)
    }
  
    public calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
    }
  
    public calculateMovingAmount = (x1: number, x2: number) => {
        if ((x1 > 0) !== (x2 > 0)) return 0
        return Math.sign(x1) * Math.min(Math.abs(x1), Math.abs(x2))
    }
}