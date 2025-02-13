import { Grid, GridColumn as Column, GridHeaderCellProps, GridCustomFooterCellProps } from '@progress/kendo-react-grid';
import { GridHelper } from '../helpers/GridHelper';
import products from '../resources/gd-products.ts';
import './GridHelperPage.scss'
import { render } from 'react-dom';

export default function GridHelperPage(): JSX.Element {

    const onSelectedItemsChange = (ev) => {
        console.log(ev.selectedItems);
    };

    //BEGIN custom code
    const HeaderCustomCell = (props) => {
        console.log(props.children[0].props);
        return <th {...props.thProps}>YO: {props.children}</th>;
    };


    const CustomHeaderCell: React.FC<GridHeaderCellProps> = (headerCellProps) => {
        const { render, title } = headerCellProps;
    
        const handleClick = () => {
          alert(`Action sur ${title}`);
        };
    
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={handleClick} style={{ cursor: "pointer" }}>
              🔘
            </button>
            {/* Utilisation du rendu par défaut, si fourni */}
            {render ? render(null, headerCellProps) : <span>{title}</span>}
          </div>
        );
      };

      const TotalFooterCustomCell = (props: GridCustomFooterCellProps) => {
        const field = props.field || '';
        const min = products.reduce((acc, current) => Math.min(acc, current[field]), Number.MAX_VALUE);
        const max = products.reduce((acc, current) => Math.max(acc, current[field]), 0);
        return props.field === 'UnitPrice' ? (
            <td colSpan={props.colSpan} style={{ ...props.style, color: '#fac390' }}>
                min: {min}, max: {max}
            </td>
        ) : (
            <td
                {...props.tdProps}
                style={{
                    color: '#f97e6d'
                }}
            >
                {props.index}
            </td>
        );
    };
    //END custom code
    return (
        <div className="grid-helper-page">
            <h1>Welcome grid-helper-page</h1>
            <br/>
            <GridHelper
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
                <Grid style={{ height: '520px' }}
                            cells={{
                                footerCell: TotalFooterCustomCell
                            }}
                    >
                    <Column field={'selected'} width="65px" filterable={false} headerCell={CustomHeaderCell} />
                    <Column field="ProductID" title="ID" width="100px" filterable={false} />
                    <Column field="ProductName" title="Name" width="340px" />
                    <Column field="Category.CategoryName" title="Category Name" width="180px" />
                    <Column field="UnitPrice" title="Price" filter="numeric" width="160px" />
                    <Column field="UnitsInStock" title="In stock" filter="numeric" width="160px" />
                    <Column field="Discontinued" filter="boolean" width="180px" />
                </Grid>
            </GridHelper>
        </div>
    );
}
