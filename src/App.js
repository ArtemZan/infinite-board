import { useState } from "react";
import { InifiniteBoard } from "./InfiniteBoard";

function App() {
  const [items, setItems] = useState([
    {element: <div className="item" style={{backgroundColor: "#3f5"}}>1</div>, x: 0, y: 0},
    {element: <div className="item">2</div>, x: 0, y: 0},
    {element: <div className="item">3</div>, x: 1500, y: 1000}
  ])

  function updateItem(index, value)
  {
    setItems(items => items.map((item, i) => i === index ? {...item, ...value} : item))
  }

  return (
    <div className="App">
      <InifiniteBoard items = {items} updateItem={updateItem}/>
    </div>
  );
}

export default App;
