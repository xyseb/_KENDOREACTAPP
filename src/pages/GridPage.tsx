import { Grid, GridColumn as Column, GridHeaderCellProps, GridCustomFooterCellProps } from '@progress/kendo-react-grid';
import products from '../resources/gd-products.ts';
import './GridPage.scss'

export default function GridPage(): JSX.Element {

    //BEGIN custom code
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
        <div className="grid-page">
            <h1>Welcome grid-page</h1>
            <br/>
                <Grid style={{ height: '520px' }}
                            cells={{
                                footerCell: TotalFooterCustomCell
                            }}
                    >
                    <Column field={'selected'} width="65px" filterable={false} cells={{headerCell: CustomHeaderCell}} />
                    <Column field="ProductID" title="ID" width="100px" filterable={false} />
                    <Column field="ProductName" title="Name" width="340px" />
                    <Column field="Category.CategoryName" title="Category Name" width="180px" />
                    <Column field="UnitPrice" title="Price" filter="numeric" width="160px" />
                    <Column field="UnitsInStock" title="In stock" filter="numeric" width="160px" />
                    <Column field="Discontinued" filter="boolean" width="180px" />
                </Grid>
        </div>
    );
}
