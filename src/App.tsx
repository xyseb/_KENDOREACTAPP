import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import DrawerRouterContainer from './components/DrawerRouterContainer/DrawerRouterContainer';

import HomePage from './pages/HomePage';
import SimplePage from './pages/SimplePage';
import MultiNavPage from './pages/MultiNavPage';
import TestDialogPage from './pages/TestDialogPage';
import GridPage from './pages/GridPage';
import HGridPage from './pages/HGridPage';
import TabStripPage from './pages/TabStripPage';
import './App.scss'

export default function App(): JSX.Element {

  return (
    <div className="App">
      <BrowserRouter>
          <DrawerRouterContainer>
              <Routes> 
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/simple" element={<SimplePage />} />
                  <Route path="/multi" element={<MultiNavPage />} />
                  <Route path="/test-dialog" element={<TestDialogPage />} />
                  <Route path="/tabstrip" element={<TabStripPage />} />
                  <Route path="/grid" element={<GridPage />} />
                  <Route path="/hgrid" element={<HGridPage />} />
                  <Route path="*" element={<Navigate to={"/home"}/>} />
              </Routes>
          </DrawerRouterContainer>
      </BrowserRouter>
    </div>
  )
}
