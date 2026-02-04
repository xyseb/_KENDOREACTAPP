import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { IconContext } from 'react-icons';
//import './index.scss'
import './kendo.scss'


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    //<React.StrictMode>
        <IconContext.Provider value={{ className: "react-icons", size: "1.3335em" /*Uniformisation des tailles des icones react-icons pour avoisiner le 1em des icones de kendo-react*/ }}>
            <App />
        </IconContext.Provider>
    //</React.StrictMode>,
)
