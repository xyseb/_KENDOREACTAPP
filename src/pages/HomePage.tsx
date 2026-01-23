import { useState, useRef } from "react";
import "./HomePage.scss";
import { HTooltip } from "../components/HTooltip/Htooltip";

const positions = [
  "top-left",
  "top",
  "top-right",
  "left",
  null,
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
] as const;

type Position = Exclude<typeof positions[number], null>;

export default function HomePage(): JSX.Element {
  const [counter, setCounter] = useState(0);
  const click = () => setCounter(v => v + 1);

  /*const refs = useRef<Record<Position, HTMLButtonElement | null>>({
    "top-left": null,
    "top": null,
    "top-right": null,
    "right": null,
    "bottom-right": null,
    "bottom": null,
    "bottom-left": null,
    "left": null,
  });*/
  
  const ref1 = useRef<HTMLButtonElement>(null);
  const ref2 = useRef<HTMLButtonElement>(null);
  const ref3 = useRef<HTMLButtonElement>(null);
  const ref4 = useRef<HTMLButtonElement>(null);
  const ref5 = useRef<HTMLButtonElement>(null);
  const ref6 = useRef<HTMLButtonElement>(null);
  const ref7 = useRef<HTMLButtonElement>(null);
  const ref8 = useRef<HTMLButtonElement>(null);

  const getEmoji = (pos: Position): JSX.Element => {
    switch (pos) {
        case "top-left":
            return <span className="top-left-emoji"><sup>👈</sup>😎</span>;
            break;
    
        case "top":
            return <span className="top-emoji">😎<sup>👆</sup></span>;
            break;
    
        case "top-right":
            return <span className="top-right-emoji">😎<sup>👉</sup></span>;
            break;
    
        case "right":
            return <span className="right-emoji">😎👉</span>;
            break;
    
        case "bottom-right":
            return <span className="bottom-right-emoji">😎<sub>👉</sub></span>;
            break;
    
        case "bottom":
            return <span className="bottom-emoji">😎<sub>👇</sub></span>;
            break;
    
        case "bottom-left":
            return <span className="bottom-left-emoji"><sub>👈</sub>😎</span>;
            break;
    
        case "left":
        default:
            return <span className="left-emoji">👈😎</span>;
            break;
    }
  };

  return (
    <div className="home-page">
      <h1>HTooltip – Tests complets</h1>
      <h3>Buttons clicked {counter} time{counter > 1 && 's'}</h3>

      {/* ================= JSX / CHILDREN ================= */}
      <h2>Cas JSX (children)</h2>

      <div className="grid">
        {/*positions.map((pos, i) =>
          pos ? (
            <HTooltip key={i} content={<p className="tooltip-content">{i + " - " + pos.toUpperCase()} : <br />{getEmoji(pos)}</p>} position={pos}>
              <button
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onClick={click}>{pos}</button>
            </HTooltip>
          ) : (
            <div key={i} />
          )
        )*/}
            <div>
              <HTooltip content={<p className="tooltip-content">{1 + " - " + "top-left".toUpperCase()} : <br /><span className="top-left-emoji"><sup>👈</sup>😎</span></p>}
                  position="top-left">
                  <button onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>top-left</button>
            </HTooltip>
            </div>
            <div>
              <HTooltip content={<p className="tooltip-content">{2 + " - " + "top".toUpperCase()} : <br /><span className="top-left-emoji">😎<sup>👆</sup></span></p>}
                  position="top">
                  <button onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>top</button>
                  </HTooltip>
            </div>
            <div>
              <HTooltip content={<p className="tooltip-content">{3 + " - " + "top-right".toUpperCase()} : <br /><span className="top-left-emoji">😎<sup>👉</sup></span></p>}
                  position="top-right">
                 <button onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>top-right</button>
              </HTooltip>
            </div>
            <div>
              <HTooltip content={<p className="tooltip-content">{4 + " - " + "left".toUpperCase()} : <br /><span className="left-emoji">👈😎</span></p>}
                  position="left">
                  <button onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>left</button>
              </HTooltip>
            </div>
            <div></div>
            <div>
              <HTooltip content={<p className="tooltip-content">{5 + " - " + "right".toUpperCase()} : <br /><span className="right-emoji">😎👉</span></p>}
                  position="right">
                 <button onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>right</button>
              </HTooltip>
            </div>
            <div>
              <HTooltip content={<p className="tooltip-content">{6 + " - " + "bottom-left".toUpperCase()} : <br /><span className="bottom-left-emoji"><sub>👈</sub>😎</span></p>}
                  position="bottom-left">
                  <button onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>bottom-left</button>
              </HTooltip>
            </div>
            <div>
              <HTooltip content={<p className="tooltip-content">{7 + " - " + "bottom".toUpperCase()} : <br /><span className="bottom-emoji">😎<sub>👇</sub></span></p>}
                  position="bottom">
                  <button onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>bottom</button>
              </HTooltip>
            </div>
            <div>
              <HTooltip content={<p className="tooltip-content">{8 + " - " + "bottom-right".toUpperCase()} : <br /><span className="bottom-right-emoji">😎<sub>👉</sub></span></p>}
                  position="bottom-right" defaultOpen>
                  <button onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>bottom-right</button>
              </HTooltip>
            </div>
      </div>

      {/* ================= REF ================= */}
      <h2>Cas anchorRef</h2>

      <div className="grid">
        {/*positions.map((pos, i) =>
          pos ? (
            <div key={i}>
              <HTooltip
                content={<p className="tooltip-content">{i + " - " + pos.toUpperCase()} : <br />{getEmoji(pos)}</p>}
                position={pos}
                gap={8}
                anchorRef={{
                  get current() {
                    return refs.current[pos];
                  }
                }}
                 defaultOpen={i === 8}
              />

              <button
                ref={el => (refs.current[pos] = el)}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onClick={click}
              >
                {pos}
              </button>
            </div>
          ) : (
            <div key={i} />
          )
        )*/}
            <div key={1}>
              <HTooltip content={<p className="tooltip-content">{1 + " - " + "top-left".toUpperCase()} : <br /><span className="top-left-emoji"><sup>👈</sup>😎</span></p>}
                  position="top-left" anchorRef={ref1}/>
              <button ref={ref1} onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>top-left</button>
            </div>
            <div key={2}>
              <HTooltip content={<p className="tooltip-content">{2 + " - " + "top".toUpperCase()} : <br /><span className="top-left-emoji">😎<sup>👆</sup></span></p>}
                  position="top" anchorRef={ref2}/>
              <button ref={ref2} onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>top</button>
            </div>
            <div key={3}>
              <HTooltip content={<p className="tooltip-content">{3 + " - " + "top-right".toUpperCase()} : <br /><span className="top-left-emoji">😎<sup>👉</sup></span></p>}
                  position="top-right" anchorRef={ref3}/>
              <button ref={ref3} onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>top-right</button>
            </div>
            <div key={4}>
              <HTooltip content={<p className="tooltip-content">{4 + " - " + "left".toUpperCase()} : <br /><span className="left-emoji">👈😎</span></p>}
                  position="left" anchorRef={ref4}/>
              <button ref={ref4} onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>left</button>
            </div>
            <div key={5}></div>
            <div key={6}>
              <HTooltip content={<p className="tooltip-content">{5 + " - " + "right".toUpperCase()} : <br /><span className="right-emoji">😎👉</span></p>}
                  position="right" anchorRef={ref5}/>
              <button ref={ref5} onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>right</button>
            </div>
            <div key={7}>
              <HTooltip content={<p className="tooltip-content">{6 + " - " + "bottom-left".toUpperCase()} : <br /><span className="bottom-left-emoji"><sub>👈</sub>😎</span></p>}
                  position="bottom-left" anchorRef={ref6}/>
              <button ref={ref6} onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>bottom-left</button>
            </div>
            <div key={8}>
              <HTooltip content={<p className="tooltip-content">{7 + " - " + "bottom".toUpperCase()} : <br /><span className="bottom-emoji">😎<sub>👇</sub></span></p>}
                  position="bottom" anchorRef={ref7}/>
              <button ref={ref7} onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>bottom</button>
            </div>
            <div key={9}>
              <HTooltip content={<p className="tooltip-content">{8 + " - " + "bottom-right".toUpperCase()} : <br /><span className="bottom-right-emoji">😎<sub>👉</sub></span></p>}
                  position="bottom-right" anchorRef={ref8} defaultOpen/>
              <button ref={ref8} onMouseEnter={() => {}} onMouseLeave={() => {}} onClick={click}>bottom-right</button>
            </div>
      </div>

        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore. Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque dicta amette repudiandae dignissimos dolores voluptatum saepe rerum? Ipsum, deleniti sapiente numquam odio accusantium omnis amet culpa, dolorum eos hic non.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>

    </div>
  );
}
