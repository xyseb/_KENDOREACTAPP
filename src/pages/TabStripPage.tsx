import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import Tab1 from '../components/Pages/TabStripPage/Tab1';
import Tab2 from '../components/Pages/TabStripPage/Tab2';
import './SimplePage.scss'
import { useState } from 'react';

export default function TabStripPage(): JSX.Element {
    enum TypeOnglets
    {
        Tab1 = "tab1",
        Tab2 = "tab2",
    }

    const [tabSelected, setTabSelected] = useState<number>(Object.values(TypeOnglets).indexOf((TypeOnglets.Tab1) as TypeOnglets));


    return (
        <div className="tab-strip-page">
            <h1>Welcome TabStrip page</h1>
            <TabStrip selected={tabSelected} onSelect={(e) => setTabSelected(e.selected)} animation={false} renderAllContent={false}>
            {
                    Object.values(TypeOnglets).map((key, index) =>
                    {
                        switch (key)
                        {
                            case TypeOnglets.Tab1:
                                return (
                                    <TabStripTab key={index} title={key}>
                                        <Tab1 />
                                    </TabStripTab>
                                );
                            case TypeOnglets.Tab2:
                            default:
                                return (
                                    <TabStripTab key={index} title={key}>
                                        <Tab2 />
                                    </TabStripTab>
                                );
                        }
                    })
                }
            </TabStrip>
        </div>
    );
}
