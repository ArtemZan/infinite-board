import { useEffect, useRef, useState, createContext, useContext } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { DragableContextProvider } from "./DragHandle";
import { DragHandle } from "./DragHandle"
import "./index.css"

const context = createContext({ scale: 1, bounds: { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }, mousePos: { x: 0, y: 0 }, offset: { x: 0, y: 0 } })

export function InifiniteBoard({ items, updateItem, children }) {
    const draggedIndex = useRef(null)
    const dragOffset = useRef({ x: 0, y: 0 })
    const mousePos = useRef({ x: 0, y: 0 })
    const itemsWrapper = useRef()
    const board = useRef()
    const canvasBounds = useRef({ min: { x: 0, y: 0 }, max: { x: 0, y: 0 } })
    const [canvasSize, setCanvasSize] = useState({ x: 0, y: 0 })
    const spaceUpdateTimeout = useRef(null)
    const isBoardDragged = useRef(false)
    const boardDragOffset = useRef({ x: 0, y: 0 })
    const [scale, setScale] = useState(1)
    const scaleRef = useRef(1)
    const boardRect = useRef({ x: 0, y: 0, width: 0, height: 0 })
    const [scroll, setScroll] = useState({ x: 0, y: 0 })
    const offset = useRef({ x: 0, y: 0 })
    const lastValidPosition = useRef({x: 0, y: 0})

    function updateSpace() {

        const { min, max } = canvasBounds.current

        let updated = false

        const elements = [...itemsWrapper.current.children]

        const element = elements[draggedIndex.current]
        const rect = element.getBoundingClientRect()
        const boardRect = board.current.getBoundingClientRect()

        const updatedRect = {
            x: mousePos.current.x - dragOffset.current.x,
            y: mousePos.current.y - dragOffset.current.y,
            width: rect.width,
            height: rect.height
        }

        const updatedPosition = {
            x: (updatedRect.x - boardRect.x + Math.min(offset.current.x, 0) + board.current.scrollLeft) / scaleRef.current + min.x,
            y: (updatedRect.y - boardRect.y + Math.min(offset.current.y, 0) + board.current.scrollTop) / scaleRef.current + min.y
        }

        function isPointInsideRect(point, { x, y, width, height }) {
            return point.x > x && point.x < x + width && point.y > y && point.y < y + height
        }

        function doRectIntersect(rect1, rect2) {
            const r2BetweenR1Vertical = (rect1.x < rect2.x && rect1.x + rect1.width > rect2.x)
                || (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x + rect2.width)

            const r1BetweenR2Vertical = (rect2.x < rect1.x && rect2.x + rect2.width > rect1.x)
                || (rect2.x < rect1.x + rect1.width && rect2.x + rect2.width > rect1.x + rect1.width)

            const r2BetweenR1Horizontal = (rect1.y < rect2.y && rect1.y + rect1.height > rect2.y)
                || (rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y + rect2.height)

            const r1BetweenR2Horizontal = (rect2.y < rect1.y && rect2.y + rect2.height > rect1.y)
                || (rect2.y < rect1.y + rect1.height && rect2.y + rect2.height > rect1.y + rect1.height)

            const doIntersect = (r2BetweenR1Vertical || r1BetweenR2Vertical) && (r2BetweenR1Horizontal || r1BetweenR2Horizontal)

            return doIntersect
        }

        let foundIntersection = false

        for (let i in elements) {
            if (i == draggedIndex.current) {
                continue
            }

            //console.log(itemsWrapper.current.children)

            const item = elements[i]
            const checkedRect = item.getBoundingClientRect()

            foundIntersection = foundIntersection || doRectIntersect(updatedRect, checkedRect)

            if (foundIntersection) {
                break
                //console.log("Intersect with ", item)
            }
        }

        if(!foundIntersection)
        {
            lastValidPosition.current = updatedPosition
        }

        updateItem(draggedIndex.current, updatedPosition)

        if (updatedPosition.x < min.x || updatedPosition.y < min.y) {
            updated = true
        }
    }

    function onMouseMove(e) {
        const boardRect = board.current.getBoundingClientRect()
        mousePos.current = { x: e.clientX - boardRect.x, y: e.clientY - boardRect.y }
        //console.log(board.current.scrollLeft)

        //console.log(draggedIndex.current)


        if (isBoardDragged.current) {
            //console.log("Drag board", boardDragOffset.current.y, mousePos.current.y)

            const x = boardDragOffset.current.x - mousePos.current.x
            const y = boardDragOffset.current.y - mousePos.current.y

            const padding = 500

            setCanvasSize({
                x: Math.max((x + boardRect.width) / scaleRef.current + canvasBounds.current.min.x - padding, canvasBounds.current.max.x + padding) - Math.min(x, canvasBounds.current.min.x - padding),
                y: Math.max((y + boardRect.height) / scaleRef.current + canvasBounds.current.min.y - padding, canvasBounds.current.max.y + padding) - Math.min(y, canvasBounds.current.min.y - padding)
            })

            offset.current = {x, y}

            setScroll({
                x,
                y
            })
        }

        //console.log(draggedIndex.current)

        if (draggedIndex.current === null) {
            return
        }

        if (spaceUpdateTimeout.current === null) {
            //console.log("Calling update")
            updateSpace()
        }
    }

    function onMouseUp() {
        //console.log("Mouse up")
        if(draggedIndex.current !== null && lastValidPosition.current)
        {
            updateItem(draggedIndex.current, lastValidPosition.current)
            lastValidPosition.current = null
        }
        
        draggedIndex.current = null
        isBoardDragged.current = false
    }

    function onDragStart(e, index) {
        e.stopPropagation()

        draggedIndex.current = index

        const element = itemsWrapper.current.children[index]
        const rect = element.getBoundingClientRect()
        dragOffset.current = { x: mousePos.current.x - rect.x, y: mousePos.current.y - rect.y }

        //const {x, y} = items[index] 
        //lastValidPosition.current = {x, y}

        isBoardDragged.current = false
    }

    function calculateBounds() {
        if (items.length === 0) {
            return canvasBounds.current
        }

        const elements = items.map(({ x, y }, index) => {
            const { width, height } = itemsWrapper.current.children[index].getBoundingClientRect()
            return ({ width: width / scaleRef.current, height: height / scaleRef.current, x, y })
        })

        const first = elements[0]

        const min = {
            x: first.x,
            y: first.y
        }

        const max = {
            x: first.x + first.width,
            y: first.y + first.height
        }

        for (const el of elements) {
            //console.log(el)
            if (el.x < min.x) {
                min.x = el.x
            }

            if (el.x + el.width > max.x) {
                max.x = el.x + el.width
            }

            if (el.y < min.y) {
                min.y = el.y
            }

            if (el.y + el.height > max.y) {
                max.y = el.y + el.height
            }
        }

        const padding = 0

        return {
            min: { x: min.x - padding, y: min.y - padding },
            max: { x: max.x + padding, y: max.y + padding }
        }
    }

    function onBoardDragStart(e) {
        isBoardDragged.current = true
        boardDragOffset.current = {
            x: mousePos.current.x + board.current.scrollLeft + Math.min(offset.current.x, 0),
            y: mousePos.current.y + board.current.scrollTop + Math.min(offset.current.y, 0)
        }
    }

    function onWheel(e) {
        //e.stopPropagation()
        e.preventDefault()

        const minScale = 0.25
        const maxScale = 1

        const prevScale = scaleRef.current
        scaleRef.current = Math.max(Math.min(scaleRef.current - Math.sign(e.deltaY) * 0.05, maxScale), minScale)

        setScale(scaleRef.current)

        const boardRect = board.current.getBoundingClientRect()

        const dScale = prevScale - scaleRef.current

        const offsetSpeed = 1

        setScroll({
            x: board.current.scrollLeft * scaleRef.current / prevScale - (offsetSpeed * (mousePos.current.x - boardRect.width / 2) + boardRect.width / 2) * dScale / scaleRef.current,
            y: board.current.scrollTop * scaleRef.current / prevScale - (offsetSpeed * (mousePos.current.y - boardRect.height / 2) + boardRect.height / 2) * dScale / scaleRef.current
        })
    }

    useEffect(() => {
        document.addEventListener("mouseup", onMouseUp)
        document.addEventListener("mousemove", onMouseMove)

        const boardElement = board.current
        boardElement.addEventListener("wheel", onWheel)
        //boardElement.addEventListener("scroll", onWheel, true)

        return () => {
            document.removeEventListener("mouseup", onMouseUp)
            document.removeEventListener("mousemove", onMouseMove)
            boardElement.removeEventListener("wheel", onWheel)
            //boardElement.removeEventListener("scroll", onWheel, true)
        }
    }, [])

    useEffect(() => {
        if (draggedIndex.current !== null) {
            return
        }

        canvasBounds.current = calculateBounds()
        //canvasBounds.current.min = {x: 0, y: 0}
        const { min, max } = canvasBounds.current
        //console.log(min, max)
        //setCanvasSize({ x: max.x - min.x, y: max.y - min.y })
        setCanvasSize({
            x: Math.max(offset.current.x + boardRect.width, canvasBounds.current.max.x + 0) - Math.min(offset.current.x, canvasBounds.current.min.x - 0),
            y: Math.max(offset.current.y + boardRect.height, canvasBounds.current.max.y) - Math.min(offset.current.y, canvasBounds.current.min.y)
        })
    }, [items, draggedIndex])

    useEffect(() => {
        board.current.scrollLeft = scroll.x
        board.current.scrollTop = scroll.y
    }, [scroll])

    useEffect(() => {
        const rect = board.current.getBoundingClientRect()
        boardRect.current = rect
    })

    const { min } = canvasBounds.current

    return <context.Provider value={{ scale, bounds: canvasBounds.current, containerRect: boardRect, mousePos, offset: { x: scroll.x, y: scroll.y } }}>
        <div className="infinite-board" ref={board} onMouseDown={onBoardDragStart}
            onScroll={e => {
                setScroll({ x: e.target.scrollLeft, y: e.target.scrollTop })
            }}>
            <div className="infinite-board-container" style={{ width: canvasSize.x * scale, height: canvasSize.y * scale }}>
                <div
                    className="items-wrapper"
                    ref={itemsWrapper}
                    style={{ width: canvasSize.x, height: canvasSize.y, transform: `scale(${scale})` }}
                >
                    {items.map((item, index) => {
                        return <DragableContextProvider
                            key={index}
                            onMouseDown={e => onDragStart(e, index)}>
                            <div
                                className="draggable"
                                style={{
                                    left: ((item?.x || 0) - min.x - Math.min(offset.current.x, -0) / scaleRef.current) + "px",
                                    top: ((item?.y || 0) - min.y - Math.min(offset.current.y, 0) / scaleRef.current) + "px"
                                }}>

                                {item.element}
                            </div>
                        </DragableContextProvider>
                    })}
                </div>
            </div>
        </div>
        {children}
    </context.Provider>
}

export { DragHandle }

export const useInfiniteBoard = () => useContext(context)