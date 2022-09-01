import { createContext, useContext } from "react";

const context = createContext({ onMouseDown: e => undefined })

export function DragableContextProvider({ onMouseDown, children }) {
    return <context.Provider value={{ onMouseDown }}>
        {children}
    </context.Provider>
}

export function DragHandle({ children, ...containerProps }) {
    const { onMouseDown } = useContext(context)

    return <div className = "handle-wrapper" onMouseDown={onMouseDown} {...containerProps}>
        {children}
    </div>
}