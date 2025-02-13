
import { useEffect, useState } from 'react';
import './Tab2.scss'

export default function Tab2(): JSX.Element {
    const [renderTimes, setRenderTimes] = useState<number|undefined>(undefined);
    useEffect(() =>
    {
        console.log("Tab2>>>fx lu");
        if (!renderTimes)
        {
            console.log("Tab2>>>fx setRendered(0)");
            setRenderTimes(0);
        }
        else
        {
            console.log("Tab2>>>fx setRendered(++)");
            setRenderTimes(prev => prev + 1);
        }
        return () =>
        {
            //console.clear();
            console.log("Tab2>>>demonté (rerender?)");
        };
    }, []);
    console.log(renderTimes === undefined ? "Tab2>>>lecture" : `Tab2>>>render n°${renderTimes}`);
    return (
        <div className="tab2">
            <h1>Tab2</h1>
        </div>
    );
}
