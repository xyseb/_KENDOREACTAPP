import * as React from 'react';
import { process } from '@progress/kendo-data-query';
import { Button } from '@progress/kendo-react-buttons';
import {
    fileExcelIcon,
    filePdfIcon,
    chevronDoubleDownIcon,
    chevronDoubleRightIcon,
    gearIcon,
    columnsIcon
} from '@progress/kendo-svg-icons';
import { Checkbox, Input, InputChangeEvent } from '@progress/kendo-react-inputs';
import { Popup } from '@progress/kendo-react-popup';
import { GridPDFExport } from '@progress/kendo-react-pdf';
import { ExcelExport } from '@progress/kendo-react-excel-export';
import {
    Grid,
    GridColumn as Column,
    GridToolbar,
    GridProps,
    GridGroupExpandChangeEvent,
    GridSelectionChangeEvent,
    GridHeaderSelectionChangeEvent,
    GridCustomCellProps
} from '@progress/kendo-react-grid';
import { SelectDescriptor, GroupExpandDescriptor } from '@progress/kendo-react-data-tools';
import { GroupResult, State, groupBy } from '@progress/kendo-react-all';

// --------------------------
// Typages
// --------------------------
interface GridHelperToolbarSettings {
    externalFilter?: boolean;
    expandCollapseAllButton?: boolean;
    excelExportButton?: boolean;
    pdfExportButton?: boolean;
    showColumnsConfigurator?: boolean;
    showFeaturesConfigurator?: boolean;
    filterHighlights?: boolean;
}

interface GridHelperProps extends Pick<GridProps, 'filterable' | 'selectable' | 'sortable' | 'groupable' | 'pageable' | 'data' | 'children' | 'dataItemKey' | 'initialDataState'> {
    toolbarSettings?: GridHelperToolbarSettings;
    onSelectionChange?: (event: GridSelectionChangeEvent) => void;
}

// ExternalFilter props
interface GridHelperExternalFilterProps {
    filterValue: string | null;
    onChange: (ev: InputChangeEvent) => void;
}

// ConfiguratorButtonBase props
interface GridHelperConfiguratorButtonBaseProps {
    options: Record<string, boolean>;
    title: string;
    icon: string;
    onChange: (setting: string, value: boolean) => void;
}

// ExpandCollapseButton props
interface GridHelperExpandCollapseButtonProps {
    onClick: () => void;
    collapse: boolean;
}

// ColumnsButton props
interface GridHelperColumnsButtonProps {
    options: Record<string, boolean>;
    onChange: (setting: string, value: boolean) => void;
}

// ConfiguratorButton props
interface GridHelperConfiguratorButtonProps {
    options: Pick<GridProps, 'filterable' | 'selectable' | 'sortable' | 'groupable' | 'pageable'>;
    onChange: (setting: keyof Pick<GridProps, 'filterable' | 'selectable' | 'sortable' | 'groupable' | 'pageable'>, value: boolean) => void;
}

// --------------------------
// Utilitaires
// --------------------------
export function getNestedValue(fieldName: string, dataItem: any) {
    const path = (fieldName || '').split('.');
    let data = dataItem;
    path.forEach((p) => {
        data = data ? data[p] : undefined;
    });
    return data;
}

const getHighlight = (value: string, filter: string) => {
    let index = value.toLocaleLowerCase().indexOf(filter.toLocaleLowerCase());
    if (index >= 0) {
        let left = value.substr(0, index);
        let right = value.substring(index + filter.length, value.length);
        return (
            <React.Fragment>
                {left}
                <span style={{ backgroundColor: '#a8edb3' }}>{value.substr(index, filter.length)}</span>
                {getHighlight(right, filter)}
            </React.Fragment>
        );
    }
    return value;
};

