import { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
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
    const boardDragOffset = useRef({x: 0, y: 0})

    function updateSpace() {
        const { min, max } = canvasBounds.current

        updateItem(draggedIndex.current, {
            x: mousePos.current.x - dragOffset.current.x + min.x + board.current.scrollLeft,
            y: mousePos.current.y - dragOffset.current.y + min.y + board.current.scrollTop
        })

        let updated = false

        const item = items[draggedIndex.current]

        const element = itemsWrapper.current.children[draggedIndex.current]
        const rect = element.getBoundingClientRect()

        if (rect.x + rect.width > window.innerWidth) {
            board.current.scrollLeft += 10
            updated = true
        }

        if (rect.y + rect.height > window.innerHeight) {
            board.current.scrollTop += 10
            updated = true
        }

        if (rect.x < 0) {
            board.current.scrollLeft -= 10
            updated = true
        }

        if (rect.y < 0) {
            board.current.scrollTop -= 10
            updated = true
        }

        if (updated) {
            spaceUpdateTimeout.current = setTimeout(updateSpace, 17)
            return
        }

        spaceUpdateTimeout.current = null
    }

    function onMouseMove(e) {
        mousePos.current = { x: e.clientX, y: e.clientY }
        //console.log(board.current.scrollLeft)

        //console.log(draggedIndex)
        if(isBoardDragged.current)
        {
            board.current.scrollLeft = boardDragOffset.current.x - mousePos.current.x
            board.current.scrollTop = boardDragOffset.current.y - mousePos.current.y
        }

        if (draggedIndex.current === null) {
            return
        }

        if (spaceUpdateTimeout.current === null) {
            console.log("Calling update")
            updateSpace()
        }
    }

    function onMouseUp() {
        console.log("Mouse up")
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
            return ({ width, height, x, y })
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
            y: mousePos.current.y + board.current.scrollLeft
        }
    }

    useEffect(() => {
        document.addEventListener("mouseup", onMouseUp)
        document.addEventListener("mousemove", onMouseMove)

    }, [])

    useEffect(() => {
        canvasBounds.current = calculateBounds()
        const { min, max } = canvasBounds.current
        //console.log(min, max)
        setCanvasSize({ x: max.x - min.x, y: max.y - min.y })
    }, [items])

    const { min } = canvasBounds.current

    return <div className="infinite-board" ref={board}>
        <div
            className="items-wrapper"
            ref={itemsWrapper}
            style={{ width: canvasSize.x, height: canvasSize.y }}
            onMouseDown={onBoardDragStart}
        >
            {items.map((item, index) => {
                return <div
                    key={index}
                    onMouseDown={e => onDragStart(e, index)}
                    className="draggable"
                    style={{ left: (item.x - min.x) + "px", top: (item.y - min.y) + "px" }}>

                    {item.element}
                </div>
            })}
        </div>
    </div>
}