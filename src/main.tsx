import * as React from "react";
import * as ReactDOM from "react-dom";
import { Precision } from "./components/UnitInput";
import { KimiApp } from "./KimiApp";
import { Calculator } from "./components/Calculator";
// import { PHConverter } from "./PHConverter";
import "./style.css";

const App: React.FC<{}> = ({}) => {
  const [precision, setPrecision] = React.useState(3);
  return (
    <div className="grid min-h-screen grid-flow-col text-white bg-gray-800 min-w-screen place-items-center">
      <div
        className="grid items-center gap-4"
        style={{ gridTemplateColumns: "auto auto" }}
      >
        <Precision.Provider value={precision}>
          <KimiApp />
        </Precision.Provider>
        <div className="flex flex-col p-2 text-gray-600 shadow">
          <label>Precision</label>
          <input
            type="number"
            className="text-center bg-transparent no-spin"
            value={precision}
            min={0}
            max={10}
            onChange={(e) => setPrecision(parseInt(e.target.value))}
          />
        </div>
        {/* <PHConverter /> */}
        <Calculator precision={precision} />
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("#app")!);
