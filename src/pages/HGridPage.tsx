import { GridColumn } from '@progress/kendo-react-grid';
import products from '../resources/gd-products.ts';
import './HGridPage.scss'
import HGrid from '../helpers/HGrid.tsx';

export default function HGridPage(): JSX.Element {

 
    /*const onSelectedItemsChange = (ev) => {
        console.log(ev.selectedItems);
    };*/

    return (
        <div className="h-grid-page">
            <h1>Welcome h-grid-page</h1>
            <br/>
                <HGrid
                    //columnsProps={}
                    data={products}
                    dataItemKey='ProductID'
                    hToolbarSettings={{
                        excelExportButton: true,
                        expandCollapseAllButton: true,
                        externalFilter: true,
                        filterHighlights: true,
                        pdfExportButton: true,
                        showColumnsConfigurator: true,
                        showFeatureConfigurator: true
                    }}
                    initialDataState={{
                        skip: 0,
                        take: 10,
                        sort: [
                            {
                                field: 'ProductName',
                                dir: 'desc'
                            }
                        ],
                        group: [{ field: 'Category.CategoryName', dir: 'asc' }]
                    }}
                    //onSelectedItemsChange={onSelectedItemsChange}
                    selectable={{
                        selectMode: "Cell",
                        onSelect: () => {},
                        select: {}
                    }}
                    filterable={true}
                    groupable={true}
                    sortable={true}
                    pageable={{ buttonCount: 3, info: true, pageSizes: [5, 10, 50] }}
                >
                    <GridColumn columnType="checkbox" width="65px" filterable={false} />
                    <GridColumn field="ProductID" title="ID" width="100px" filterable={false} />
                    <GridColumn field="ProductName" title="Name" width="340px" />
                    <GridColumn field="Category.CategoryName" title="Category Name" width="180px" />
                    <GridColumn field="UnitPrice" title="Price" filter="numeric" width="160px" />
                    <GridColumn field="UnitsInStock" title="In stock" filter="numeric" width="160px" />
                    <GridColumn field="Discontinued" filter="boolean" width="180px" />
                </HGrid>
        </div>
    );
}
