import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import Tab1 from '../components/Pages/TabStripPage/Tab1';
import Tab2 from '../components/Pages/TabStripPage/Tab2';
import Tab3 from '../components/Pages/TabStripPage/Tab3';
import './SimplePage.scss'
import { useState } from 'react';

export default function TabStripPage(): JSX.Element {
    enum TypeOnglets
    {
        Tab1 = "tab1",
        Tab2 = "tab2",
        Tab3 = "tab3",
    }

    const [tabSelected, setTabSelected] = useState<number>(Object.values(TypeOnglets).indexOf((TypeOnglets.Tab1) as TypeOnglets));


    return (
        <div className="tab-strip-page">
            <h1>Welcome TabStrip page</h1>
            <TabStrip selected={tabSelected} onSelect={(e) => setTabSelected(e.selected)} animation={false} renderAllContent={true} keepTabsMounted>
            {
                    Object.values(TypeOnglets).map((key, index) =>
                    {
                        switch (key)
                        {
                            case TypeOnglets.Tab1:
                                return (
                                    <TabStripTab key={key} title={key}>
                                        <Tab1 isActive={tabSelected === index} />
                                    </TabStripTab>
                                );
                            case TypeOnglets.Tab2:
                                return (
                                    <TabStripTab key={key} title={key}>
                                        <Tab2 isActive={tabSelected === index} />
                                    </TabStripTab>
                                );
                            default:
                                return (
                                    <TabStripTab key={key} title={key}>
                                        <Tab3 isActive={tabSelected === index} />
                                    </TabStripTab>
                                );
                        }
                    })
                }
            </TabStrip>
        </div>
    );
}