function highlightSearchTextInReactChildren(children: React.ReactNode, searchText: string) {
    function highlightInNode(node: React.ReactNode): React.ReactNode {
        if (typeof node === 'string') {
            const modifiedContent = node.replace(
                new RegExp(`(${searchText})`, 'gi'),
                '<span style="background-color:#a8edb3">$1</span>'
            );
            if (node !== modifiedContent) {
                return <span dangerouslySetInnerHTML={{ __html: modifiedContent }} />;
            }
        } else if (React.isValidElement(node)) {
            if (!node.props.children?.map) {
                return React.cloneElement(node, {}, highlightInNode(node.props.children));
            } else {
                return React.cloneElement(
                    node,
                    {},
                    node.props.children?.map((ch: React.ReactNode) => highlightInNode(ch))
                );
            }
        }
        return node;
    }
    return React.Children.map(children, (child: React.ReactNode) => {
        return highlightInNode(child);
    });
}

const getNumberOfItems = (data: any[], select: SelectDescriptor): number => {
    let count = 0;
    data.forEach((item) => {
        if (item.items) {
            count += getNumberOfItems(item.items, select);
        } else {
            count++;
        }
    });
    return count;
};

const generateGroupIds = (data: any[]): void => {
    data.forEach((item) => {
        if (item.aggregates) {
            item.groupId = item.field + '_' + item.value;
            generateGroupIds(item.items);
        }
    });
};

const getDataColumnsTitles = (gridChildren: React.ReactNode[]): Record<string, boolean> => {
    let columns: Record<string, boolean> = {};
    gridChildren.forEach((child: any) => {
        if (
            child.type.displayName === 'KendoReactGridColumn' &&
            child.props.field &&
            child.props.field !== 'selected'
        ) {
            columns[child.props.title ?? child.props.field] = true;
        }
    });
    return columns;
};

const getGridFieldColumns = (gridChildren: React.ReactNode[]): any[] => {
    let fieldColumns: Array<any> = [];
    gridChildren.map((child: any) => {
        if (
            child.type.displayName === 'KendoReactGridColumn' &&
            child.props &&
            child.props.field &&
            child.props.field !== 'selected'
        ) {
            fieldColumns.push(child.props);
        }
    });
    return fieldColumns;
};

const TOOLBAR_BUTTON_TYPE = 'primary';

