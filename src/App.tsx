import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IntlProvider, load, loadMessages, LocalizationProvider } from '@progress/kendo-react-intl';

import DrawerRouterContainer from './components/DrawerRouterContainer/DrawerRouterContainer';

import HomePage from './pages/HomePage';
import SimplePage from './pages/SimplePage';
import MultiNavPage from './pages/MultiNavPage';
import TestDialogPage from './pages/TestDialogPage';
import GridPage from './pages/GridPage';
import HGridPage from './pages/HGridPage';
import TabStripPage from './pages/TabStripPage';
import './App.scss'
import GridHelperPage from './pages/GridHelperPage';
import GridTestPage from './pages/GridTestPage';

export default function App(): JSX.Element {

    const lang = 'fr-fr'

    return (
        <div className="app">
            <LocalizationProvider language={lang}>
            <IntlProvider locale={lang}>
                <BrowserRouter>
                    <DrawerRouterContainer>
                        <Routes> 
                            <Route path="/home" element={<HomePage />} />
                            <Route path="/simple" element={<SimplePage />} />
                            <Route path="/multi" element={<MultiNavPage />} />
                            <Route path="/test-dialog" element={<TestDialogPage />} />
                            <Route path="/tabstrip" element={<TabStripPage />} />
                            <Route path="/gridhelper" element={<GridHelperPage />} />
                            <Route path="/grid" element={<GridPage />} />
                            <Route path="/hgrid" element={<HGridPage />} />
                            <Route path="/hgridtest" element={<GridTestPage />} />
                            <Route path="*" element={<Navigate to={"/home"}/>} />
                        </Routes>
                    </DrawerRouterContainer>
                </BrowserRouter>
            </IntlProvider>
            </LocalizationProvider>
        </div>
    )
}
