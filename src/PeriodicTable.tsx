import * as React from "react";
import { mapValues } from "./util";
import * as data from "./data";
import { Katex } from "./Katex";

const groupColor = {
  nonmetal: "bg-purple-800",
  "noble gas": "bg-yellow-800",
  "alkali metal": "bg-green-700",
  "alkaline earth metal": "bg-green-600",
  metalloid: "bg-purple-900",
  halogen: "bg-purple-700",
  metal: "bg-indigo-800",
  "transition metal": "bg-indigo-700",
  lanthanoid: "bg-blue-500",
  actinoid: "bg-blue-600",
  "post-transition metal": "bg-indigo-900",
};
const gcolors = mapValues(groupColor, (k, v) => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  div.classList.add(v);
  const bg = window.getComputedStyle(div).backgroundColor;
  document.body.removeChild(div);
  return bg;
});
console.log(gcolors);

// const groupColor2 = {
//   nonmetal: "#5B21B6",
//   "noble gas": "#92400E",
//   "alkali metal": "#047857",
//   "alkaline earth metal": "bg-green-600",
//   metalloid: "bg-purple-900",
//   halogen: "bg-purple-700",
//   metal: "bg-indigo-800",
//   "transition metal": "bg-indigo-700",
//   lanthanoid: "bg-blue-500",
//   actinoid: "bg-blue-600",
//   "post-transition metal": "bg-indigo-900",
// };

const gaps: Record<number, number> = {
  1: 18,
  4: 13,
  12: 13,
};

const preElements = data.elementList
  .map((e, i) => ({
    show: (i > 56 && i < 71) || (i > 88 && i < 103) ? false : true,
    dots: i == 56 || i == 88,
    element: e,
    nr: i,
  }))
  .filter((x) => x.show);

export const PeriodicTable: React.FC<{
  focus: data.KimiElement[];
  onClick: (e: data.KimiElement) => void;
}> = ({ focus, onClick }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log("RENDER!");

    canvas.width = canvas.parentElement!.clientWidth;
    canvas.height = canvas.width / (40 / 15);
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = 2;
    const width = (canvas.width - 17 * margin) / 18;
    const height = width;

    canvas.onclick = (e) => {
      const col = Math.floor(e.offsetX / (width + margin) + 1);
      const row = Math.floor(e.offsetY / (height + margin) + 1);
      const clicked = preElements.find(
        (e) => e.element.group == col && e.element.period == row
      );
      if (clicked) onClick(clicked.element);
    };

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${width * 0.6}px serif`;

    for (let i = 0; i < preElements.length; i++) {
      const e = preElements[i];

      const inFocus = focus.length == 0 || focus.includes(e.element);

      ctx.globalAlpha = inFocus ? 1 : 0.2;
      ctx.fillStyle = gcolors[e.element.groupBlock];

      const x = ((e.element.group || 0) - 1) * (width + margin);
      const y = (e.element.period - 1) * (height + margin);

      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "white";
      ctx.fillText(e.element.symbol, x + width / 2, y + height / 2);
    }
  }, [focus.map((e) => e.symbol).join(","), canvasRef, onClick]);

  return (
    <div
      className="relative"
      style={{
        width: "35em",
        // height: "15em",
        // aspectRatio: "40 / 15",
      }}
    >
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export const PeriodicTableGrid: React.FC<{
  focus: string[];
}> = ({ focus }) => {
  return (
    <div
      className="relative"
      style={{
        width: "40em",
        height: "15em",
      }}
    >
      <div
        className={
          "grid gap-1 p-4 bg-gray-900 shadow-xl absolute left-0 right-0 top-0 bottom-0"
        }
        style={{
          gridTemplateColumns: "repeat(18, 1fr)",
        }}
      >
        {preElements.map((e, i) => (
          <div
            key={i}
            className={"text-center text-xs"}
            style={{
              gridColumnStart: e.nr in gaps ? gaps[e.nr]! : void 0,
            }}
          >
            <div
              className={
                "p-1 transition-opacity " + groupColor[e.element.groupBlock]
              }
              style={{
                opacity:
                  focus.length == 0 || focus.includes(e.element.symbol)
                    ? 1
                    : 0.4,
                // aspectRatio: "1/1",
              }}
            >
              <Katex src={e.dots ? "\\cdots" : `\\text{${e.element.symbol}}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