// --------------------------
// Composant GridHelper
// --------------------------
export const GridHelper: React.FC<GridHelperProps> = (props) => {
    const {
        externalFilter,
        expandCollapseAllButton,
        excelExportButton,
        pdfExportButton,
        showColumnsConfigurator,
        showFeaturesConfigurator,
        filterHighlights
    } = props.toolbarSettings ?? {};

    const GridProps = props.children.props as GridProps;
    const [filterValue, setFilterValue] = React.useState<string | null>(null);

    // Needed for toggling features from the configurator
    const [defaultConfiguration, setDefaultConfiguration] = React.useState({
        filterable: props.filterable ?? GridProps.filterable,
        selectable: props.selectable ?? GridProps.selectable,
        sortable: props.sortable ?? GridProps.sortable,
        groupable: props.groupable ?? GridProps.groupable,
        pageable: props.pageable ?? GridProps.pageable
    });

    const [configuration, setConfiguration] = React.useState({
        ...defaultConfiguration
    });

    const [defaultData, setDefaultData] = React.useState<any[]>(
        (props.data ?? GridProps.data)?.map((dataItem: any) =>
            Object.assign({ selected: false }, dataItem)
        ) ?? []
    );
    const [data, setData] = React.useState<any[]>(defaultData);
    const [dataState, setDataState] = React.useState<State>(props.initialDataState ?? { skip: null });
    const [columnsState, setColumnsState] = React.useState(getDataColumnsTitles(GridProps.children));
    const [select, setSelect] = React.useState<SelectDescriptor>({});
    const [collapsedGroup, setCollapsedGroup] = React.useState<GroupExpandDescriptor[]>([]);
    const [total, setTotal] = React.useState(data.length);
    const [exportColumns, setExportColumns] = React.useState<any[]>(getGridFieldColumns(GridProps.children));

    // --------------------------
    // Effects for configuration
    // --------------------------
    React.useEffect(() => {
        setConfiguration({ ...configuration, pageable: props.pageable ?? GridProps.pageable });
    }, [props.pageable, GridProps.pageable]);

    React.useEffect(() => {
        setConfiguration({ ...configuration, filterable: props.filterable ?? GridProps.filterable });
    }, [props.filterable, GridProps.filterable]);

    React.useEffect(() => {
        setConfiguration({ ...configuration, groupable: props.groupable ?? GridProps.groupable });
    }, [props.groupable, GridProps.groupable]);

    React.useEffect(() => {
        setConfiguration({ ...configuration, selectable: props.selectable ?? GridProps.selectable });
    }, [props.selectable, GridProps.selectable]);

    React.useEffect(() => {
        setDefaultData(props.data ?? GridProps.data);
        setData(props.data ?? GridProps.data);
    }, [props.data, GridProps.data]);

    // --------------------------
    // Callbacks
    // --------------------------
    const updateConfiguration = (setting: keyof typeof configuration, state: boolean) => {
        const defaultValue = defaultConfiguration[setting];
        const newSettings = { ...configuration };
        newSettings[setting] = state ? (defaultValue ?? true) : false;

        if (setting === 'pageable') setDataState({ ...dataState, take: state ? 10 : undefined });
        else if (setting === 'groupable' && !state) setDataState({ ...dataState, group: undefined });
        else if (setting === 'filterable' && !state) setDataState({ ...dataState, filter: undefined });

        setConfiguration(newSettings);
    };

    const updateColumns = (setting: string, state: boolean) => {
        const newState = { ...columnsState };
        newState[setting] = state;
        setColumnsState(newState);
    };

    const onDataStateChange = (ev: { dataState: State }) => setDataState(ev.dataState);

    const onGroupExpandChange = React.useCallback((event: GridGroupExpandChangeEvent) => {
        setCollapsedGroup(event.groupExpand);
    }, []);

    const onSelectionChange = React.useCallback((event: GridSelectionChangeEvent) => {
        props.onSelectionChange?.(event);
        GridProps.onSelectionChange?.(event);
        setSelect(event.select);
    }, [props, GridProps]);

    const onHeaderSelectionChange = React.useCallback((event: GridHeaderSelectionChangeEvent) => {
        setSelect(event.select);
    }, [select]);

    const finalData = React.useMemo(() => {
        const processedData = process([...data], dataState);
        setTotal(processedData.total);
        generateGroupIds(processedData.data);
        return processedData;
    }, [data, dataState]);

    const onGroupsExpand = React.useCallback(() => {
        setCollapsedGroup(
            (finalData.data as any[]).reduce<GroupExpandDescriptor[]>((acc, item) => {
                acc.push({ field: item.field, value: item.value, expanded: true });
                return acc;
            }, [])
        );
    }, [finalData]);

    const onGroupsCollapse = React.useCallback(() => {
        const allGroups = groupBy(props.data, dataState.group) as GroupResult[];
        setCollapsedGroup(
            allGroups.reduce<GroupExpandDescriptor[]>((acc, item) => {
                acc.push({ field: item.field, value: item.value, expanded: false });
                return acc;
            }, [])
        );
    }, [props.data, dataState.group]);

    const headerSelectionValue = React.useCallback(() => {
        const selectedItems = Object.values(select).filter(Boolean).length;
        return (
            selectedItems > 0 &&
            finalData.data.length > 0 &&
            selectedItems === getNumberOfItems(finalData.data, select)
        );
    }, [select, finalData.data]);

    const onExternalFilterChange = (ev: InputChangeEvent) => {
        const value = ev.value;
        setFilterValue(value);
        const visibleColumnsFields: Record<string, boolean> = {};
        GridProps.children.forEach((child: any) => {
            if (child.type.displayName === 'KendoReactGridColumn' && columnsState[child.props.title ?? child.props.field]) {
                visibleColumnsFields[child.props.field] = true;
            }
        });

        const newData = defaultData.filter((item: any) => {
            let match = false;
            for (const property in visibleColumnsFields) {
                if (visibleColumnsFields[property]) {
                    const nestedValue = getNestedValue(property, item);
                    if (
                        nestedValue?.toString().toLowerCase().indexOf(value?.toLowerCase() ?? '') >= 0 ||
                        (nestedValue?.toLocaleDateString && nestedValue.toLocaleDateString().indexOf(value ?? '') >= 0)
                    ) {
                        match = true;
                    }
                }
            }
            return match;
        });
        setData(newData);
    };

    const FilterHighlightCell: React.FC<GridCustomCellProps> = React.useCallback(
        (props: GridCustomCellProps) => {
            if (props.rowType === 'data') {
                const value = getNestedValue(props.field!, props.dataItem)?.toString();
                if (!value) return <td {...props.tdProps}>{props.children}</td>;
                if (filterValue && filterValue.length > 0 && value.toLowerCase().includes(filterValue.toLowerCase())) {
                    const children = highlightSearchTextInReactChildren(props.children, filterValue);
                    return <td {...props.tdProps}>{children}</td>;
                }
            }
            return <td {...props.tdProps}>{props.children}</td>;
        },
        [filterValue]
    );

    const _pdfExport = React.useRef<GridPDFExport | null>(null);
    const exportToPdf = () => { _pdfExport.current?.save(); };

    const _excelExport = React.useRef<ExcelExport | null>(null);
    const exportToExcel = () => { _excelExport.current?.save(); };

    const hasCollapsed = collapsedGroup.some((g) => !g.expanded);

    // --------------------------
    // Toolbar & Children
    // --------------------------
    const gridChildren = React.useMemo(() => {
        const toolBar = GridProps.children.find((c: any) => c.type.displayName === 'KendoReactGridToolbar');
        const gridToolBar = (
            <GridToolbar {...toolBar?.props}>
                {expandCollapseAllButton && configuration.groupable && (
                    <div>
                        <ExpandCollapseButton onClick={hasCollapsed ? onGroupsExpand : onGroupsCollapse} collapse={!hasCollapsed} />
                    </div>
                )}
                {externalFilter && (
                    <div>
                        <ExternalFilter filterValue={filterValue} onChange={onExternalFilterChange} />
                    </div>
                )}
                {toolBar?.props.children && <div>{toolBar.props.children}</div>}
                <div style={{ right: '15px', float: 'right', position: 'absolute', display: 'flex', gap: '8px' }}>
                    {excelExportButton && (
                        <Button onClick={exportToExcel} themeColor={TOOLBAR_BUTTON_TYPE} size="small" title="Export to Excel" svgIcon={fileExcelIcon} />
                    )}
                    {pdfExportButton && (
                        <Button onClick={exportToPdf} themeColor={TOOLBAR_BUTTON_TYPE} size="small" title="Export to PDF" svgIcon={filePdfIcon} />
                    )}
                    {showColumnsConfigurator && <ColumnsButton onChange={updateColumns} options={columnsState} />}
                    {showFeaturesConfigurator && <ConfiguratorButton onChange={updateConfiguration} options={configuration} />}
                </div>
            </GridToolbar>
        );

        return GridProps.children.map((child: any, index: number) => {
            if (child.type.displayName === 'KendoReactGridColumn') {
                if (child.props.columnType === 'checkbox') return <Column key={index} {...child.props} headerSelectionValue={headerSelectionValue()} />;
                if (columnsState[child.props.title ?? child.props.field] || !child.props.field) return <Column {...child.props} key={index} />;
            } else if (child.type.displayName === 'KendoReactGridToolbar') return null;
            return child;
        }).concat(props.toolbarSettings ? [gridToolBar] : toolBar ? [toolBar] : []);
    }, [GridProps.children, columnsState, configuration, filterValue, hasCollapsed]);

    const gridRef = React.useRef<Grid>(null);

    const renderedGridProps: GridProps = {
        ...GridProps,
        dataItemKey: props.dataItemKey ?? GridProps.dataItemKey,
        data: finalData,
        select,
        onSelectionChange,
        onHeaderSelectionChange,
        onGroupExpandChange,
        onDataStateChange,
        groupExpand: collapsedGroup,
        children: gridChildren,
        ...configuration,
        ref: gridRef,
        ...dataState
    };

    if (filterHighlights) renderedGridProps.cells = { data: FilterHighlightCell };

    const GridComponent = <Grid {...renderedGridProps} />;

    return (
        <React.Fragment>
            <GridPDFExport ref={_pdfExport} margin="1cm">{GridComponent}</GridPDFExport>
            <ExcelExport data={finalData} ref={_excelExport} columns={exportColumns.filter((col) => columnsState[col.title ?? col.field])} group={dataState.group} />
            {GridComponent}
        </React.Fragment>
    );
};

