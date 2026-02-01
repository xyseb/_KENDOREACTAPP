import { Children, ReactNode, useRef, useState } from 'react';

import './HTooltipMoveButtonV2.scss';

interface IHTooltipMoveButton
{
    //tactileOnClick: () => void;
    tooltipContent?: JSX.Element | string;
    children: ReactNode;
}

export default function HTooltipMoveButton(props: Readonly<IHTooltipMoveButton>): JSX.Element {
  const [visible, setVisible] = useState<boolean|'clicked'>(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [exiting, setExiting] = useState(false);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const handledRef = useRef(false);

  const SWIPE_THRESHOLD = 12;
  const ANIMATION_DURATION = 200;

  //const handleClick = () => props.tactileOnClick();

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
    handledRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startRef.current || handledRef.current || visible) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startRef.current.x;
    const deltaY = touch.clientY - startRef.current.y;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      handledRef.current = true;
      setSide(deltaX < 0 ? 'left' : 'right');
      setVisible(true);
    }
  };

  // Ne ferme plus le tooltip : on empêche seulement la propagation
  const handleTooltipTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    //e.preventDefault();
    // Ne rien faire d'autre ici : on ne ferme pas le tooltip depuis le tooltip lui-même
  };

  // Empêcher aussi la propagation des clics / mousedown (desktop)
  const handleTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible('clicked');
    // ici on pourrait déclencher une action propre au tooltip plus tard
  };
  const handleTooltipMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTouchEnd = () => {
    startRef.current = null;
    handledRef.current = false;
  };

  const handleOverlayClick = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, ANIMATION_DURATION);
  };

  // Récupère le premier enfant de façon sûre
  const childrenArray = Children.toArray(props.children);
  const firstChild = childrenArray.length > 0 ? (childrenArray[0] as React.ReactElement) : undefined;
  const firstChildTitle = firstChild?.props?.title as string | undefined;
  // Contenu à afficher dans le tooltip quand on est en 'clicked'
  const clickedContent = props.tooltipContent ? props.tooltipContent : firstChildTitle ? <span>{firstChildTitle}</span> : '???';

  return (
      <div
        className="h-tooltip-move-button"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {props.children}

        {visible && visible !== 'clicked' ? (
                <>
                    <div className="tooltip-overlay" onClick={handleOverlayClick} />
                    <div className={`tooltip ${side} ${exiting ? 'exiting' : 'opening'}`}
                        onTouchStart={handleTooltipTouchStart}
                        onClick={handleTooltipClick}
                        onMouseDown={handleTooltipMouseDown}
                    >
                        <span className='question-mark-icon'>?</span>
                    </div>
                </>
            )
            : visible ? (
                <>
                    <div className="tooltip-overlay" onClick={handleOverlayClick} />
                    <div className={`tooltip ${side} ${exiting ? 'exiting' : 'opening'}`}
                        onTouchStart={handleTooltipTouchStart}
                        onClick={handleTooltipClick}
                        onMouseDown={handleTooltipMouseDown}
                    >
                    {clickedContent}
                    </div>
                </>
            )
            : null
        }
      </div>
  );
}
