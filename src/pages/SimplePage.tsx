import { useState } from 'react';
import HTooltipMoveButton from '../components/HTooltipMoveButton/HTooltipMoveButton';
import HTooltipMoveButtonV2 from '../components/HTooltipMoveButton/HTooltipMoveButtonV2';

import './SimplePage.scss';

/*function CounterButton2Finders() {
  const [count, setCount] = useState(0)
  const [color, setColor] = useState<'red' | 'blue'>('blue')

  // nombre de pointers actifs
  const activePointers = useRef<Set<number>>(new Set())
  const colorChangedRef = useRef(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    activePointers.current.add(e.pointerId)

    // deuxième doigt détecté
    if (activePointers.current.size === 2 && !colorChangedRef.current) {
      colorChangedRef.current = true
      setColor(c => (c === 'red' ? 'blue' : 'red'))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId)

    // clic simple → un seul doigt, aucune coloration déclenchée
    if (activePointers.current.size === 0 && !colorChangedRef.current) {
      setCount(c => c + 1)
    }

    // reset quand tous les doigts sont levés
    if (activePointers.current.size === 0) {
      colorChangedRef.current = false
    }
  }

  const handlePointerCancel = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId)

    if (activePointers.current.size === 0) {
      colorChangedRef.current = false
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ color }}>{count}</h2>

      <button
        style={{ touchAction: 'manipulation' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        Action
      </button>
    </div>
  )
}*/



export default function SimplePage(): JSX.Element {
    const [countHTMB, setCountHTMB] = useState(0);
    const [countHTMBV2, setCountHTMBV2] = useState(0);

    function handleButtonClick() {
      setCountHTMB((c) => c + 1);
    }

    function handleButtonClickV2() {
      setCountHTMBV2((c) => c + 1);
    }

    return (
        <div className="simple-page">
            <h1>Welcome simple page</h1>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore. Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque dicta amette repudiandae dignissimos dolores voluptatum saepe rerum? Ipsum, deleniti sapiente numquam odio accusantium omnis amet culpa, dolorum eos hic non.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            {/* <div style={{ textAlign: 'center' }}>
                <HTooltipMoveButton>
                  <button className="button" onClick={handleButtonClick} title="J'ai un tooltip via l'attribut title">
                    {countHTMB === 0 ? 'Clic moi' : `Clic moi !: ${countHTMB} clic${countHTMB < 2 ? '' : 's'}`}
                  </button>
                </HTooltipMoveButton>
            </div> */}
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <HTooltipMoveButtonV2 tooltipContent={undefined}>
                <button className="button" onClick={handleButtonClickV2} title="J'ai un tooltip via l'attribut title">
                    {countHTMBV2 === 0 ? 'Clic moi' : `Clic moi !: ${countHTMBV2} clic${countHTMBV2 < 2 ? '' : 's'}`}
                </button>
            </HTooltipMoveButtonV2>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            {/* <CounterButton2Finders /> */}
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi repellat, similique reiciendis quod velit amet veniam minus est voluptates explicabo quisquam ex provident culpa ea ipsa neque eos error labore.</p>
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
