import { Grid, GridColumn } from '@progress/kendo-react-grid';
import products from '../resources/gd-products.ts';
import './HGridPage.scss'
import { GridHelperNew } from '../helpers/GridHelperNew.tsx';
import { uGrid } from '@progress/kendo-react-common';

export default function GridHelperPage(): JSX.Element {

 
    const onSelectedItemsChange = (ev) => {
        console.log(ev.selectedItems);
    };

    return (
        <div>
            <GridHelperNew
                toolbarSettings={{
                    filterHighlights: true,
                    expandCollapseAllButton: true,
                    pdfExportButton: true,
                    excelExportButton: true,
                    externalFilter: true,
                    showFeaturesConfigurator: true,
                    showColumnsConfigurator: true
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
                onSelectedItemsChange={onSelectedItemsChange}
                filterable={true}
                dataItemKey={'ProductID'}
                selectable={true}
                groupable={true}
                sortable={true}
                pageable={{ buttonCount: 3, info: true, pageSizes: [5, 10, 50] }}
                data={products}
            >
                <Grid style={{ height: '520px' }}>
                    <GridColumn columnType="checkbox" width="65px" filterable={false} />
                    <GridColumn field="ProductID" title="ID" width="100px" filterable={false} />
                    <GridColumn field="ProductName" title="Name" width="340px" />
                    <GridColumn field="Category.CategoryName" title="Category Name" width="180px" />
                    <GridColumn field="UnitPrice" title="Price" filter="numeric" width="160px" />
                    <GridColumn field="UnitsInStock" title="In stock" filter="numeric" width="160px" />
                    <GridColumn field="Discontinued" filter="boolean" width="180px" />
                </Grid>
            </GridHelperNew>
        </div>
    );
}
