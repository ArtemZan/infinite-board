import { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { DragableContextProvider } from "./DragHandle";
import "./index.css"

export function InifiniteBoard({ items, updateItem }) {
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
    scaleRef.current = scale

    function updateSpace() {
        try {

            const { min, max } = canvasBounds.current

            let updated = false

            const item = items[draggedIndex.current]

            const element = itemsWrapper.current.children[draggedIndex.current]
            const rect = element.getBoundingClientRect()
            const boardRect = board.current.getBoundingClientRect()

            updateItem(draggedIndex.current, {
                x: Math.max((mousePos.current.x - boardRect.x - dragOffset.current.x + board.current.scrollLeft) / scaleRef.current + min.x, min.x - 10),
                y: Math.max((mousePos.current.y - boardRect.y - dragOffset.current.y + board.current.scrollTop) / scaleRef.current + min.y, min.y - 10)
            })

            if (rect.x + rect.width > boardRect.x + boardRect.width) {
                board.current.scrollLeft += 10
                updated = true
            }

            if (rect.y + rect.height > boardRect.y + boardRect.height) {
                console.log("Scroll to bottom")
                board.current.scrollTop += 10
                updated = true
            }

            if (rect.x <= boardRect.x) {
                //console.log(item.x, min.x)
                board.current.scrollLeft -= 10
                updated = true
            }

            if (rect.y < boardRect.y) {
                board.current.scrollTop -= 10
                updated = true
            }

            if (updated) {
                spaceUpdateTimeout.current = setTimeout(updateSpace, 17)
                return
            }

            spaceUpdateTimeout.current = null
        }
        catch (e) {
            console.log(e)
            spaceUpdateTimeout.current = null
        }
    }

    function onMouseMove(e) {
        mousePos.current = { x: e.clientX, y: e.clientY }
        //console.log(board.current.scrollLeft)

        //console.log(draggedIndex.current)

        const boardRect = board.current.getBoundingClientRect()

        if (isBoardDragged.current) {
            console.log("Drag board", boardDragOffset.current.y, mousePos.current.y)
            board.current.scrollLeft = boardDragOffset.current.x - mousePos.current.x
            board.current.scrollTop = boardDragOffset.current.y - mousePos.current.y
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
        draggedIndex.current = null
        isBoardDragged.current = false
    }

    function onDragStart(e, index) {
        e.stopPropagation()

        draggedIndex.current = index

        const element = itemsWrapper.current.children[index]
        const rect = element.getBoundingClientRect()
        dragOffset.current = { x: mousePos.current.x - rect.x, y: mousePos.current.y - rect.y }

        console.log(element)
    }

    function calculateBounds() {
        if (items.length === 0) {
            return
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

        return { min: { x: min.x - padding, y: min.y - padding }, max: { x: max.x + padding, y: max.y + padding } }
    }

    function onBoardDragStart(e) {
        isBoardDragged.current = true
        boardDragOffset.current = {
            x: mousePos.current.x + board.current.scrollLeft,
            y: mousePos.current.y + board.current.scrollTop
        }
    }

    function onWheel(e) {
        //console.log(e)
        const minScale = 0.25
        const maxScale = 1

        setScale(scale => Math.max(Math.min(scale - Math.sign(e.deltaY) * 0.05, maxScale), minScale))
        e.stopPropagation()
        e.preventDefault()
    }

    useEffect(() => {
        document.addEventListener("mouseup", onMouseUp)
        document.addEventListener("mousemove", onMouseMove)

        board.current.addEventListener("wheel", onWheel)

        return () => {
            document.removeEventListener("mouseup", onMouseUp)
            document.removeEventListener("mousemove", onMouseMove)
            board.current.removeEventListener("wheel", onWheel)
        }
    }, [])

    useEffect(() => {
        canvasBounds.current = calculateBounds()
        const { min, max } = canvasBounds.current
        //console.log(min, max)
        setCanvasSize({ x: max.x - min.x, y: max.y - min.y })
    }, [items])

    const { min } = canvasBounds.current

    return <div className="infinite-board" ref={board} onMouseDown={onBoardDragStart}>
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
                            style={{ left: (item.x - min.x) + "px", top: (item.y - min.y) + "px" }}>

                            {item.element}
                        </div>
                    </DragableContextProvider>
                })}
            </div>
        </div>
    </div>
}