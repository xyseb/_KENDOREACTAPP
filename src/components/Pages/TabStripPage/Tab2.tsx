import { useState, useEffect, useRef } from 'react';
import TabTitle from './TabTitle';
import './Tab2.scss'

export default function Tab2(props: { isActive: boolean }): JSX.Element
{
    /**
     * Compteur de renders REELS du composant.
     * useRef persiste tant que le composant n’est pas démonté.
     */
    const renderCount = useRef<number>(0);

    /**
     * Compteur du nombre d’affichages de l’onglet.
     * Incrémenté uniquement quand l’onglet devient actif.
     */
    const displayCount = useRef<number>(0);

    /**
     * State UNIQUEMENT utilisé pour forcer le re-render
     * du H1 (affichage), pas pour instrumenter le composant.
     */
    const [, forceRender] = useState(0);

    /**
     * Incrémenté à CHAQUE render React.
     * C’est la vérité terrain.
     */
    renderCount.current += 1;
    console.log(`Tab2 ref >>> render réel n°${renderCount.current}`);

    /**
     * Effect exécuté UNE SEULE FOIS.
     * Si ce log apparaît plusieurs fois → le composant est démonté.
     */
    useEffect(() =>
    {
        console.log("Tab2 >>> mounted");

        return () =>
        {
            console.log("Tab2 >>> demonté (NE DOIT PAS ARRIVER)");
        };
    }, []);

    /**
     * Compte les affichages réels de l’onglet.
     * Ne provoque PAS de re-render du Tab.
     */
    useEffect(() =>
    {
        if (props.isActive)
        {
            displayCount.current += 1;
            console.log(`Tab2 useEffect[props.isActive] >>> affiché ${displayCount.current} fois`);

            // On force uniquement le re-render du H1
            forceRender(v => v + 1);
        }
    }, [props.isActive]);

    console.log("Tab2 return")
    return (
        <div className="tab2">
            <TabTitle
                label="Tab2"
                displayCount={displayCount.current}
            />
            <p>Renders React réels : {renderCount.current}</p>
        </div>
    );
}
