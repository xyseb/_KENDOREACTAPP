

import { useState, useEffect } from 'react';
import './Tab1.scss'

export default function Tab1(): JSX.Element {
    const [renderTimes, setRenderTimes] = useState<number|undefined>(undefined);
    useEffect(() =>
    {
        console.log("Tab1>>>fx lu");
        if (!renderTimes)
        {
            console.log("Tab1>>>fx setRendered(0)");
            setRenderTimes(0);
        }
        else
        {
            console.log("Tab1>>>fx setRendered(++)");
            setRenderTimes(prev => prev + 1);
        }
        return () =>
        {
            //console.clear();
            console.log("Tab1>>>demonté (rerender?)");
        };
    }, []);
    console.log(renderTimes === undefined ? "Tab1>>>lecture" : `Tab1>>>render n°${renderTimes}`);
    return (
        <div className="tab1">
            <h1>Tab1</h1>
        </div>
    );
}
