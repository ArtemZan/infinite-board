import { useState } from "react";
import { InifiniteBoard } from "./InfiniteBoard";
import { DragHandle } from "./InfiniteBoard/DragHandle";

function App() {
  const [items, setItems] = useState([
    { element: <div className="item" style={{ backgroundColor: "#3f5" }}><DragHandle>1</DragHandle></div>, x: 0, y: 0 },
    { element: <DragHandle><div className="item">2</div></DragHandle>, x: 0, y: 0 },
    { element: <div className="item">3</div>, x: 1500, y: 1000 }
  ])

  function updateItem(index, value) {
    setItems(items => items.map((item, i) => i === index ? { ...item, ...value } : item))
  }

  return (
    <div className="app">
      <div style={{ width: "50px", backgroundColor: "#304080", color: "white" }}>Side bar</div>
      <div style={{ display: "flex", flexDirection: "column", width: "0", flexGrow: 1 }}>
        <div style = {{ backgroundColor: "#506090", color: "white"}}>Top bar</div>
        <div style={{ height: "0", flexGrow: 1 }}>
          <InifiniteBoard items={items} updateItem={updateItem} />
        </div>
        <div style = {{ backgroundColor: "#506090", color: "white"}}>Footer</div>
      </div>
      <div style={{ width: "50px", backgroundColor: "#304080", color: "white" }}>Side bar</div>
    </div>
  );
}

export default App;