// --------------------------
// Components auxiliaires
// --------------------------
const ExternalFilter: React.FC<GridHelperExternalFilterProps> = ({ filterValue, onChange }) => (
    <React.Fragment>
        <span style={{ padding: '5px' }}>Search: </span>
        <span>
            <Input value={filterValue ?? ''} onChange={onChange} style={{ border: '2px solid #ccc', boxShadow: 'inset 0px 0px 0.5px 0px rgba(0,0,0,0.1)' }} />
        </span>
    </React.Fragment>
);

const ExpandCollapseButton: React.FC<GridHelperExpandCollapseButtonProps> = ({ onClick, collapse }) => (
    <Button onClick={onClick} themeColor={TOOLBAR_BUTTON_TYPE} size="small" title={`${!collapse ? 'Expand' : 'Collapse'} all groups`} svgIcon={collapse ? chevronDoubleDownIcon : chevronDoubleRightIcon} />
);

const ConfiguratorButtonBase: React.FC<GridHelperConfiguratorButtonBaseProps> = ({ options, icon, title, onChange }) => {
    const anchor = React.useRef<HTMLSpanElement>(null);
    const [show, setShow] = React.useState(false);
    const handleClick = () => setShow(!show);
    const handleChange = (ev: any) => {
        const setting = ev.target.element.attributes['data-attr'].value;
        onChange(setting, ev.value);
    };

    React.useEffect(() => {
        const onMouseDown = (event: MouseEvent) => {
            const wrappingEl = document.querySelector('.configurator-wrap-element');
            if (wrappingEl && !wrappingEl.contains(event.target as Node)) setShow(false);
        };
        window.addEventListener('mousedown', onMouseDown);
        return () => window.removeEventListener('mousedown', onMouseDown);
    }, []);

    return (
        <React.Fragment>
            <span ref={anchor} title={title}>
                <Button onClick={handleClick} themeColor={TOOLBAR_BUTTON_TYPE} svgIcon={icon} size="small" />
            </span>
            <Popup margin={{ vertical: 10, horizontal: 0 }} anchor={anchor.current} anchorAlign={{ vertical: 'bottom', horizontal: 'right' }} popupAlign={{ vertical: 'top', horizontal: 'right' }} show={show}>
                <div className="configurator-wrap-element" style={{ padding: '10px', backgroundColor: '#fefefe', border: '1px solid #ddd' }}>
                    <div style={{ paddingBottom: '5px' }}>{title}:</div>
                    <div>
                        {Object.keys(options).map((setting, index) => {
                            const checked = options[setting] != null && options[setting] !== false;
                            return (
                                <div style={{ padding: '3px 5px 5px 0px' }} key={index}>
                                    <div style={{ width: '20px', display: 'inline-block' }}>
                                        <Checkbox value={checked} onChange={handleChange} data-attr={setting} />
                                    </div>
                                    {setting.charAt(0).toUpperCase() + setting.slice(1)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Popup>
        </React.Fragment>
    );
};

const ColumnsButton: React.FC<GridHelperColumnsButtonProps> = (props) => <ConfiguratorButtonBase {...props} icon={columnsIcon} title="Show/Hide Columns" />;
const ConfiguratorButton: React.FC<GridHelperConfiguratorButtonProps> = (props) => <ConfiguratorButtonBase {...props} icon={gearIcon} title="Settings" />;
