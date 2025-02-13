import { useEffect, useState } from 'react';
import './HomePage.scss'

export default function HomePage(): JSX.Element {
    const [counter, setCounter] = useState(0);

    useEffect(() =>
    {
        console.log("useEffect");
        console.log("useEffect");
    }, []);
    
    const click =() => {
        setCounter(prev => ++prev)
        console.log("useEffect");
    }

    return (
        <div className="home-page">
            <h1>Welcome Home</h1>
            <button onClick={click}>{counter === 0 ? "ClickMe" : `Clicked ${counter} times`}</button>
        </div>
    );
}
